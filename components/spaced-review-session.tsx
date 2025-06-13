"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RecallCard } from "./recall-card"
import { submitReviewResult } from "@/services/review-service"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { CheckCircle2, X } from "lucide-react"
import type { ReviewResult } from "@/types/review"
import { useRouter } from "next/navigation"

// 定义内存中的复习项类型
interface ReviewItem {
  id: string | number
  word: string
  definition: string
  example?: string
  pronunciation?: string
  current_interval: number
  ease_factor: number
  review_count: number
  next_review_date: string
  // 添加本地状态跟踪
  reviewed: boolean
  result?: ReviewResult
  originalId: number // 保存原始ID用于批量更新
  repeatCount?: number // 跟踪单词在当前会话中被重复的次数
}

interface SpacedReviewSessionProps {
  words: any[]
  onComplete: () => void
  isLoading?: boolean
  error?: string | null
}

// 用于存储已复习单词的sessionStorage键名
const REVIEWED_WORDS_KEY = "recently_reviewed_words"

export function SpacedReviewSession({
  words = [], // 提供默认值，防止undefined
  onComplete,
  isLoading = false,
  error = null,
}: SpacedReviewSessionProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  })
  const [completedReviews, setCompletedReviews] = useState<ReviewItem[]>([])
  const [isSessionComplete, setIsSessionComplete] = useState(false)
  // 新增：跟踪已复习的原始单词ID
  const [reviewedOriginalWords, setReviewedOriginalWords] = useState<Set<number>>(new Set())
  // 新增：最大重复次数限制
  const MAX_REPEAT_COUNT = 5
  // 新增：是否显示手动结束会话对话框
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false)

  // 初始化复习队列
  useEffect(() => {
    if (words && words.length > 0) {
      // 将API返回的单词转换为内部ReviewItem格式
      const initialQueue = words.map((word) => ({
        ...word,
        reviewed: false,
        originalId: word.id,
        repeatCount: 0, // 初始化重复次数为0
      }))

      // 按照next_review_date排序
      const sortedQueue = sortReviewQueue(initialQueue)
      setReviewQueue(sortedQueue)
    }
  }, [words])

  // 排序复习队列的辅助函数
  const sortReviewQueue = (queue: ReviewItem[]): ReviewItem[] => {
    return [...queue].sort((a, b) => {
      const dateA = new Date(a.next_review_date).getTime()
      const dateB = new Date(b.next_review_date).getTime()
      return dateA - dateB
    })
  }

  // 检查是否所有原始单词都已复习
  const isAllOriginalWordsReviewed = () => {
    return words && words.length > 0 && words.every((word) => reviewedOriginalWords.has(word.id))
  }

  // 检查复习会话是否完成
  const checkSessionComplete = () => {
    // 如果没有单词需要复习，直接返回
    if (!words || words.length === 0) return

    // 会话完成条件：队列为空 且 所有原始单词都已复习
    const queueIsEmpty = reviewQueue.length === 0
    const allOriginalWordsReviewed = isAllOriginalWordsReviewed()

    // 检查是否只剩最后一个单词且已达到最大重复次数
    const hasOnlyLastWordAtMaxRepeat =
      reviewQueue.length === 1 &&
      reviewQueue[0].repeatCount !== undefined &&
      reviewQueue[0].repeatCount >= MAX_REPEAT_COUNT

    console.log(
      `检查会话完成状态: 所有原始单词已复习=${allOriginalWordsReviewed}, 队列为空=${queueIsEmpty}, 队列长度=${reviewQueue.length}, 最后单词达到最大重复=${hasOnlyLastWordAtMaxRepeat}`,
    )

    // 会话完成条件：队列为空 或 (所有原始单词已复习且只剩最后一个单词达到最大重复次数)
    if (allOriginalWordsReviewed && (queueIsEmpty || hasOnlyLastWordAtMaxRepeat) && !isSessionComplete) {
      console.log("会话完成条件满足，准备显示总结")

      // 如果队列中还有最后一个单词，强制清空队列
      if (reviewQueue.length > 0) {
        setReviewQueue([])
      }

      // 计算统计数据
      const stats = {
        total: completedReviews.length,
        again: completedReviews.filter((item) => item.result === "again").length,
        hard: completedReviews.filter((item) => item.result === "hard").length,
        good: completedReviews.filter((item) => item.result === "good").length,
        easy: completedReviews.filter((item) => item.result === "easy").length,
      }

      setSummaryStats(stats)
      setShowSummary(true)
      setIsSessionComplete(true)

      // 批量更新数据库
      batchUpdateReviews()
    }
  }

  // 监听队列和已复习单词的变化，检查会话是否完成
  useEffect(() => {
    checkSessionComplete()
  }, [reviewQueue, reviewedOriginalWords])

  // 批量更新复习结果到数据库
  const batchUpdateReviews = async () => {
    try {
      // 显示正在同步的提示
      toast({
        title: "正在同步复习结果",
        description: "请稍候，正在将您的复习结果保存到数据库...",
      })

      // 准备批量更新数据
      const updatePromises = completedReviews.map(async (review) => {
        if (review.result) {
          try {
            console.log(`正在更新复习结果: ID=${review.originalId}, 结果=${review.result}`)
            const success = await submitReviewResult(review.originalId, review.result)
            if (!success) {
              console.warn(`更新复习结果失败 (ID: ${review.originalId}): 未找到对应的复习项或创建失败`)
            }
            return success
          } catch (error) {
            console.error(`更新复习结果失败 (ID: ${review.originalId}):`, error)
            return false
          }
        }
        return false
      })

      // 等待所有更新完成
      const results = await Promise.all(updatePromises)
      const successCount = results.filter(Boolean).length

      console.log(`所有复习结果已同步到数据库: ${successCount}/${completedReviews.length} 成功`)

      if (successCount === completedReviews.length) {
        toast({
          title: "同步成功",
          description: `所有 ${successCount} 个复习结果已成功同步`,
          variant: "default",
        })
      } else if (successCount > 0) {
        toast({
          title: "部分同步成功",
          description: `${successCount}/${completedReviews.length} 个复习结果已成功同步`,
          variant: "warning",
        })
      } else {
        toast({
          title: "同步失败",
          description: "无法将复习结果同步到数据库",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("批量更新复习结果失败:", error)
      toast({
        title: "同步失败",
        description: "无法将复习结果同步到数据库，请稍后再试",
        variant: "destructive",
      })
    }
  }

  // 生成随机偏移量，偏向于较大的数字
  const generateOffset = (): number => {
    // 可能的偏移量
    const offsets = [3, 4, 5, 6, 7, 8, 9]

    // 权重，使7,8,9的概率更高
    const weights = [0.05, 0.05, 0.1, 0.1, 0.2, 0.25, 0.25]

    // 生成0-1之间的随机数
    const random = Math.random()

    // 根据权重选择偏移量
    let sum = 0
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i]
      if (random < sum) {
        return offsets[i]
      }
    }

    // 默认返回最大偏移量
    return 9
  }

  // 找到新卡片应该插入的位置
  const findInsertPosition = (queue: ReviewItem[]): number => {
    // 计算插入位置
    const offset = generateOffset()

    // 注意：此时队列中仍包含当前卡片（在索引0的位置）
    // 我们需要确保新卡片至少插入到索引1的位置
    const insertPosition = Math.max(1, offset)

    // 如果插入位置超出队列长度，则插入到队列末尾
    if (insertPosition >= queue.length) {
      return queue.length
    }

    return insertPosition
  }

  // 处理复习结果 - 使用队列头部控制
  const handleResult = (result: ReviewResult) => {
    // 确保队列不为空
    if (reviewQueue.length === 0) return

    // 获取当前卡片（队列头部）
    const currentCard = reviewQueue[0]

    console.log(`处理结果: ${result} 当前单词: ${currentCard.word}, 队列长度: ${reviewQueue.length}`)

    // 标记为已复习
    setReviewedOriginalWords((prev) => {
      const newSet = new Set(prev)
      newSet.add(currentCard.originalId)
      return newSet
    })

    // 添加到已完成列表
    setCompletedReviews((prev) => [...prev, { ...currentCard, reviewed: true, result }])

    // 更新队列 - 关键是处理顺序
    setReviewQueue((prev) => {
      // 创建新队列的副本
      const newQueue = [...prev]

      // 特殊情况：如果队列中只有一个单词且结果是"again"，则不删除该单词，只增加重复计数
      if (newQueue.length === 1 && result === "again") {
        const repeatCount = (currentCard.repeatCount || 0) + 1

        if (repeatCount < MAX_REPEAT_COUNT) {
          // 更新当前卡片的重复计数，但保持它在队列中
          newQueue[0] = {
            ...currentCard,
            repeatCount: repeatCount,
            // 更新ID以确保React能识别为新组件
            id: `${currentCard.id}-repeat-${repeatCount}-${Date.now()}`,
          }

          console.log(`队列中只有最后一个单词，增加重复计数: ${repeatCount}，保持在队列中`)

          // 记录这个事件
          console.log(`最后单词循环: ${currentCard.word}, 重复次数: ${repeatCount}`)

          return newQueue
        } else {
          console.log(`单词 ${currentCard.word} 已达到最大重复次数 ${MAX_REPEAT_COUNT}`)
          toast({
            title: "已达到最大重复次数",
            description: `这个单词已经复习了${MAX_REPEAT_COUNT}次，将不再重复`,
            variant: "warning",
          })

          // 达到最大重复次数，移除该单词
          newQueue.shift()
          return newQueue
        }
      }

      // 正常情况：移除当前卡片（队列头部）
      newQueue.shift()

      // 如果是"不记得"，且未达到最大重复次数，则插入新卡片
      if (result === "again") {
        const repeatCount = (currentCard.repeatCount || 0) + 1

        if (repeatCount < MAX_REPEAT_COUNT) {
          // 创建新的复习项，确保重置reviewed状态
          const newReviewItem = {
            ...currentCard,
            reviewed: false,
            result: undefined,
            repeatCount: repeatCount,
            // 添加一个唯一标识符，确保React能识别为新组件
            id: `${currentCard.id}-repeat-${repeatCount}-${Date.now()}`,
          }

          // 找到合适的插入位置
          const insertIndex = findInsertPosition(newQueue)
          newQueue.splice(insertIndex, 0, newReviewItem)

          console.log(`插入新卡片到位置 ${insertIndex}, 队列长度更新为: ${newQueue.length}`)
        } else {
          console.log(`单词 ${currentCard.word} 已达到最大重复次数 ${MAX_REPEAT_COUNT}`)
          toast({
            title: "已达到最大重复次数",
            description: `这个单词已经复习了${MAX_REPEAT_COUNT}次，将不再重复`,
            variant: "warning",
          })
        }
      }

      return newQueue
    })
  }

  // 手动结束会话
  const handleEndSession = () => {
    // 将所有未复习的原始单词标记为已复习
    if (words && words.length > 0) {
      const remainingOriginalIds = words.map((word) => word.id).filter((id) => !reviewedOriginalWords.has(id))

      if (remainingOriginalIds.length > 0) {
        setReviewedOriginalWords((prev) => {
          const newSet = new Set(prev)
          remainingOriginalIds.forEach((id) => newSet.add(id))
          return newSet
        })

        toast({
          title: "会话已手动结束",
          description: `跳过了${remainingOriginalIds.length}个未复习的单词`,
        })
      }
    }

    // 清空队列，触发会话完成
    setReviewQueue([])

    // 关闭对话框
    setShowEndSessionDialog(false)
  }

  // 保存已复习的单词到sessionStorage
  const saveReviewedWords = () => {
    try {
      // 提取已复习单词的必要信息
      const reviewedWords = words
        .filter((word) => reviewedOriginalWords.has(word.id))
        .map((word) => ({
          id: word.id,
          word: word.word,
          definition: word.definition,
          pronunciation: word.pronunciation,
          example: word.example,
          bookIds: word.bookIds || [],
        }))

      // 保存到sessionStorage
      sessionStorage.setItem(REVIEWED_WORDS_KEY, JSON.stringify(reviewedWords))
      console.log(`已保存${reviewedWords.length}个已复习单词到sessionStorage`)

      // 添加一个标记，表示这些单词来自复习会话
      sessionStorage.setItem("words_from_review", "true")
    } catch (error) {
      console.error("保存已复习单词失败:", error)
    }
  }

  // 完成复习的处理函数
  const handleFinish = () => {
    setShowSummary(false)

    // 保存已复习的单词
    saveReviewedWords()

    // 导航到词卡页面，展示刚刚复习的单词
    router.push("/review_card?from=review")

    // 确保调用onComplete回调
    onComplete()
  }

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">加载中...</h2>
        <p className="text-gray-600 mb-6">正在准备复习队列</p>
      </div>
    )
  }

  // 显示错误信息
  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4 text-red-600">出错了</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button onClick={onComplete}>返回</Button>
      </div>
    )
  }

  // 如果没有单词需要复习
  if (!words || words.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">没有需要复习的单词</h2>
        <p className="text-gray-600 mb-6">今天没有需要复习的单词，请明天再来</p>
        <Button onClick={onComplete}>返回</Button>
      </div>
    )
  }

  // 如果队列为空但会话未完成，显示加载状态
  if (reviewQueue.length === 0 && !isSessionComplete) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">加载中...</h2>
        <p className="text-gray-600 mb-6">正在准备复习队列</p>
      </div>
    )
  }

  // 渲染主要内容
  return (
    <>
      {/* 主要内容区域 */}
      <div className="max-w-2xl mx-auto">
        {/* 只有当队列不为空时才显示复习内容 */}
        {reviewQueue.length > 0 ? (
          <>
            {/* 进度条 */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>复习进度</span>
                <span>
                  {reviewedOriginalWords.size} / {words.length}
                </span>
              </div>
              <Progress value={(reviewedOriginalWords.size / words.length) * 100} className="h-2" />
            </div>
            {/* 队列状态信息 */}
            <div className="mb-4 p-2 bg-gray-50 rounded-md border border-gray-200">
              <div className="flex justify-between text-xs text-gray-500">
                <div>
                  <span className="font-medium">当前单词:</span> {reviewQueue[0].word}
                </div>
                <div>
                  <span className="font-medium">队列长度:</span> {reviewQueue.length}
                </div>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                <span className="font-medium">已复习原始单词:</span> {reviewedOriginalWords.size} / {words.length}
              </div>
            </div>

            {/* 详细队列状态 */}
            <details className="text-xs mt-1">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">显示队列详情</summary>
              <div className="mt-2 p-2 bg-gray-100 rounded-md overflow-auto max-h-32">
                {reviewQueue.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className={`mb-1 ${idx === 0 ? "bg-yellow-100 font-medium" : ""} ${item.reviewed ? "text-gray-400" : "text-gray-700"}`}
                  >
                    {idx}: {item.word}
                    {item.repeatCount ? ` (重复: ${item.repeatCount})` : ""}
                    {item.reviewed ? " ✓" : ""}
                    {idx === 0 ? " 👈 当前" : ""}
                  </div>
                ))}
              </div>
            </details>

            {/* 手动结束会话按钮 */}
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEndSessionDialog(true)}
                className="text-gray-500"
              >
                结束会话
              </Button>
            </div>

            {/* 回忆卡片 */}
            <RecallCard
              word={reviewQueue[0]}
              onResult={handleResult}
              repeatCount={reviewQueue[0].repeatCount || 0}
              maxRepeatCount={MAX_REPEAT_COUNT}
            />
          </>
        ) : (
          // 当队列为空且会话已完成时，显示一个空的占位内容
          isSessionComplete && (
            <div className="max-w-md mx-auto text-center py-12">
              <h2 className="text-2xl font-bold mb-4">复习已完成</h2>
              <p className="text-gray-600 mb-6">您已完成所有单词的复习</p>
            </div>
          )
        )}
      </div>

      {/* 复习总结对话框 - 无论队列是否为空，只要showSummary为true就显示 */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>复习完成</DialogTitle>
            <DialogDescription>您已完成今天的所有复习任务</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-2">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">复习完成！</h3>
              <p className="text-gray-600">您今天复习了 {summaryStats.total} 个单词</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-red-50 p-3 rounded-md">
                <div className="text-sm text-red-600">不记得</div>
                <div className="text-xl font-bold">{summaryStats.again}</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-md">
                <div className="text-sm text-orange-600">困难</div>
                <div className="text-xl font-bold">{summaryStats.hard}</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-md">
                <div className="text-sm text-yellow-600">一般</div>
                <div className="text-xl font-bold">{summaryStats.good}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-md">
                <div className="text-sm text-green-600">简单</div>
                <div className="text-xl font-bold">{summaryStats.easy}</div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleFinish}>完成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 手动结束会话确认对话框 */}
      <Dialog open={showEndSessionDialog} onOpenChange={setShowEndSessionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认结束会话</DialogTitle>
            <DialogDescription>您确定要结束当前复习会话吗？未复习的单词将被标记为已复习。</DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setShowEndSessionDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleEndSession}>
              <X className="h-4 w-4 mr-2" />
              结束会话
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
