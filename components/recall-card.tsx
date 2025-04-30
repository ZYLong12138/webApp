"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Volume2 } from "lucide-react"
import { motion } from "framer-motion"

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
  }
  onNext: () => void
  onResult: (result: "again" | "hard" | "good" | "easy") => void
}

export function RecallCard({ word, onNext, onResult }: RecallCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [hasAnswered, setHasAnswered] = useState(false)

  // 处理卡片翻转
  const handleFlip = () => {
    if (!hasAnswered) {
      setIsFlipped(!isFlipped)
    }
  }

  // 处理复习结果
  const handleResult = (result: "again" | "hard" | "good" | "easy") => {
    setHasAnswered(true)
    onResult(result)
  }

  // 播放单词发音
  const playPronunciation = (e: React.MouseEvent) => {
    e.stopPropagation() // 防止触发卡片翻转
    // 这里可以添加实际的发音逻辑
    console.log(`播放单词 "${word.word}" 的发音`)
  }

  // 获取间隔信息文本
  const getIntervalText = () => {
    if (!word.current_interval) return "首次复习"
    if (word.current_interval < 1) return "今日复习"
    if (word.current_interval === 1) return "1天后复习"
    return `${Math.round(word.current_interval)}天后复习`
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <Card className="overflow-hidden">
        <div className="perspective">
          <div
            className={`flip-card-inner transition-transform duration-500 ${isFlipped ? "rotate-y-180" : ""}`}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* 卡片正面 - 单词 */}
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
                <p className="text-sm text-gray-500 mt-6">点击卡片查看答案</p>
              </div>
            </CardContent>

            {/* 卡片背面 - 释义 */}
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
            >
              <Button variant="default" onClick={onNext} className="w-full">
                下一个
              </Button>
            </motion.div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
