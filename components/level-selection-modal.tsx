"use client"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getBookWordCount, getLevelProgress } from "@/services/vocabulary-service"
import { useToast } from "@/hooks/use-toast"

interface LevelSelectionModalProps {
  bookId: string
  bookName: string
  isOpen: boolean
  onClose: () => void
  onLevelSelect: (level: number) => void
}

export function LevelSelectionModal({ bookId, bookName, isOpen, onClose, onLevelSelect }: LevelSelectionModalProps) {
  const { toast } = useToast()
  const [totalWords, setTotalWords] = useState(0)
  const [totalLevels, setTotalLevels] = useState(0)
  const [completedLevels, setCompletedLevels] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentLevel, setCurrentLevel] = useState<number | null>(null)
  const wordsPerLevel = 50

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen) return

      setIsLoading(true)
      try {
        // 获取词书总单词数
        const count = await getBookWordCount(bookId)
        setTotalWords(count)

        // 计算总关卡数
        const levels = Math.ceil(count / wordsPerLevel)
        setTotalLevels(levels)

        // 获取已完成的关卡
        const progress = await getLevelProgress(bookId)
        setCompletedLevels(progress.completedLevels)
        setCurrentLevel(progress.currentLevel)
      } catch (error) {
        console.error("获取关卡数据失败:", error)
        toast({
          title: "加载失败",
          description: "获取关卡数据时出现错误",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [bookId, isOpen, toast])

  // 检查关卡是否已解锁
  const isLevelUnlocked = (level: number) => {
    // 第一关始终解锁
    if (level === 1) return true
    // 前一关已完成则解锁
    return completedLevels.includes(level - 1)
  }

  // 检查关卡是否已完成
  const isLevelCompleted = (level: number) => {
    return completedLevels.includes(level)
  }

  // 处理关卡选择
  const handleLevelSelect = (level: number) => {
    if (!isLevelUnlocked(level)) {
      toast({
        title: "关卡未解锁",
        description: "请先完成前一关卡",
        variant: "destructive",
      })
      return
    }

    onLevelSelect(level)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bookName}</DialogTitle>
          <DialogDescription>
            {totalLevels} 关卡 · 共 {totalWords} 词
          </DialogDescription>
          <DialogDescription>
            {bookName}词汇 {totalWords}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <span className="text-xs">章节选择</span>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-5 gap-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-md"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {[...Array(totalLevels)].map((_, index) => {
                const level = index + 1
                const isUnlocked = isLevelUnlocked(level)
                const isCompleted = isLevelCompleted(level)
                const isCurrent = currentLevel === level

                return (
                  <div
                    key={level}
                    className={`
                      relative p-2 rounded-md text-center cursor-pointer transition-all
                      ${isUnlocked ? "hover:bg-gray-100" : "opacity-60 cursor-not-allowed bg-gray-50"}
                      ${isCompleted ? "bg-green-50" : "bg-gray-50"}
                      ${isCurrent && !isCompleted ? "bg-blue-50 border border-blue-200" : ""}
                    `}
                    onClick={() => isUnlocked && handleLevelSelect(level)}
                  >
                    <div className="text-sm font-medium mb-1">第 {level} 章</div>
                    <div className="text-xs text-gray-500">{isCompleted ? "已练习" : "未练习"}</div>
                    {isCompleted && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

