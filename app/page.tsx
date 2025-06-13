"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { getReviewPlan } from "@/services/review-service"
import { getReviewQueue, getAllReviewQueueItems } from "@/services/review-service"
import { getVocabularyWords, getAllBooks } from "@/services/vocabulary-service"
import { UserPageButton } from "@/Integration_modules/user-page-button"
import { LearnWordButton } from "@/Integration_modules/learn-word-button"
import { SpacedReviewButton } from "@/Integration_modules/spaced-review-button"
import { BookButton } from "@/Integration_modules/book-button"
import { getStudyTimeStats } from "@/services/study-time-service"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createLearningPlan, getUserLearningPlans, type LearningPlan } from "@/services/learning-plan-service"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"

// 添加动画样式
const animationStyles = `
  @keyframes slide-left {
    0% { transform: translateX(100%); }
    100% { transform: translateX(-100%); }
  }
  
  @keyframes slide-right {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  @keyframes bounce-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
  
  .animate-slide-left {
    animation: slide-left 15s linear infinite;
  }
  
  .animate-slide-right {
    animation: slide-right 20s linear infinite;
  }
  
  .animate-bounce-slow {
    animation: bounce-slow 8s ease-in-out infinite;
  }
`

// 缓存键
const CACHE_KEYS = {
  TOTAL_DAYS: "vocab_app_total_days",
  LEARNED_WORDS: "vocab_app_learned_words",
  BOOK_REVIEW_COUNTS: "vocab_app_book_review_counts",
  USER_LEARNING_PLANS: "vocab_app_user_learning_plans", // 新增：用户学习计划缓存键
}

// 缓存过期时间（毫秒）
const CACHE_EXPIRY = {
  TOTAL_DAYS: 6 * 60 * 60 * 1000, // 6小时
  LEARNED_WORDS: 2 * 60 * 60 * 1000, // 2小时
  BOOK_REVIEW_COUNTS: 30 * 60 * 1000, // 30分钟
  USER_LEARNING_PLANS: 24 * 60 * 60 * 1000, // 24小时 - 学习计划变化不频繁
}

export default function HomePage() {
  const router = useRouter()
  const [learningTime, setLearningTime] = useState("0min")
  const [totalDays, setTotalDays] = useState(0)
  const [reviewPlan, setReviewPlan] = useState<{ dueToday: number; totalReviewed: number }>({
    dueToday: 0,
    totalReviewed: 0,
  })
  const [bookReviewCounts, setBookReviewCounts] = useState({})
  const [allBooks, setAllBooks] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState("")
  const [dailyWordCount, setDailyWordCount] = useState(50)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userLearningPlans, setUserLearningPlans] = useState<LearningPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingReviewCounts, setIsLoadingReviewCounts] = useState(true) // 新增：加载复习数量的状态
  const [learnedWordCounts, setLearnedWordCounts] = useState({})
  const [plansLoaded, setPlansLoaded] = useState(false) // 新增：标记计划是否已加载

  // 固定的待学习数量
  const wordsToLearnCount = 50

  // 从缓存获取数据
  const getFromCache = (key) => {
    if (typeof window === "undefined") return null

    try {
      const cachedData = localStorage.getItem(key)
      if (!cachedData) return null

      const { data, timestamp, version } = JSON.parse(cachedData)
      const currentVersion = "1.0" // 版本号，用于在缓存结构变化时强制更新

      // 检查版本和过期时间
      if (version !== currentVersion) return null

      const expiryTime = CACHE_EXPIRY[key.toUpperCase()] || 3600000 // 默认1小时
      if (Date.now() - timestamp > expiryTime) return null

      return data
    } catch (error) {
      console.error("Error reading from cache:", error)
      return null
    }
  }

  // 保存数据到缓存
  const saveToCache = (key, data) => {
    if (typeof window === "undefined") return

    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        version: "1.0", // 版本号
      }
      localStorage.setItem(key, JSON.stringify(cacheData))
    } catch (error) {
      console.error("Error saving to cache:", error)
    }
  }

  // 计算累计打卡天数（从review_queue中的updated_at字段）
  const calculateTotalDays = (reviewQueue) => {
    if (!reviewQueue || reviewQueue.length === 0) return 0

    // 提取所有不重复的日期
    const uniqueDates = new Set()
    reviewQueue.forEach((item) => {
      if (item.updated_at) {
        const dateStr = new Date(item.updated_at).toISOString().split("T")[0]
        uniqueDates.add(dateStr)
      }
    })

    // 返回不重复日期的数量
    return uniqueDates.size
  }

  // 加载学习计划 - 优先从缓存加载
  useEffect(() => {
    const loadLearningPlans = async () => {
      try {
        // 尝试从缓存获取学习计划
        const cachedPlans = getFromCache(CACHE_KEYS.USER_LEARNING_PLANS)

        if (cachedPlans) {
          // 如果缓存存在，直接使用缓存数据
          setUserLearningPlans(cachedPlans)
          setPlansLoaded(true)
          setIsLoading(false)
        } else {
          // 如果缓存不存在，从API获取
          const plans = await getUserLearningPlans()
          setUserLearningPlans(plans)
          setPlansLoaded(true)
          setIsLoading(false)

          // 保存到缓存
          saveToCache(CACHE_KEYS.USER_LEARNING_PLANS, plans)
        }
      } catch (error) {
        console.error("获取学习计划失败:", error)
        setIsLoading(false)
      }
    }

    loadLearningPlans()
  }, [])

  // 加载复习数量和其他数据 - 可以在计划加载后进行
  useEffect(() => {
    const loadReviewCounts = async () => {
      if (!plansLoaded) return // 如果计划还没加载，不执行

      setIsLoadingReviewCounts(true)

      try {
        // 获取所有词书
        const books = await getAllBooks()
        setAllBooks(books)

        // 尝试从缓存获取累计打卡天数和复习数量
        let calculatedTotalDays = getFromCache(CACHE_KEYS.TOTAL_DAYS)
        let cachedLearnedCounts = getFromCache(CACHE_KEYS.LEARNED_WORDS)
        let cachedReviewCounts = getFromCache(CACHE_KEYS.BOOK_REVIEW_COUNTS)

        // 获取复习队列 - 这个需要每次都获取最新的
        const todayReviewQueue = await getReviewQueue()

        // 如果缓存不存在或已过期，则重新计算
        if (calculatedTotalDays === null || cachedLearnedCounts === null) {
          // 获取所有复习记录 - 用于计算累计打卡和已学习单词
          const allReviewQueue = await getAllReviewQueueItems()

          // 如果累计打卡天数缓存不存在，重新计算
          if (calculatedTotalDays === null) {
            calculatedTotalDays = calculateTotalDays(allReviewQueue)
            saveToCache(CACHE_KEYS.TOTAL_DAYS, calculatedTotalDays)
          }

          // 如果学习单词数量缓存不存在，重新计算
          if (cachedLearnedCounts === null) {
            const learnedCounts = {}
            // 为每个学习计划获取词书的单词和已学习单词数量
            for (const plan of userLearningPlans) {
              // 获取词书的所有单词
              const words = await getVocabularyWords(plan.book_id)
              const wordIds = new Set(words.map((word) => word.id))

              // 计算已学习单词数量 - 使用所有review_queue记录，不按日期筛选
              const learnedWordIds = new Set(
                allReviewQueue.filter((item) => wordIds.has(item.word_id)).map((item) => item.word_id),
              )
              learnedCounts[plan.book_id] = learnedWordIds.size
            }
            cachedLearnedCounts = learnedCounts
            saveToCache(CACHE_KEYS.LEARNED_WORDS, learnedCounts)
          }
        }

        // 每次都重新计算待复习单词数量 - 这个需要实时更新
        const reviewCounts = {}
        // 为每个学习计划计算待复习单词数量
        for (const plan of userLearningPlans) {
          // 获取词书的所有单词
          const words = await getVocabularyWords(plan.book_id)
          const wordIds = new Set(words.map((word) => word.id))

          // 计算待复习单词数量
          const reviewCount = todayReviewQueue.filter((item) => wordIds.has(item.word_id)).length
          reviewCounts[plan.book_id] = reviewCount
        }
        cachedReviewCounts = reviewCounts
        saveToCache(CACHE_KEYS.BOOK_REVIEW_COUNTS, reviewCounts)

        // 设置状态
        setTotalDays(calculatedTotalDays)
        setLearnedWordCounts(cachedLearnedCounts)
        setBookReviewCounts(cachedReviewCounts)

        // 获取总体复习计划
        const plan = await getReviewPlan()
        setReviewPlan(plan)

        // 获取学习时间统计
        const timeStats = await getStudyTimeStats()
        if (timeStats) {
          setLearningTime(timeStats.todayTime)
        }
      } catch (error) {
        console.error("获取数据失败:", error)
        toast({
          title: "获取复习数据失败",
          description: "请稍后再试",
          variant: "destructive",
        })
      } finally {
        setIsLoadingReviewCounts(false)
      }
    }

    loadReviewCounts()
  }, [plansLoaded, userLearningPlans])

  // 处理添加任务按钮点击
  const handleAddTask = () => {
    setIsDialogOpen(true)
  }

  // 处理创建学习计划
  const handleCreatePlan = async () => {
    if (!selectedBookId) {
      toast({
        title: "请选择词书",
        variant: "destructive",
      })
      return
    }

    if (dailyWordCount % 50 !== 0 || dailyWordCount <= 0) {
      toast({
        title: "每日单词数量必须是50的倍数",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // 调用后端API创建学习计划
      await createLearningPlan({
        bookId: selectedBookId,
        dailyWordCount: dailyWordCount,
      })

      toast({
        title: "学习计划创建成功",
        description: "您可以在个人中心查看您的学习计划",
      })

      // 关闭对话框并重置表单
      setIsDialogOpen(false)
      setSelectedBookId("")
      setDailyWordCount(50)

      // 清除缓存，确保下次加载时获取最新数据
      localStorage.removeItem(CACHE_KEYS.USER_LEARNING_PLANS)
      localStorage.removeItem(CACHE_KEYS.LEARNED_WORDS)
      localStorage.removeItem(CACHE_KEYS.BOOK_REVIEW_COUNTS)

      // 刷新页面以显示新的学习计划
      window.location.reload()
    } catch (error) {
      console.error("创建学习计划失败:", error)
      toast({
        title: "创建学习计划失败",
        description: "请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 计算进度百分比
  const calculateProgress = (bookId: string, total: number) => {
    if (total === 0) return 0
    const learned = learnedWordCounts[bookId] || 0
    return Math.round((learned / total) * 100)
  }

  // 添加动画样式到页面
  useEffect(() => {
    // 创建style元素
    const styleElement = document.createElement("style")
    styleElement.innerHTML = animationStyles
    document.head.appendChild(styleElement)

    // 清理函数
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="flex min-h-screen bg-background">
        {/* 侧边栏导航 */}
        <Sidebar />

        {/* 顶部导航栏和主内容区域 */}
        <div className="flex-1 flex flex-col">
          <header className="border-b bg-background">
            <div className="flex h-16 items-center justify-end px-4 sm:px-6">
              <UserPageButton variant="ghost" size="icon" className="ml-2" showIcon={true} iconType="userCircle" />
            </div>
          </header>

          {/* 主内容区域 */}
          <main className="flex-1 p-4">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-2xl font-bold mb-4">学习中心</h1>

              {/* 动态效果屏和统计信息 - 减小高度 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* 动态效果屏 - 减小高度 */}
                <Card className="col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-none shadow-sm overflow-hidden relative">
                  <CardContent className="p-3 min-h-[100px] relative">
                    {/* 背景动画元素 - 仅作为显示使用 */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="animate-slide-left absolute -left-20 top-10 opacity-20">
                        <div className="text-6xl font-bold text-blue-700">
                          vocabulary learning mastery practice review
                        </div>
                      </div>
                      <div className="animate-slide-right absolute -right-20 top-20 opacity-20">
                        <div className="text-6xl font-bold text-green-700">单词 学习 掌握 练习 复习</div>
                      </div>
                      <div className="animate-bounce-slow absolute right-10 bottom-10 opacity-20">
                        <div className="text-7xl font-bold text-amber-700">CET-4 CET-6</div>
                      </div>
                      <div className="animate-slide-right absolute left-10 bottom-20 opacity-20">
                        <div className="text-5xl font-bold text-purple-700">背单词 记忆 学习 提高</div>
                      </div>
                    </div>
                    {/* 居中显示"动态效果屏"文字 */}
                    <div className="flex items-center justify-center h-full relative z-10">
                      <span className="text-gray-500">动态效果屏</span>
                    </div>
                  </CardContent>
                </Card>

                {/* 学习统计 - 减小高度 */}
                <Card className="border-2 shadow-sm bg-white">
                  <CardContent className="p-3 flex items-center">
                    {/* 左侧番茄图标 - 减小尺寸 */}
                    <div className="mr-3">
                      <svg width="45" height="45" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M30 55C43.8071 55 55 43.8071 55 30C55 16.1929 43.8071 5 30 5C16.1929 5 5 16.1929 5 30C5 43.8071 16.1929 55 30 55Z"
                          fill="#FF6347"
                          stroke="#333"
                          strokeWidth="2"
                        />
                        <path
                          d="M30 15C30 15 25 5 20 10C15 15 25 20 30 15Z"
                          fill="#4CAF50"
                          stroke="#333"
                          strokeWidth="1"
                        />
                        <path
                          d="M30 15C30 15 35 5 40 10C45 15 35 20 30 15Z"
                          fill="#4CAF50"
                          stroke="#333"
                          strokeWidth="1"
                        />
                        <path d="M30 30L20 20M30 30L40 20M30 30L30 15" stroke="#333" strokeWidth="2" />
                      </svg>
                    </div>
                    {/* 右侧统计信息 */}
                    <div>
                      <div className="flex items-center mb-1">
                        <span className="text-sm font-medium">学习时长</span>
                        <span className="ml-2 font-bold">{learningTime}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium">累计打卡</span>
                        <span className="ml-2 font-bold">{totalDays} days</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 当前计划 - 减小间距 */}
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-2">当前计划</h2>

                {isLoading ? (
                  <div className="text-center py-3 text-gray-500">加载中...</div>
                ) : userLearningPlans.length === 0 ? (
                  <div className="text-center py-3 text-gray-500">
                    <p>您还没有学习计划</p>
                    <p className="text-sm mt-1">点击下方"添加学习计划"按钮创建您的第一个学习计划</p>
                  </div>
                ) : (
                  userLearningPlans.map((plan) => (
                    <Card key={plan.id} className="mb-3">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <BookButton
                              id={plan.book_id}
                              title={`${plan.book_name} 词表总览`}
                              wordCount={plan.total_words}
                              description=""
                              asTitle={true}
                            />
                            <p className="text-sm text-muted-foreground">
                              每日 {plan.daily_word_count} 个单词 · 总进度 {learnedWordCounts[plan.book_id] || 0}/
                              {plan.total_words}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <LearnWordButton bookId={plan.book_id} count={plan.daily_word_count} />
                            <SpacedReviewButton
                              bookId={plan.book_id}
                              count={bookReviewCounts[plan.book_id] || 0}
                              isLoading={isLoadingReviewCounts}
                            />
                          </div>
                        </div>
                        <Progress value={calculateProgress(plan.book_id, plan.total_words)} className="h-2" />
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* 添加任务 - 减小高度 */}
              <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleAddTask}>
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-500">添加任务</h3>
                    <div className="w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center">
                      <Plus className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 创建学习计划对话框 */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>创建学习计划</DialogTitle>
                    <DialogDescription>选择词书和每日学习单词数量，创建您的个性化学习计划。</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="book" className="text-right">
                        词书
                      </Label>
                      <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="选择词书" />
                        </SelectTrigger>
                        <SelectContent>
                          {allBooks.map((book) => (
                            <SelectItem key={book.id} value={book.id}>
                              {book.book_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="wordCount" className="text-right">
                        每日单词数
                      </Label>
                      <Input
                        id="wordCount"
                        type="number"
                        min="50"
                        step="50"
                        value={dailyWordCount}
                        onChange={(e) => setDailyWordCount(Number.parseInt(e.target.value))}
                        className="col-span-3"
                      />
                    </div>
                    <div className="col-span-4 text-xs text-gray-500">
                      注意：每日单词数量必须是50的倍数，以匹配关卡制。
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleCreatePlan} disabled={isSubmitting}>
                      {isSubmitting ? "创建中..." : "创建计划"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
