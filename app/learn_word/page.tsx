"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { useState, useEffect } from "react"
import { getBookById, getBookWordCount, getWordsByLevel } from "@/services/vocabulary-service"
import { WordCardSelection } from "@/components/word-card-selection"
import { WordLearningCard } from "@/components/word-learning-card"
import type { VocabularyWord } from "@/types/vocabulary"
import { useTheme } from "@/contexts/theme-context"
import { useStudyTimeTracker } from "@/hooks/use-study-time-tracker"
import { updateStudyLog } from "@/services/study-log-service"

export default function LearnWordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookId = searchParams.get("bookId") || undefined
  const level = Number.parseInt(searchParams.get("level") || "1", 10)
  const [bookTitle, setBookTitle] = useState<string>("词汇学习")
  const [isSelectionMode, setIsSelectionMode] = useState(true)
  const [selectedWords, setSelectedWords] = useState<VocabularyWord[]>([])
  const { theme } = useTheme()

  // 在 LearnWordPage 组件中添加 allLevelWords 状态
  const [allLevelWords, setAllLevelWords] = useState<VocabularyWord[]>([])

  // 使用学习时间跟踪器
  const { startTracking, stopTracking } = useStudyTimeTracker("learn", bookId)

  // 开始跟踪学习时间
  useEffect(() => {
    startTracking()

    // 组件卸载时停止跟踪
    return () => {
      stopTracking()
    }
  }, [])

  // 获取词书信息
  useEffect(() => {
    const fetchBookInfo = async () => {
      if (bookId) {
        try {
          const book = await getBookById(bookId)
          if (book) {
            // 获取词书的总单词数量
            const count = await getBookWordCount(bookId)
            // 计算总关卡数
            const totalLevels = Math.ceil(count / 50)

            setBookTitle(`${book.book_name} - 第${level}关${level < totalLevels ? ` (共${totalLevels}关)` : ""}`)

            // 获取当前关卡的所有单词
            const levelWords = await getWordsByLevel(bookId, level)
            setAllLevelWords(levelWords)
          }
        } catch (error) {
          console.error("获取词书信息失败:", error)
        }
      }
    }

    fetchBookInfo()
  }, [bookId, level])

  // 处理学习完成
  const handleLearningComplete = async () => {
    // 更新打卡记录
    await updateStudyLog()
    setIsSelectionMode(true)
  }

  // 处理返回
  const handleBack = () => {
    router.back()
  }

  // 处理开始学习
  const handleStartLearning = (words: VocabularyWord[]) => {
    setSelectedWords(words)
    setIsSelectionMode(false)
  }

  // 根据当前主题决定容器类名
  const getContainerClass = () => {
    switch (theme) {
      case "dusk-rose":
        return "min-h-screen gem-gradient-bg"
      case "zephyr-jasmine":
        return "min-h-screen jasmine-gradient-bg"
      default:
        return "min-h-screen bg-gray-50"
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <div className={getContainerClass()}>
        {isSelectionMode ? (
          <WordCardSelection
            bookId={bookId}
            level={level}
            onComplete={handleBack}
            onStartLearning={handleStartLearning}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-2xl mx-auto w-full">
            <WordLearningCard
              words={selectedWords}
              onComplete={handleLearningComplete}
              bookId={bookId}
              level={level}
              allLevelWords={allLevelWords}
            />
          </div>
        )}
      </div>
    </ThemeProvider>
  )
}
