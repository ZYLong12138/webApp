"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Calendar, Compass, Plus } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { getReviewPlan } from "@/services/review-service"
import { getReviewQueue } from "@/services/review-service"
import { getVocabularyWords } from "@/services/vocabulary-service"

export default function DashboardPage() {
  const router = useRouter()
  const [learningTime, setLearningTime] = useState("25min")
  const [streakDays, setStreakDays] = useState(7)
  const [reviewPlan, setReviewPlan] = useState<{ dueToday: number; totalReviewed: number }>({
    dueToday: 0,
    totalReviewed: 0,
  })
  const [bookReviewCounts, setBookReviewCounts] = useState({
    cet4: 0,
    cet6: 0,
  })

  // 固定的待学习数量
  const wordsToLearnCount = 50

  // 获取复习计划数据和各词书的复习数量
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取总体复习计划
        const plan = await getReviewPlan()
        setReviewPlan(plan)

        // 获取复习队列
        const reviewQueue = await getReviewQueue()

        // 获取CET4和CET6的单词列表，用于筛选复习队列
        const cet4Words = await getVocabularyWords("cet4")
        const cet6Words = await getVocabularyWords("cet6")

        // 创建单词ID到词书的映射
        const cet4WordIds = new Set(cet4Words.map((word) => word.id))
        const cet6WordIds = new Set(cet6Words.map((word) => word.id))

        // 计算每个词书中待复习的单词数量
        const cet4ReviewCount = reviewQueue.filter((item) => cet4WordIds.has(item.word_id)).length
        const cet6ReviewCount = reviewQueue.filter((item) => cet6WordIds.has(item.word_id)).length

        setBookReviewCounts({
          cet4: cet4ReviewCount,
          cet6: cet6ReviewCount,
        })
      } catch (error) {
        console.error("获取数据失败:", error)
      }
    }

    fetchData()
  }, [])

  // 处理词书学习按钮点击
  const handleLearnBook = (bookId: string, isReview: boolean) => {
    if (isReview) {
      // 导航到间隔复习页面，带上词书ID
      router.push(`/spaced-review?bookId=${bookId}`)
    } else {
      // 导航到学习页面，带上词书ID和学习数量
      router.push(`/learn_word?bookId=${bookId}&wordCount=${wordsToLearnCount}`)
    }
  }

  // 处理添加任务按钮点击
  const handleAddTask = () => {
    router.push("/book_select")
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="flex min-h-screen bg-background">
        {/* 侧边栏导航 */}
        <Sidebar />

        {/* 主内容区域 */}
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-8">学习中心</h1>

            {/* 动态效果屏和统计信息 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* 动态效果屏 */}
              <Card className="col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-none shadow-sm">
                <CardContent className="p-6 flex items-center justify-center min-h-[180px]">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-blue-700 mb-2">欢迎回来！</h2>
                    <p className="text-blue-600">今天是继续学习的好日子</p>
                    <div className="mt-4 flex justify-center gap-4">
                      <Button
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => router.push("/spaced-review")}
                      >
                        开始今日复习
                      </Button>
                      <Button
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        onClick={() => router.push("/word_list")}
                      >
                        查看词库
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 学习统计 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">学习统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">学习时长</p>
                          <p className="font-medium">{learningTime}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                          <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">累计打卡</p>
                          <p className="font-medium">{streakDays} 天</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                          <Compass className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">今日待复习</p>
                          <p className="font-medium">{reviewPlan.dueToday} 个单词</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 当前计划 */}
            <h2 className="text-xl font-bold mb-4">当前计划</h2>

            {/* CET-4 词表 */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold">CET-4 词表总览</h3>
                    <p className="text-sm text-muted-foreground">大学英语四级核心词汇</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleLearnBook("cet4", false)}>
                      待学习 {wordsToLearnCount}
                    </Button>
                    <Button variant="outline" onClick={() => handleLearnBook("cet4", true)}>
                      待复习 {bookReviewCounts.cet4}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CET-6 词表 */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold">CET-6 词表总览</h3>
                    <p className="text-sm text-muted-foreground">大学英语六级核心词汇</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleLearnBook("cet6", false)}>
                      待学习 {wordsToLearnCount}
                    </Button>
                    <Button variant="outline" onClick={() => handleLearnBook("cet6", true)}>
                      待复习 {bookReviewCounts.cet6}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 添加任务 */}
            <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleAddTask}>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-500">添加任务</h3>
                  <div className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center">
                    <Plus className="h-6 w-6 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}
