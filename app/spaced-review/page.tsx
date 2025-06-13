"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { SpacedReviewSession } from "@/components/spaced-review-session"
import { getReviewQueue } from "@/services/review-service"
import { useStudyTimeTracker } from "@/hooks/use-study-time-tracker"
import { updateStudyLog } from "@/services/study-log-service"

export default function SpacedReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookId = searchParams.get("bookId") || undefined
  const [isLoading, setIsLoading] = useState(true)
  const [reviewItems, setReviewItems] = useState([])
  const [error, setError] = useState(null)

  // 使用学习时间跟踪器
  const { startTracking, stopTracking } = useStudyTimeTracker("review", bookId)

  // 开始跟踪学习时间
  useEffect(() => {
    startTracking()

    // 组件卸载时停止跟踪
    return () => {
      stopTracking()
    }
  }, [])

  useEffect(() => {
    const fetchReviewItems = async () => {
      setIsLoading(true)
      try {
        let items = await getReviewQueue()

        // 如果指定了bookId，则过滤出该词书的复习项
        if (bookId) {
          items = items.filter((item) => item.book_id === bookId)
        }

        setReviewItems(items)
        setError(null)
      } catch (err) {
        console.error("获取复习队列失败:", err)
        setError("加载复习队列时出现错误")
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviewItems()
  }, [bookId])

  const handleComplete = async () => {
    // 更新打卡记录
    await updateStudyLog()
    router.push("/")
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <div className="min-h-screen bg-gray-50">
        <SpacedReviewSession
          reviewItems={reviewItems}
          isLoading={isLoading}
          error={error}
          onComplete={handleComplete}
        />
      </div>
    </ThemeProvider>
  )
}
