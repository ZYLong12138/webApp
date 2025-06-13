"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { HeatmapDataPoint } from "@/services/heatmap-service"

interface HeatmapProps {
  data: HeatmapDataPoint[]
  consecutiveDays: number
  totalDays: number
  isLoading?: boolean
}

export function Heatmap({ data = [], consecutiveDays = 0, totalDays = 0, isLoading = false }: HeatmapProps) {
  const [calendarData, setCalendarData] = useState<{ date: Date; count: number }[]>([])

  // 处理数据，转换为日历格式
  useEffect(() => {
    if (data.length === 0) return

    const processed = data.map((item) => ({
      date: new Date(item.date),
      count: item.count,
    }))

    setCalendarData(processed)
  }, [data])

  // 获取过去一年的日期范围
  const getDateRange = () => {
    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setFullYear(startDate.getFullYear() - 1)
    return { startDate, endDate }
  }

  // 生成日历网格
  const generateCalendarCells = () => {
    const { startDate, endDate } = getDateRange()
    const cells = []

    // 计算开始日期是星期几（0-6，0是星期日）
    const currentDate = new Date(startDate)

    // 调整到星期一开始
    const dayOfWeek = currentDate.getDay()
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    currentDate.setDate(currentDate.getDate() - daysToSubtract)

    // 生成52周 x 7天的网格
    for (let week = 0; week < 53; week++) {
      for (let day = 0; day < 7; day++) {
        const cellDate = new Date(currentDate)

        // 查找当前日期的数据
        const dataPoint = calendarData.find(
          (d) =>
            d.date.getFullYear() === cellDate.getFullYear() &&
            d.date.getMonth() === cellDate.getMonth() &&
            d.date.getDate() === cellDate.getDate(),
        )

        const count = dataPoint ? dataPoint.count : 0

        // 根据单词数量确定颜色
        let colorClass = "bg-gray-100"
        if (count > 0 && count <= 50) {
          colorClass = "bg-green-200"
        } else if (count > 50 && count <= 100) {
          colorClass = "bg-green-300"
        } else if (count > 100) {
          colorClass = "bg-green-500"
        }

        // 检查日期是否在范围内
        const isInRange = cellDate >= startDate && cellDate <= endDate

        cells.push(
          <div
            key={`${week}-${day}`}
            className={`w-3 h-3 rounded-sm ${isInRange ? colorClass : "bg-gray-50"}`}
            title={isInRange ? `${cellDate.toLocaleDateString()}: ${count} 词` : ""}
          />,
        )

        // 移动到下一天
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }

    return cells
  }

  // 获取月份标签位置
  const getMonthLabels = () => {
    const { startDate } = getDateRange()
    const labels = []
    const currentDate = new Date(startDate)

    // 调整到每月的第一天
    currentDate.setDate(1)

    // 生成12个月的标签
    for (let i = 0; i < 12; i++) {
      const month = currentDate.toLocaleString("en-US", { month: "short" })

      // 计算标签位置（根据该月第一天是星期几）
      const firstDayOfMonth = new Date(currentDate)
      const dayOfWeek = firstDayOfMonth.getDay()
      const weekOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 调整为星期一为0

      // 计算该月在网格中的列位置
      const weekIndex = Math.floor((firstDayOfMonth.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))

      labels.push(
        <div
          key={month}
          className="absolute text-xs text-gray-500"
          style={{
            left: `${(weekIndex + weekOffset / 7) * (12 / 52) * 100}%`,
            top: "-20px",
          }}
        >
          {month}
        </div>,
      )

      // 移动到下个月
      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    return labels
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-md font-medium">热力学图</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="relative mb-8 mt-6 overflow-x-auto">
              {/* 月份标签 */}
              <div className="relative h-5 mb-1">{getMonthLabels()}</div>

              {/* 热力图主体 */}
              <div className="flex">
                {/* 星期标签 */}
                <div className="flex flex-col justify-between pr-2 text-xs text-gray-500 h-[88px]">
                  <div>Mon</div>
                  <div>Wed</div>
                  <div>Fri</div>
                </div>

                {/* 热力图单元格 */}
                <div className="grid grid-cols-53 gap-[2px] grid-rows-7 flex-1">{generateCalendarCells()}</div>
              </div>

              {/* 颜色图例 */}
              <div className="flex justify-end items-center mt-4 text-xs text-gray-500">
                <span>Less</span>
                <div className="flex gap-[2px] mx-2">
                  <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                  <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
                  <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                </div>
                <span>More</span>
              </div>
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
