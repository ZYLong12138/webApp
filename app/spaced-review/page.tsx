"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { getReviewWords, getReviewPlan } from "@/services/review-service"
import { SpacedReviewSession } from "@/components/spaced-review-session"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ThemeSwitcherButton } from "@/Integration_modules/theme-switcher-button"
import { useTheme } from "@/contexts/theme-context"
import { Progress } from "@/components/ui/progress"

export default function SpacedReviewPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [reviewWords, setReviewWords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [reviewPlan, setReviewPlan] = useState<{ dueToday: number; totalReviewed: number }>({
    dueToday: 0,
    totalReviewed: 0,
  })
  const [isSessionStarted, setIsSessionStarted] = useState(false)

  // 获取今日需要复习的单词
  useEffect(() => {
    const fetchReviewData = async () => {
      setIsLoading(true)
      try {
        // 获取复习计划
        const plan = await getReviewPlan()
        setReviewPlan(plan)

        // 获取需要复习的单词
        const words = await getReviewWords()
        setReviewWords(words)
      } catch (error) {
        console.error("获取复习数据失败:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviewData()
  }, [])

  // 处理复习会话完成
  const handleSessionComplete = () => {
    setIsSessionStarted(false)
  }

  // 开始复习会话
  const handleStartSession = () => {
    setIsSessionStarted(true)
  }

  // 根据当前主题决定容器类名
  const getContainerClass = () => {
    switch (theme) {
      case "dusk-rose":
        return "min-h-screen gem-gradient-bg p-4"
      case "zephyr-jasmine":
        return "min-h-screen jasmine-gradient-bg p-4"
      default:
        return "min-h-screen bg-gray-50 p-4"
    }
  }

  // 获取导航栏类名
  const getNavClass = () => {
    switch (theme) {
      case "dusk-rose":
        return "flex justify-between items-center mb-6 sticky top-0 z-10 p-3 gem-nav rounded-xl shadow-sm"
      case "zephyr-jasmine":
        return "flex justify-between items-center mb-6 sticky top-0 z-10 p-3 jasmine-nav rounded-xl shadow-sm"
      default:
        return "flex justify-between items-center mb-6 sticky top-0 z-10 p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm"
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className={getContainerClass()}>
        {/* 顶部导航 */}
        <div className={getNavClass()}>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 h-8 hover:scale-105 transition-transform text-gray-600"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-3 w-3" />
              返回
            </Button>
            <h1 className="text-lg font-bold ml-2 text-gray-800">间隔复习</h1>
          </div>
          <div className="flex gap-2 items-center">
            <ThemeSwitcherButton size="sm" variant="ghost" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 bg-white/50 backdrop-blur-sm rounded-xl p-8 shadow-sm">
            <div className="relative">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            </div>
            <p className="text-gray-600 font-medium">加载复习数据中...</p>
          </div>
        ) : isSessionStarted ? (
          <SpacedReviewSession words={reviewWords} onComplete={handleSessionComplete} />
        ) : (
          <div className="max-w-2xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>今日复习</CardTitle>
                <CardDescription>使用间隔重复法复习单词，提高记忆效果</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>今日待复习</span>
                      <span className="font-medium">{reviewPlan.dueToday} 个单词</span>
                    </div>
                    <Progress
                      value={(reviewPlan.dueToday / Math.max(1, reviewPlan.dueToday + reviewPlan.totalReviewed)) * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-blue-600 mb-1">总复习单词</div>
                      <div className="text-2xl font-bold">{reviewPlan.totalReviewed}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-green-600 mb-1">今日待复习</div>
                      <div className="text-2xl font-bold">{reviewPlan.dueToday}</div>
                    </div>
                  </div>

                  {reviewWords.length === 0 ? (
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <p className="text-yellow-800">今天没有需要复习的单词</p>
                      <p className="text-sm text-yellow-600 mt-2">添加单词到复习队列或等待明天再来复习</p>
                    </div>
                  ) : (
                    <div className="flex justify-center mt-6">
                      <Button size="lg" onClick={handleStartSession}>
                        开始复习 ({reviewWords.length})
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {reviewWords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>预览复习单词</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {reviewWords.slice(0, 6).map((word) => (
                      <div key={word.id} className="border rounded-md p-3 bg-gray-50">
                        <div className="font-bold text-blue-600">{word.word}</div>
                        <div className="text-sm text-gray-600 truncate">{word.definition}</div>
                      </div>
                    ))}
                    {reviewWords.length > 6 && (
                      <div className="border rounded-md p-3 bg-gray-50 flex items-center justify-center">
                        <span className="text-gray-500">还有 {reviewWords.length - 6} 个单词...</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </ThemeProvider>
  )
}
