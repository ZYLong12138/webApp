"use client"
import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getMonthHeatmapData } from "@/services/dashboard-service"

interface MonthlyCalendarProps {
  initialData: { date: string; count: number }[]
  consecutiveDays: number
  totalDays: number
  isLoading: boolean
  fetchMonthData?: (year: number, month: number) => Promise<{ date: string; count: number }[]>
}

// 缓存键格式: "YYYY-MM"
type CacheKey = string
type DataCache = Map<CacheKey, { date: string; count: number }[]>

export function MonthlyCalendar({
  initialData = [],
  consecutiveDays = 0,
  totalDays = 0,
  isLoading: initialLoading = false,
  fetchMonthData,
}: MonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState<{ day: number; count: number; date: Date }[]>([])
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [dataCache, setDataCache] = useState<DataCache>(new Map())

  // 生成缓存键
  const getCacheKey = (date: Date): CacheKey => {
    return `${date.getFullYear()}-${date.getMonth()}`
  }

  // 将UTC日期字符串转换为本地日期对象
  const utcStringToLocalDate = useCallback((dateStr: string): Date => {
    const [year, month, day] = dateStr.split("-").map(Number)
    return new Date(year, month - 1, day)
  }, [])

  // 加载特定月份的数据
  const loadMonthData = useCallback(
    async (date: Date) => {
      const cacheKey = getCacheKey(date)

      // 检查缓存中是否已有数据
      if (dataCache.has(cacheKey)) {
        return dataCache.get(cacheKey) || []
      }

      setIsLoading(true)
      try {
        const data = await getMonthHeatmapData(date.getFullYear(), date.getMonth())

        // 更新缓存
        setDataCache((prev) => {
          const newCache = new Map(prev)
          newCache.set(cacheKey, data)
          return newCache
        })

        return data
      } catch (error) {
        console.error("Error loading month data:", error)
        return []
      } finally {
        setIsLoading(false)
      }
    },
    [dataCache],
  )

  // 处理数据，转换为日历格式
  const generateCalendarData = useCallback(
    (date: Date, heatmapData: { date: string; count: number }[]) => {
      const year = date.getFullYear()
      const month = date.getMonth()

      // 获取当月的天数
      const daysInMonth = new Date(year, month + 1, 0).getDate()

      // 创建日历数据
      const calendarDays = []

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day)
        // 使用ISO格式确保日期格式一致
        const dateStr = currentDate.toISOString().split("T")[0] // YYYY-MM-DD 格式

        // 查找当前日期的数据
        const dataPoint = heatmapData.find((d) => {
          // 比较日期字符串，忽略时区差异
          const localDate = utcStringToLocalDate(d.date)
          return localDate.getDate() === day && localDate.getMonth() === month && localDate.getFullYear() === year
        })

        calendarDays.push({
          day,
          count: dataPoint ? dataPoint.count : 0,
          date: currentDate,
        })
      }

      setCalendarData(calendarDays)
    },
    [utcStringToLocalDate],
  )

  // 初始化和月份变更时加载数据
  useEffect(() => {
    async function updateCalendar() {
      const cacheKey = getCacheKey(currentDate)

      // 如果是当前月份且有初始数据，使用初始数据
      if (cacheKey === getCacheKey(new Date()) && initialData.length > 0 && !dataCache.has(cacheKey)) {
        setDataCache((prev) => {
          const newCache = new Map(prev)
          newCache.set(cacheKey, initialData)
          return newCache
        })
        generateCalendarData(currentDate, initialData)
        return
      }

      // 检查缓存
      if (dataCache.has(cacheKey)) {
        const cachedData = dataCache.get(cacheKey) || []
        generateCalendarData(currentDate, cachedData)
        return
      }

      // 加载新数据
      const data = await loadMonthData(currentDate)
      generateCalendarData(currentDate, data)
    }

    updateCalendar()
  }, [currentDate, initialData, dataCache, generateCalendarData, loadMonthData])

  // 获取当前月份的第一天是星期几
  const getFirstDayOfMonth = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
    // 调整为星期一为0，星期日为6
    return firstDay === 0 ? 6 : firstDay - 1
  }

  // 获取当前月份名称
  const getCurrentMonthName = () => {
    return currentDate.toLocaleString("zh-CN", { year: "numeric", month: "long" })
  }

  // 切换到上个月
  const goToPreviousMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() - 1)
      return newDate
    })
  }

  // 切换到下个月
  const goToNextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + 1)
      return newDate
    })
  }

  // 获取单元格的颜色类
  const getCellColorClass = (count: number) => {
    if (count === 0) return "bg-gray-100"
    if (count <= 50) return "bg-green-200"
    if (count <= 100) return "bg-green-300"
    return "bg-green-500"
  }

  // 检查日期是否是今天
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // 渲染日历
  const renderCalendar = () => {
    const weekdays = ["一", "二", "三", "四", "五", "六", "日"]
    const firstDayOfMonth = getFirstDayOfMonth()

    return (
      <div className="mt-4">
        {/* 星期标题 */}
        <div className="grid grid-cols-7 mb-2">
          {weekdays.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* 日历网格 */}
        <div className="grid grid-cols-7 gap-2">
          {/* 填充月初空白 */}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="h-12"></div>
          ))}

          {/* 日历单元格 */}
          {calendarData.map((day) => (
            <div
              key={day.day}
              className={`h-12 rounded-md flex items-center justify-center relative ${
                isToday(day.date) ? "ring-2 ring-primary ring-offset-2" : ""
              }`}
              title={day.count > 0 ? `${day.count} 词` : ""}
            >
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${
                  day.count > 0 ? `${getCellColorClass(day.count)} text-gray-800` : ""
                }`}
              >
                {day.day}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md font-medium">热力学图</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth} disabled={isLoading}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{getCurrentMonthName()}</span>
            <Button variant="outline" size="icon" onClick={goToNextMonth} disabled={isLoading}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* 月度日历 */}
            {renderCalendar()}

            {/* 颜色图例 */}
            <div className="flex justify-end items-center mt-6 text-xs text-gray-500">
              <span>Less</span>
              <div className="flex gap-[2px] mx-2">
                <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
              </div>
              <span>More</span>
            </div>

            {/* 签到按钮 */}
            <div className="flex justify-center my-4">
              <Button variant="outline" size="sm">
                签到/补签
              </Button>
            </div>

            {/* 签到统计 */}
            <div className="flex justify-between border-t pt-3 mt-2">
              <div className="text-sm">
                连续签到 <span className="font-bold">{consecutiveDays}</span> 天
              </div>
              <div className="text-sm">
                累计签到 <span className="font-bold">{totalDays}</span> 天
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
