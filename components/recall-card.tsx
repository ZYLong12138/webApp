"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Volume2, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"

// 修改RecallCard组件，移除"下一个"按钮，只保留结果按钮

// 首先，修改组件的props类型，移除onNext属性
interface RecallCardProps {
  word: {
    id: string | number
    word: string
    definition: string
    example?: string
    pronunciation?: string
    current_interval?: number
    ease_factor?: number
    review_count?: number
    repeatCount?: number // 添加重复次数属性
  }
  onResult: (result: "again" | "hard" | "good" | "easy") => void
  repeatCount?: number // 当前重复次数
  maxRepeatCount?: number // 最大重复次数
}

// 然后，修改组件实现，移除"下一个"按钮相关代码
export function RecallCard({ word, onResult, repeatCount = 0, maxRepeatCount = 5 }: RecallCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [hasAnswered, setHasAnswered] = useState(false)

  // Reset state when word changes
  useEffect(() => {
    setIsFlipped(false)
    setHasAnswered(false)
  }, [word.id, repeatCount]) // 添加 repeatCount 作为依赖项，确保重复单词时也会重置状态

  // Handle card flip
  const handleFlip = () => {
    if (!hasAnswered) {
      setIsFlipped(!isFlipped)
    }
  }

  // Handle result selection
  const handleResult = (result: "again" | "hard" | "good" | "easy") => {
    setHasAnswered(true)
    onResult(result)

    // Automatically move to next card after a short delay
    setTimeout(() => {}, 800)
  }

  // Play pronunciation
  const playPronunciation = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card flip
    console.log(`播放单词 "${word.word}" 的发音`)
  }

  // Get interval text
  const getIntervalText = () => {
    if (!word.current_interval) return "首次复习"
    if (word.current_interval < 1) return "今日复习"
    if (word.current_interval === 1) return "1天后复习"
    return `${Math.round(word.current_interval)}天后复习`
  }

  // 移除不需要的 handleNext 函数，因为我们已经自动跳转到下一个单词
  const handleNext = () => {
    setIsFlipped(false)
    setHasAnswered(false)
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <Card className="overflow-hidden">
        <div className="perspective">
          {/* 添加卡片位置指示器 */}
          <div className="absolute top-2 right-2 z-10">
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              #{repeatCount > 0 ? "重复" : "原始"}
            </span>
          </div>
          <div
            className={`flip-card-inner transition-transform duration-500 ${isFlipped ? "rotate-y-180" : ""}`}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Card front - word */}
            <CardContent
              className={`p-8 min-h-[300px] flex flex-col items-center justify-center cursor-pointer ${
                isFlipped ? "backface-hidden" : ""
              }`}
              onClick={handleFlip}
            >
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <h2 className="text-3xl font-bold text-gray-800">{word.word}</h2>
                  <Button variant="ghost" size="icon" className="ml-2" onClick={playPronunciation}>
                    <Volume2 className="h-5 w-5 text-gray-500" />
                  </Button>
                </div>
                {word.pronunciation && <p className="text-gray-500 text-sm mb-4">{word.pronunciation}</p>}

                {/* Show repeat count warning */}
                {repeatCount > 0 && (
                  <div className="mt-2 flex items-center justify-center text-amber-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span className="text-xs">
                      已重复 {repeatCount}/{maxRepeatCount} 次
                    </span>
                  </div>
                )}

                <p className="text-sm text-gray-500 mt-6">点击卡片查看答案</p>
              </div>
            </CardContent>

            {/* Card back - definition */}
            <CardContent
              className={`p-8 min-h-[300px] flex flex-col items-center justify-center cursor-pointer absolute inset-0 ${
                isFlipped ? "" : "backface-hidden"
              }`}
              style={{ transform: "rotateY(180deg)" }}
              onClick={handleFlip}
            >
              <div className="text-center">
                <div className="text-xl font-semibold mb-4">{word.definition}</div>
                {word.example && <div className="text-sm text-gray-600 italic mb-4">"{word.example}"</div>}
                <div className="text-sm text-gray-500 mt-4">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md">{getIntervalText()}</span>
                  {word.review_count !== undefined && (
                    <span className="ml-2 bg-green-50 text-green-700 px-2 py-1 rounded-md">
                      已复习 {word.review_count} 次
                    </span>
                  )}
                </div>

                {/* Show repeat count warning */}
                {repeatCount > 0 && (
                  <div className="mt-2 flex items-center justify-center text-amber-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span className="text-xs">
                      已重复 {repeatCount}/{maxRepeatCount} 次
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </div>
        </div>

        <CardFooter className="flex flex-col gap-4 p-6 border-t">
          <div className="text-sm text-center text-muted-foreground">
            {isFlipped ? "评价你的记忆程度" : "尝试回忆这个单词的意思"}
          </div>
          {isFlipped && !hasAnswered && (
            <div className="grid grid-cols-4 gap-2 w-full">
              <Button
                variant="outline"
                className="border-red-500 hover:bg-red-500/10"
                onClick={() => handleResult("again")}
                disabled={repeatCount >= maxRepeatCount} // Disable "don't remember" button if max repeat count reached
              >
                不记得
              </Button>
              <Button
                variant="outline"
                className="border-orange-500 hover:bg-orange-500/10"
                onClick={() => handleResult("hard")}
              >
                困难
              </Button>
              <Button
                variant="outline"
                className="border-yellow-500 hover:bg-yellow-500/10"
                onClick={() => handleResult("good")}
              >
                一般
              </Button>
              <Button
                variant="outline"
                className="border-green-500 hover:bg-green-500/10"
                onClick={() => handleResult("easy")}
              >
                简单
              </Button>
            </div>
          )}
          {hasAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            ></motion.div>
          )}

          {/* Show warning if max repeat count reached */}
          {isFlipped && !hasAnswered && repeatCount >= maxRepeatCount && (
            <div className="text-xs text-red-500 text-center mt-2">已达到最大重复次数，请选择其他选项</div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
