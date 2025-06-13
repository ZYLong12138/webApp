"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { getBookById, getWordsByLevel, getBookWordCount, getLevelProgress } from "@/services/vocabulary-service"
import { getReviewedWords } from "@/services/review-service"
import { VocabularyList } from "@/components/vocabulary-list"
import { ReviewCardButton } from "@/Integration_modules/review-card-button"
import { LevelSelectionButton } from "@/Integration_modules/level-selection-button"
import type { VocabularyBook, VocabularyWord } from "@/types/vocabulary"
import { ScrollButtons } from "@/Integration_modules/scroll-buttons"
import { DictationButton } from "@/Integration_modules/dictation-button"

export default function BookPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [book, setBook] = useState<VocabularyBook | null>(null)
  const [words, setWords] = useState<VocabularyWord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wordCount, setWordCount] = useState(0)
  const [learnedWords, setLearnedWords] = useState(0)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [totalLevels, setTotalLevels] = useState(1)
  const wordsPerLevel = 50

  // 检查是否是特殊ID
  const isSpecialId = params.id === "reviewed" || params.id === "recent"
  const pageTitle = params.id === "reviewed" ? "全部已学单词" : params.id === "recent" ? "近期学习单词" : ""

  // 获取词书信息和单词列表
  useEffect(() => {
    const fetchBookData = async () => {
      setIsLoading(true)
      try {
        // 处理特殊ID
        if (isSpecialId) {
          // 如果是"reviewed"，获取所有已复习的单词
          if (params.id === "reviewed") {
            try {
              const reviewedWords = await getReviewedWords()
              setWords(reviewedWords)
              setWordCount(reviewedWords.length)
              setTotalLevels(Math.ceil(reviewedWords.length / wordsPerLevel))
              setCurrentLevel(1)
              setLearnedWords(reviewedWords.length)
              setError(null)
            } catch (err) {
              console.error("获取已复习单词失败:", err)
              setWords([])
              setError("无法加载已复习的单词")
            }
          }
          // 如果是"recent"，获取最近7天学习的单词
          else if (params.id === "recent") {
            try {
              // 计算7天前的日期
              const sevenDaysAgo = new Date()
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
              const fromDate = sevenDaysAgo.toISOString()

              const recentWords = await getReviewedWords(undefined, fromDate)
              setWords(recentWords)
              setWordCount(recentWords.length)
              setTotalLevels(Math.ceil(recentWords.length / wordsPerLevel))
              setCurrentLevel(1)
              setLearnedWords(recentWords.length)
              setError(null)
            } catch (err) {
              console.error("获取近期学习单词失败:", err)
              setWords([])
              setError("无法加载近期学习的单词")
            }
          }
        } else {
          // 正常词书处理逻辑
          // 获取词书信息
          const bookData = await getBookById(params.id)
          if (!bookData) {
            setError("找不到该词书")
            setIsLoading(false)
            return
          }
          setBook(bookData)

          // 获取词书的单词数量
          const count = await getBookWordCount(params.id)
          setWordCount(count)

          // 计算总关卡数
          const levels = Math.ceil(count / wordsPerLevel)
          setTotalLevels(levels)

          // 获取当前关卡
          const progress = await getLevelProgress(params.id)
          setCurrentLevel(progress.currentLevel)

          // 获取当前关卡的单词
          try {
            const levelWords = await getWordsByLevel(params.id, progress.currentLevel, wordsPerLevel)
            setWords(levelWords)

            // 获取已学习的单词数量 (计算掌握程度 >= 1 的单词)
            const learnedCount = levelWords.filter((word) => word.mastery_level >= 1).length
            setLearnedWords(learnedCount)

            setError(null)
          } catch (err) {
            console.error("获取词书单词失败:", err)
            // 即使获取单词失败，仍然显示词书信息
            setWords([])
            setLearnedWords(0)
            setError("无法加载词书中的单词，但您仍然可以查看词书信息")
          }
        }
      } catch (err) {
        console.error("获取词书数据失败:", err)
        setError("加载词书数据时出现错误")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookData()
  }, [params.id, isSpecialId])

  // 处理关卡选择
  const handleLevelSelect = async (level: number) => {
    setIsLoading(true)
    try {
      const levelWords = await getWordsByLevel(params.id, level, wordsPerLevel)
      setWords(levelWords)
      setCurrentLevel(level)

      // 获取已学习的单词数量
      const learnedCount = levelWords.filter((word) => word.mastery_level >= 1).length
      setLearnedWords(learnedCount)
    } catch (err) {
      console.error("获取关卡单词失败:", err)
      setError("加载关卡单词时出现错误")
    } finally {
      setIsLoading(false)
    }
  }

  // 处理单词删除后的回调
  const handleWordDeleted = async () => {
    try {
      if (isSpecialId) {
        // 如果是特殊ID，重新获取对应的单词列表
        if (params.id === "reviewed") {
          const reviewedWords = await getReviewedWords()
          setWords(reviewedWords)
        } else if (params.id === "recent") {
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          const fromDate = sevenDaysAgo.toISOString()
          const recentWords = await getReviewedWords(undefined, fromDate)
          setWords(recentWords)
        }
      } else {
        // 正常词书，获取当前关卡的单词
        const levelWords = await getWordsByLevel(params.id, currentLevel, wordsPerLevel)
        setWords(levelWords)
      }
    } catch (err) {
      console.error("重新获取单词失败:", err)
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <div className="min-h-screen bg-gray-50">
        {/* 顶部导航和操作按钮 */}
        <div className="container mx-auto pt-4 px-4 flex justify-between items-center">
          <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.push("/my-content")}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>

          {!isLoading && !error && (book || isSpecialId) && (
            <div className="flex gap-2">
              {!isSpecialId && (
                <>
                  <ReviewCardButton variant="outline" buttonText="词卡复习" bookId={params.id} level={currentLevel} />
                  <DictationButton variant="outline" buttonText="单词默写" bookId={params.id} level={currentLevel} />
                  <LevelSelectionButton
                    variant="outline"
                    bookId={params.id}
                    bookName={book?.book_name || ""}
                    onLevelSelect={handleLevelSelect}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* 主要内容 */}
        <div className="container mx-auto py-8 max-w-6xl">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <span className="ml-2 text-gray-600">加载数据中...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-6 rounded-md">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
                返回首页
              </Button>
            </div>
          ) : book || isSpecialId ? (
            <>
              <div className="mb-8 text-center">
                {isSpecialId ? (
                  <h1 className="text-3xl font-bold mb-2">{pageTitle}</h1>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold mb-2">{book?.book_name}</h1>
                    <p className="text-gray-600">{book?.description}</p>
                  </>
                )}

                {/* 关卡信息 - 只在非特殊ID时显示 */}
                {!isSpecialId && (
                  <div className="mt-2 mb-4">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      第 {currentLevel} 关 / 共 {totalLevels} 关
                    </span>
                  </div>
                )}
              </div>

              {/* 单词列表 */}
              <VocabularyList
                words={words}
                onWordDeleted={handleWordDeleted}
                bookId={params.id}
                level={currentLevel}
                starButtonStyle="simple"
              />
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-600">找不到词书信息</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
                返回首页
              </Button>
            </div>
          )}
        </div>
        {/* 添加滚动按钮 */}
        <ScrollButtons />
      </div>
    </ThemeProvider>
  )
}
