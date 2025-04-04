"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react"
import { getBookById, getVocabularyWords } from "@/services/vocabulary-service"
import { VocabularyList } from "@/components/vocabulary-list"
import { LearnWordButton } from "@/Integration_modules/learn-word-button"
import { ReviewCardButton } from "@/Integration_modules/review-card-button"
import type { VocabularyBook, VocabularyWord } from "@/types/vocabulary"
import { ScrollButtons } from "@/Integration_modules/scroll-buttons"
import { getBookWordCount } from "@/services/vocabulary-service"
import { DictationButton } from "@/Integration_modules/dictation-button"
import { Progress } from "@/components/ui/progress"

export default function BookPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [book, setBook] = useState<VocabularyBook | null>(null)
  const [words, setWords] = useState<VocabularyWord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wordCount, setWordCount] = useState(0)
  const [learnedWords, setLearnedWords] = useState(0)

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

        // 获取词书中的单词
        try {
          const wordsData = await getVocabularyWords(params.id)
          setWords(wordsData)

          // 获取词书的单词数量
          const count = await getBookWordCount(params.id)
          setWordCount(count)

          // 获取已学习的单词数量 (计算掌握程度 >= 3 的单词)
          const learnedCount = wordsData.filter((word) => word.mastery_level >= 3).length
          setLearnedWords(learnedCount)

          setError(null)
        } catch (err) {
          console.error("获取词书单词失败:", err)
          // 即使获取单词失败，仍然显示词书信息
          setWords([])
          setWordCount(0)
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

  // 处理单词删除后的回调
  const handleWordDeleted = async () => {
    try {
      const wordsData = await getVocabularyWords(params.id)
      setWords(wordsData)
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
              <LearnWordButton variant="default" size="default" buttonText="开始学习单词" bookId={params.id} />
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
                <div className="flex flex-col items-center justify-center mt-4 w-full max-w-md mx-auto">
                  <div className="w-full mb-2">
                    <Progress value={(learnedWords / wordCount) * 100} className="h-2" />
                  </div>
                  <div className="flex items-center justify-center text-sm text-gray-700">
                    <BookOpen className="h-4 w-4 text-blue-600 mr-2" />
                    <span>
                      学习进度: {learnedWords}/{wordCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* 单词列表 */}
              <VocabularyList words={words} onWordDeleted={handleWordDeleted} bookId={params.id} />
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

