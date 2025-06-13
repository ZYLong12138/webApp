"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { UserPageButton } from "@/Integration_modules/user-page-button"
import { FocusModeCard } from "@/components/dashboard/focus-mode-card"
import { StatsCard } from "@/components/dashboard/stats-card"
import { MonthlyCalendar } from "@/components/dashboard/monthly-calendar"
import { getStudyTimeStats } from "@/services/study-time-service"
import {
  getTodayReviewCount,
  getTotalReviewCount,
  getMonthHeatmapData,
  getConsecutiveStudyDays,
  getTotalStudyDays,
} from "@/services/dashboard-service"
import { Music, ChevronRight } from "lucide-react"

export default function StatisticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [studyStats, setStudyStats] = useState({
    todayTime: "0min",
    todayReviewCount: 0,
    totalReviewCount: 0,
  })
  const [currentMonthData, setCurrentMonthData] = useState([])
  const [consecutiveDays, setConsecutiveDays] = useState(0)
  const [totalStudyDays, setTotalStudyDays] = useState(0)

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)

        // 获取学习时间统计
        const timeStats = await getStudyTimeStats()

        // 获取今日学习和复习的单词数量
        const todayReviewCount = await getTodayReviewCount()

        // 获取累计学习的单词数量
        const totalReviewCount = await getTotalReviewCount()

        setStudyStats({
          todayTime: timeStats?.todayTime || "0min",
          todayReviewCount,
          totalReviewCount,
        })

        // 获取当月热力图数据
        const now = new Date()
        const monthlyData = await getMonthHeatmapData(now.getFullYear(), now.getMonth())
        setCurrentMonthData(monthlyData)

        // 获取连续学习天数
        const consecutiveDays = await getConsecutiveStudyDays()
        setConsecutiveDays(consecutiveDays)

        // 获取总学习天数
        const totalDays = await getTotalStudyDays()
        setTotalStudyDays(totalDays)
      } catch (error) {
        console.error("加载仪表盘数据失败:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      {/* 侧边栏导航 */}
      <Sidebar />

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        <header className="border-b bg-background">
          <div className="flex h-16 items-center justify-end px-4 sm:px-6">
            <UserPageButton variant="ghost" size="icon" className="ml-2" showIcon={true} iconType="userCircle" />
          </div>
        </header>

        <main className="flex-1 p-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">仪表盘</h1>

            {/* 专注模式区域 */}
            <section className="mb-6">
              <h2 className="text-lg font-medium mb-3">专注模式</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FocusModeCard title="番茄时钟" showMusicControls={false}>
                  <span className="text-gray-400 text-sm">番茄时钟功能即将上线</span>
                </FocusModeCard>

                <FocusModeCard title="沉浸音乐" showMusicControls={true}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Music className="h-5 w-5 text-gray-500" />
                      <span className="text-gray-400 text-sm">音乐播放功能即将上线</span>
                    </div>
                  </div>
                </FocusModeCard>
              </div>
            </section>

            {/* 我的数据区域 */}
            <section className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-medium">我的数据</h2>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatsCard title="今日学习&复习" value={`${studyStats.todayReviewCount} 词`} isLoading={isLoading} />
                <StatsCard title="累计学习" value={`${studyStats.totalReviewCount} 词`} isLoading={isLoading} />
                <StatsCard title="今日总时长" value={studyStats.todayTime} isLoading={isLoading} />
                <StatsCard title="累计时长" value={`${totalStudyDays} 天`} isLoading={isLoading} />
              </div>
            </section>

            {/* 月度日历热力图区域 */}
            <section className="mb-6">
              <MonthlyCalendar
                initialData={currentMonthData}
                consecutiveDays={consecutiveDays}
                totalDays={totalStudyDays}
                isLoading={isLoading}
                fetchMonthData={getMonthHeatmapData}
              />
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
