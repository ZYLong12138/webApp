"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { VocabularyDashboard } from "@/components/vocabulary-dashboard"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { QuickAddWordButton } from "@/Integration_modules/quick-add-word-button"
import { LearnWordButton } from "@/Integration_modules/learn-word-button"
import { ReviewCardButton } from "@/Integration_modules/review-card-button"
import { ScrollButtons } from "@/Integration_modules/scroll-buttons"
import { DictationButton } from "@/Integration_modules/dictation-button"
import { VocabularyNav } from "@/components/vocabulary-nav"
import { SpacedReviewButton } from "@/Integration_modules/spaced-review-button"
import { getReviewedWords } from "@/services/review-service"
import { VocabularyList } from "@/components/vocabulary-list"
import type { VocabularyWord } from "@/types/vocabulary"

export default function WordListPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const source = searchParams.get("source")

  const [title, setTitle] = useState("我的单词本")
  const [reviewedWords, setReviewedWords] = useState<VocabularyWord[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 获取已复习的单词
  useEffect(() => {
    if (source === "reviewed") {
      setTitle("全部已学单词")
      fetchReviewedWords()
    } else if (source === "recent") {
      setTitle("近期学习单词")
      fetchRecentWords()
    } else {
      setTitle("我的单词本")
    }
  }, [source])

  const fetchReviewedWords = async () => {
    setIsLoading(true)
    try {
      const words = await getReviewedWords()
      setReviewedWords(words)
    } catch (error) {
      console.error("获取已复习单词失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRecentWords = async () => {
    setIsLoading(true)
    try {
      // 获取最近7天复习的单词
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const words = await getReviewedWords(undefined, sevenDaysAgo.toISOString())
      setReviewedWords(words)
    } catch (error) {
      console.error("获取近期学习单词失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <main className="min-h-screen bg-background">
        {/* Add back button and action buttons in a flex container */}
        <div className="container mx-auto pt-4 px-4 flex justify-between items-center">
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => (source ? router.push("/my-content") : router.push("/book_select"))}
          >
            <ArrowLeft className="h-4 w-4" />
            {source ? "返回我的内容" : "返回词书选择"}
          </Button>

          {/* Add buttons in a flex container */}
          <div className="flex gap-2">
            <ReviewCardButton variant="outline" buttonText="词卡复习" />
            <DictationButton variant="outline" buttonText="单词默写" />
            <SpacedReviewButton variant="outline" buttonText="间隔复习" />
            <LearnWordButton variant="default" size="default" buttonText="开始学习单词" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-8 text-center">{title}</h1>
        <VocabularyNav currentPath="/word_list" />

        {source ? (
          <div className="container mx-auto py-8 max-w-4xl">
            <VocabularyList
              words={reviewedWords}
              isLoading={isLoading}
              onWordDeleted={() => (source === "reviewed" ? fetchReviewedWords() : fetchRecentWords())}
            />
          </div>
        ) : (
          <VocabularyDashboard bookId="my-vocabulary" />
        )}

        <div className="fixed bottom-6 right-6">
          <QuickAddWordButton
            size="lg"
            className="shadow-lg"
            onWordAdded={() => {
              if (source === "reviewed") {
                fetchReviewedWords()
              } else if (source === "recent") {
                fetchRecentWords()
              } else {
                window.location.reload()
              }
            }}
          />
        </div>
        <ScrollButtons />
      </main>
    </ThemeProvider>
  )
}
