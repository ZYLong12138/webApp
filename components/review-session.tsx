// 确保这是客户端代码
"use client"

import { useState, useEffect } from "react" // 导入 React 钩子函数
import { Button } from "@/components/ui/button" // 导入按钮组件
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" // 导入卡片组件，用于包装复习界面
import type { VocabularyWord } from "@/types/vocabulary" // 导入单词数据类型，用于描述每个单词的结构
import Flashcard from "./flashcard" // 导入 Flashcard 组件，用于展示每张卡片

// 定义 ReviewSession 组件的 props 类型
interface ReviewSessionProps {
  words: VocabularyWord[] // 要复习的单词列表
  onComplete: () => void // 完成复习时调用的回调函数
  onMasteryUpdated: () => void // 单词掌握程度更新时调用的回调函数
}

// 主组件
export function ReviewSession({ words, onComplete, onMasteryUpdated }: ReviewSessionProps) {
  const [reviewWords, setReviewWords] = useState<VocabularyWord[]>([]) // 用于存储复习单词的状态
  const [currentIndex, setCurrentIndex] = useState(0) // 当前单词的索引
  const [isStarted, setIsStarted] = useState(false) // 复习是否已经开始

  // 当传入的单词列表发生变化时，打乱单词顺序
  useEffect(() => {
    // 打乱单词顺序，确保每次复习的顺序不同
    const shuffled = [...words].sort(() => Math.random() - 0.5)
    setReviewWords(shuffled) // 更新复习单词的顺序
  }, [words])

  // 处理点击"开始复习"按钮
  const handleStart = () => {
    setIsStarted(true) // 设置复习状态为已开始
  }

  // 处理点击"下一个卡片"按钮
  const handleNextCard = () => {
    if (currentIndex < reviewWords.length - 1) {
      setCurrentIndex(currentIndex + 1) // 显示下一个单词
    } else {
      // 复习已完成，调用 onComplete 回调函数
      onComplete()
    }
  }

  // 如果单词列表为空，显示提示信息
  if (words.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>复习单词</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">你的词库还没有单词，先添加一些单词吧！</p>
          <Button onClick={onComplete}>返回</Button> {/* 返回按钮 */}
        </CardContent>
      </Card>
    )
  }

  // 如果复习未开始，显示准备界面
  if (!isStarted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>准备复习</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">准备好复习 {words.length} 个单词了吗？</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleStart}>开始复习</Button> {/* 开始复习按钮 */}
            <Button variant="outline" onClick={onComplete}>
              返回
            </Button>{" "}
            {/* 返回按钮 */}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 复习开始后的界面
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          复习进度: {currentIndex + 1} / {reviewWords.length} {/* 显示当前复习进度 */}
        </h2>
        <Button variant="outline" onClick={onComplete}>
          结束复习
        </Button>{" "}
        {/* 结束复习按钮 */}
      </div>
      {reviewWords.length > 0 && (
        <Flashcard
          word={reviewWords[currentIndex]} // 传递当前单词给 Flashcard 组件
          onNextCard={handleNextCard} // 传递下一个卡片的处理函数
          onMasteryUpdated={onMasteryUpdated} // 传递掌握程度更新的回调函数
        />
      )}
    </div>
  )
}

export default ReviewSession

