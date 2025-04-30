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
import { CheckCircle2 } from "lucide-react"
import type { ReviewResult } from "@/types/review"

interface SpacedReviewSessionProps {
  words: any[]
  onComplete: () => void
}

export function SpacedReviewSession({ words, onComplete }: SpacedReviewSessionProps) {
  const { toast } = useToast()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [reviewedWords, setReviewedWords] = useState<Record<string, ReviewResult>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  })

  // 当所有单词复习完成时，显示总结对话框
  useEffect(() => {
    if (currentIndex >= words.length && words.length > 0) {
      // 计算统计数据
      const stats = {
        total: words.length,
        again: 0,
        hard: 0,
        good: 0,
        easy: 0,
      }

      Object.values(reviewedWords).forEach((result) => {
        stats[result]++
      })

      setSummaryStats(stats)
      setShowSummary(true)
    }
  }, [currentIndex, words.length, reviewedWords])

  // 处理下一个单词
  const handleNext = () => {
    setCurrentIndex((prev) => prev + 1)
  }

  // 处理复习结果
  const handleResult = async (result: ReviewResult) => {
    if (!words[currentIndex]) return

    const wordId = words[currentIndex].id
    const reviewItemId = words[currentIndex].id

    setIsSubmitting(true)
    try {
      // 提交复习结果到服务器
      await submitReviewResult(reviewItemId, result)

      // 更新本地状态
      setReviewedWords((prev) => ({
        ...prev,
        [wordId]: result,
      }))
    } catch (error) {
      console.error("提交复习结果失败:", error)
      toast({
        title: "提交失败",
        description: "无法保存复习结果，请重试",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理完成复习
  const handleFinish = () => {
    setShowSummary(false)
    onComplete()
  }

  // 如果没有单词需要复习
  if (words.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">没有需要复习的单词</h2>
        <p className="text-gray-600 mb-6">今天没有需要复习的单词，请明天再来</p>
        <Button onClick={onComplete}>返回</Button>
      </div>
    )
  }

  // 如果已经复习完所有单词
  if (currentIndex >= words.length) {
    return null // 显示总结对话框
  }

  // 当前单词
  const currentWord = words[currentIndex]
  const progress = ((currentIndex + 1) / words.length) * 100

  return (
    <>
      <div className="max-w-2xl mx-auto">
        {/* 进度条 */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>复习进度</span>
            <span>
              {currentIndex + 1} / {words.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* 回忆卡片 */}
        <RecallCard word={currentWord} onNext={handleNext} onResult={handleResult} />
      </div>

      {/* 复习总结对话框 */}
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
    </>
  )
}
