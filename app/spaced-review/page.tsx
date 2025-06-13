"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { SpacedReviewSession } from "@/components/spaced-review-session"
import { getReviewWords } from "@/services/review-service"
import { useStudyTimeTracker } from "@/hooks/use-study-time-tracker"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export default function SpacedReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookId = searchParams.get("bookId") || undefined
  const [isLoading, setIsLoading] = useState(true)
  const [reviewItems, setReviewItems] = useState([])
  const [error, setError] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 使用学习时间跟踪器
  const { startTracking, stopTracking } = useStudyTimeTracker("review", bookId)

  // 开始跟踪学习时间
  useEffect(() => {
    startTracking()

    // 组件卸载时停止跟踪
    return () => {
      stopTracking()
    }
  }, [startTracking, stopTracking])

  // 获取复习单词
  const fetchReviewItems = async () => {
    setIsLoading(true)
    try {
      console.log("Fetching review words...")
      // 直接将 bookId 传递给 getReviewWords 函数，让服务层处理过滤
      const items = await getReviewWords(bookId)
      console.log(`Retrieved ${items.length} review words${bookId ? ` for book ID ${bookId}` : ""}`)

      setReviewItems(items)
      setError(null)
    } catch (err) {
      console.error("获取复习队列失败:", err)
      setError("加载复习队列时出现错误，请稍后再试")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // 初始加载
  useEffect(() => {
    fetchReviewItems()
  }, [bookId])

  // 手动刷新
  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchReviewItems()
  }

  const handleComplete = () => {
    // 停止跟踪学习时间
    stopTracking()

    // 不再自动返回，由 SpacedReviewSession 组件处理导航
    // router.push('/');
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">间隔复习</h1>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing || isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新
            </Button>
          </div>

          <SpacedReviewSession words={reviewItems} isLoading={isLoading} error={error} onComplete={handleComplete} />
        </div>
      </div>
    </ThemeProvider>
  )
}
