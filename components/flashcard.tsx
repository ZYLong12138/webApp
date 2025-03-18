"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import type { VocabularyWord } from "@/types/vocabulary"
import { updateMasteryLevel } from "@/services/vocabulary-service"
import { useToast } from "@/hooks/use-toast"

// 定义组件的 props 类型
interface FlashcardProps {
  word: VocabularyWord // 当前显示的单词数据
  onNextCard: () => void // 点击"下一个"按钮时调用的函数，切换到下一个卡片
  onMasteryUpdated: () => void // 单词掌握程度更新后调用的回调函数
}

// 主组件
export function Flashcard({ word, onNextCard, onMasteryUpdated }: FlashcardProps) {
  const { toast } = useToast()
  const [isFlipped, setIsFlipped] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // 处理卡片翻转
  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  // 处理掌握程度更新
  const handleMasteryUpdate = async (newLevel: number) => {
    setIsUpdating(true)
    try {
      await updateMasteryLevel(word.id, newLevel)
      toast({
        title: "进度已更新",
        description: "单词掌握程度已更新",
      })
      onMasteryUpdated()
      onNextCard()
      setIsFlipped(false)
    } catch (error) {
      toast({
        title: "更新失败",
        description: "更新掌握程度时出现错误",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 min-h-[200px] flex items-center justify-center cursor-pointer" onClick={handleFlip}>
        <div className="text-center">
          {isFlipped ? (
            <div className="space-y-4">
              <div className="text-xl font-semibold">{word.definition}</div>
              {word.example && <div className="text-sm text-muted-foreground italic">"{word.example}"</div>}
            </div>
          ) : (
            <div className="text-2xl font-bold">{word.word}</div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 p-6 border-t">
        <div className="text-sm text-center text-muted-foreground">
          {isFlipped ? "点击卡片隐藏答案" : "点击卡片查看答案"}
        </div>
        {isFlipped && (
          <div className="grid grid-cols-4 gap-2 w-full">
            <Button
              variant="outline"
              className="border-red-500 hover:bg-red-500/10"
              onClick={() => handleMasteryUpdate(0)}
              disabled={isUpdating}
            >
              不认识
            </Button>
            <Button
              variant="outline"
              className="border-orange-500 hover:bg-orange-500/10"
              onClick={() => handleMasteryUpdate(1)}
              disabled={isUpdating}
            >
              有印象
            </Button>
            <Button
              variant="outline"
              className="border-yellow-500 hover:bg-yellow-500/10"
              onClick={() => handleMasteryUpdate(2)}
              disabled={isUpdating}
            >
              认识
            </Button>
            <Button
              variant="outline"
              className="border-green-500 hover:bg-green-500/10"
              onClick={() => handleMasteryUpdate(3)}
              disabled={isUpdating}
            >
              熟悉
            </Button>
          </div>
        )}
        <Button variant="ghost" onClick={onNextCard} className="mt-2" disabled={isUpdating}>
          下一个
        </Button>
      </CardFooter>
    </Card>
  )
}

export default Flashcard

