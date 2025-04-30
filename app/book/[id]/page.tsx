"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react"
import { getBookById, getWordsByLevel, getBookWordCount, getLevelProgress } from "@/services/vocabulary-service"
import { VocabularyList } from "@/components/vocabulary-list"
import { LearnWordButton } from "@/Integration_modules/learn-word-button"
import { ReviewCardButton } from "@/Integration_modules/review-card-button"
import { LevelSelectionButton } from "@/Integration_modules/level-selection-button"
import type { VocabularyBook, VocabularyWord } from "@/types/vocabulary"
import { ScrollButtons } from "@/Integration_modules/scroll-buttons"
import { DictationButton } from "@/Integration_modules/dictation-button"
import { Progress } from "@/components/ui/progress"
import { SpacedReviewButton } from "@/Integration_modules/spaced-review-button"

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

  // 获取词书信息和单词列表
  useEffect(() => {
    const fetchBookData = async () => {
      setIsLoading(true)
      try {
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
      } catch (err) {
        console.error("获取词书数据失败:", err)
        setError("加载词书数据时出现错误")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookData()
  }, [params.id])

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
      const levelWords = await getWordsByLevel(params.id, currentLevel, wordsPerLevel)
      setWords(levelWords)
    } catch (err) {
      console.error("重新获取单词失败:", err)
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <div className="min-h-screen bg-gray-50">
        {/* 顶部导航和操作按钮 */}
        <div className="container mx-auto pt-4 px-4 flex justify-between items-center">
          <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.push("/book_select")}>
            <ArrowLeft className="h-4 w-4" />
            返回词书选择
          </Button>

          {!isLoading && !error && book && (
            <div className="flex gap-2">
              <ReviewCardButton variant="outline" buttonText="词卡复习" />
              <DictationButton variant="outline" buttonText="单词默写" bookId={params.id} />
              <SpacedReviewButton variant="outline" buttonText="间隔复习" />
              <LevelSelectionButton
                variant="outline"
                bookId={params.id}
                bookName={book.book_name}
                onLevelSelect={handleLevelSelect}
              />
              <LearnWordButton
                variant="default"
                size="default"
                buttonText="开始学习单词"
                bookId={params.id}
                level={currentLevel} // 确保传递当前关卡
              />
            </div>
          )}
        </div>

        {/* 主要内容 */}
        <div className="container mx-auto py-8 max-w-4xl">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <span className="ml-2 text-gray-600">加载词书数据中...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-6 rounded-md">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push("/book_select")}>
                返回词书列表
              </Button>
            </div>
          ) : book ? (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2">{book.book_name}</h1>
                <p className="text-gray-600">{book.description}</p>

                {/* 关卡信息 */}
                <div className="mt-2 mb-4">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    第 {currentLevel} 关 / 共 {totalLevels} 关
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center mt-4 w-full max-w-md mx-auto">
                  <div className="w-full mb-2">
                    <Progress value={(learnedWords / (words.length || 1)) * 100} className="h-2" />
                  </div>
                  <div className="flex items-center justify-center text-sm text-gray-700">
                    <BookOpen className="h-4 w-4 text-blue-600 mr-2" />
                    <span>
                      当前关卡进度: {learnedWords}/{words.length || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* 单词列表 */}
              <VocabularyList words={words} onWordDeleted={handleWordDeleted} bookId={params.id} level={currentLevel} />
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-600">找不到词书信息</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push("/book_select")}>
                返回词书列表
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
