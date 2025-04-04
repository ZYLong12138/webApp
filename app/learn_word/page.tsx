"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { WordLearningCard } from "@/components/word-learning-card"
import { useState, useEffect } from "react"
import { getBookById } from "@/services/vocabulary-service"

export default function LearnWordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookId = searchParams.get("bookId") || undefined
  const [bookTitle, setBookTitle] = useState<string>("词汇学习")

  // 获取词书信息
  useEffect(() => {
    const fetchBookInfo = async () => {
      if (bookId) {
        try {
          const book = await getBookById(bookId)
          if (book) {
            setBookTitle(book.book_name)
          }
        } catch (error) {
          console.error("获取词书信息失败:", error)
        }
      }
    }

    fetchBookInfo()
  }, [bookId])

  // 处理学习完成
  const handleComplete = () => {
    router.back()
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* 顶部导航 */}
        <div className="p-4">
          <div className="flex justify-between items-center">
            <Button variant="ghost" className="text-gray-800 flex items-center gap-2" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
            <h1 className="text-xl font-bold">{bookTitle}</h1>
            <div className="w-24"></div> {/* 占位元素，保持标题居中 */}
          </div>
        </div>

        {/* 主要内容 */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-2xl mx-auto w-full">
          <WordLearningCard onComplete={handleComplete} maxWordsToLearn={5} bookId={bookId} />
        </div>
      </div>
    </ThemeProvider>
  )
}

