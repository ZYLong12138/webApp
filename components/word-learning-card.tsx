"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Volume2, Check, X } from "lucide-react"
// 使用相对路径导入服务和类型
import { getVocabularyWords, updateMasteryLevel } from "../services/vocabulary-service"
import type { VocabularyWord } from "../types/vocabulary"

interface WordLearningCardProps {
  onComplete: () => void // 学习完成后的回调
  maxWordsToLearn?: number // 最大学习单词数量，默认为5
  bookId?: string // 可选的词书ID，用于过滤单词
}

export function WordLearningCard({ onComplete, maxWordsToLearn = 5, bookId }: WordLearningCardProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [words, setWords] = useState<VocabularyWord[]>([])
  const [learningWords, setLearningWords] = useState<VocabularyWord[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 获取单词数据
  useEffect(() => {
    const fetchWords = async () => {
      setIsLoading(true)
      try {
        const data = await getVocabularyWords()
        // 如果提供了bookId，可以在这里过滤单词
        // const filteredData = bookId ? data.filter(word => word.book_id === bookId) : data;
        setWords(data)

        // 随机打乱单词顺序
        const shuffled = [...data].sort(() => Math.random() - 0.5)
        // 只取指定数量的单词用于学习
        setLearningWords(shuffled.slice(0, Math.min(maxWordsToLearn, data.length)))
      } catch (error) {
        console.error("获取单词失败:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWords()
  }, [maxWordsToLearn, bookId])

  // 当前单词
  const currentWord = learningWords[currentWordIndex]

  // 为当前单词生成选项（1个正确答案和3个干扰项）
  const options = useMemo(() => {
    if (!currentWord || words.length < 4) return []

    // 正确答案
    const correctOption = {
      text: currentWord.definition,
      isCorrect: true,
    }

    // 从其他单词中随机选择3个作为干扰项
    const otherWords = words.filter((w) => w.id !== currentWord.id)
    const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5).slice(0, 3)

    const incorrectOptions = shuffledOthers.map((word) => ({
      text: word.definition,
      isCorrect: false,
    }))

    // 合并并打乱选项顺序
    return [...incorrectOptions, correctOption].sort(() => Math.random() - 0.5)
  }, [currentWord, words])

  // 计算进度百分比
  const progressPercentage = learningWords.length > 0 ? ((currentWordIndex + 1) / learningWords.length) * 100 : 0

  // 处理选项点击
  const handleOptionClick = (isCorrect: boolean, index: number) => {
    if (selectedOption !== null) return // 已经选择了选项，不允许再次选择

    setSelectedOption(index)
    setIsCorrect(isCorrect)
  }

  // 处理下一个单词
  const handleNextWord = () => {
    setSelectedOption(null)
    setIsCorrect(null)

    if (currentWordIndex < learningWords.length - 1) {
      setCurrentWordIndex((prev) => prev + 1)
    } else {
      // 所有单词学习完毕
      onComplete()
    }
  }

  // 处理"已掌握"按钮点击
  const handleMastered = async () => {
    if (currentWord) {
      try {
        // 更新掌握程度为3（熟悉）
        await updateMasteryLevel(currentWord.id, 3)
      } catch (error) {
        console.error("更新掌握程度失败:", error)
      }
    }
    handleNextWord()
  }

  // 处理"需要复习"按钮点击
  const handleNeedReview = async () => {
    if (currentWord) {
      try {
        // 更新掌握程度为1（有印象）
        await updateMasteryLevel(currentWord.id, 1)
      } catch (error) {
        console.error("更新掌握程度失败:", error)
      }
    }
    handleNextWord()
  }

  // 播放单词发音（模拟）
  const playPronunciation = () => {
    // 这里可以添加实际的发音逻辑
    console.log(`播放单词 "${currentWord?.word}" 的发音`)
  }

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center text-white">
        <p>加载中...</p>
      </div>
    )
  }

  if (learningWords.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center text-white">
        <p className="mb-4">没有可学习的单词</p>
        <Button onClick={onComplete}>返回</Button>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* 进度指示器 */}
      <div className="w-full mb-8">
        <div className="flex justify-between mb-2 text-white">
          <span>学习进度</span>
          <span>
            {currentWordIndex + 1} / {learningWords.length}
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2 bg-slate-700" />
      </div>

      {/* 单词卡片 */}
      {currentWord && (
        <div className="bg-slate-800 rounded-lg p-8 w-full mb-8">
          {/* 单词 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white">{currentWord.word}</h2>
            <Button variant="ghost" size="icon" className="rounded-full bg-slate-700" onClick={playPronunciation}>
              <Volume2 className="h-5 w-5 text-white" />
              <span className="sr-only">播放发音</span>
            </Button>
          </div>

          {/* 示例句子（如果有） */}
          {currentWord.example && <div className="text-slate-400 mb-6 text-center italic">"{currentWord.example}"</div>}

          {/* 选项网格 */}
          <div className="grid grid-cols-2 gap-4">
            {options.map((option, index) => (
              <button
                key={index}
                className={`p-4 rounded-md text-center transition-colors ${
                  selectedOption === index
                    ? option.isCorrect
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                    : "bg-slate-700 hover:bg-slate-600 text-white"
                } ${selectedOption !== null && option.isCorrect ? "ring-2 ring-green-500" : ""}`}
                onClick={() => handleOptionClick(option.isCorrect, index)}
                disabled={selectedOption !== null}
              >
                {option.text}
              </button>
            ))}
          </div>

          {/* 选择后的反馈 */}
          {selectedOption !== null && (
            <div className="mt-4 text-center">
              <p className={isCorrect ? "text-green-500" : "text-red-500"}>{isCorrect ? "回答正确!" : "回答错误!"}</p>
              <Button className="mt-2" onClick={handleNextWord}>
                下一个
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 底部按钮 */}
      <div className="flex gap-4 justify-center">
        <Button className="bg-green-600 hover:bg-green-700 flex items-center gap-2" onClick={handleMastered}>
          <Check className="h-4 w-4" />
          已掌握
        </Button>
        <Button variant="destructive" className="flex items-center gap-2" onClick={handleNeedReview}>
          <X className="h-4 w-4" />
          需要复习
        </Button>
      </div>
    </div>
  )
}

