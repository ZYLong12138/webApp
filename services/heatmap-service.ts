import { supabase } from "@/lib/supabase"

export interface HeatmapDataPoint {
  date: string // 格式: YYYY-MM-DD
  count: number // 单词数量
}

/**
 * 获取用户特定月份的学习热力图数据
 * @param year 年份
 * @param month 月份（0-11）
 * @returns 按日期聚合的特定月份学习数据
 */
export async function getMonthHeatmapData(year: number, month: number): Promise<HeatmapDataPoint[]> {
  try {
    // 获取当前用户ID
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) {
      console.error("User not logged in")
      return []
    }

    // 计算指定月份的开始和结束日期
    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 0)

    // 获取复习记录
    const { data, error } = await supabase
      .from("review_queue")
      .select("updated_at")
      .eq("user_id", userId)
      .gte("updated_at", startOfMonth.toISOString())
      .lte("updated_at", endOfMonth.toISOString())
      .order("updated_at", { ascending: true })

    if (error) {
      console.error("Error fetching heatmap data:", error)
      throw error
    }

    // 按日期聚合数据
    const dateMap = new Map<string, number>()

    data.forEach((item) => {
      const date = new Date(item.updated_at)
      const dateStr = date.toISOString().split("T")[0] // YYYY-MM-DD 格式

      if (dateMap.has(dateStr)) {
        dateMap.set(dateStr, dateMap.get(dateStr)! + 1)
      } else {
        dateMap.set(dateStr, 1)
      }
    })

    // 转换为数组格式
    const result: HeatmapDataPoint[] = Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count,
    }))

    return result
  } catch (error) {
    console.error("Error in getMonthHeatmapData:", error)
    return []
  }
}

/**
 * 获取用户的连续学习天数
 * @returns 连续学习天数
 */
export async function getConsecutiveStudyDays(): Promise<number> {
  try {
    const heatmapData = await getStudyHeatmapData(60) // 获取最近60天的数据
    if (heatmapData.length === 0) return 0

    // 按日期排序
    heatmapData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    let consecutiveDays = 1
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 检查今天是否有学习
    const todayStr = today.toISOString().split("T")[0]
    const hasTodayStudy = heatmapData.some((item) => item.date === todayStr)

    if (!hasTodayStudy) {
      // 如果今天没有学习，从昨天开始计算
      today.setDate(today.getDate() - 1)
    }

    let currentDate = today

    // 从最近的日期开始，检查连续天数
    while (true) {
      // 计算前一天
      const prevDate = new Date(currentDate)
      prevDate.setDate(prevDate.getDate() - 1)
      const prevDateStr = prevDate.toISOString().split("T")[0]

      // 检查前一天是否有学习记录
      const hasStudy = heatmapData.some((item) => item.date === prevDateStr)

      if (hasStudy) {
        consecutiveDays++
        currentDate = prevDate
      } else {
        break
      }
    }

    return consecutiveDays
  } catch (error) {
    console.error("Error in getConsecutiveStudyDays:", error)
    return 0
  }
}

/**
 * 获取用户的总学习天数
 * @returns 总学习天数
 */
export async function getTotalStudyDays(): Promise<number> {
  try {
    const heatmapData = await getStudyHeatmapData()
    return heatmapData.length
  } catch (error) {
    console.error("Error in getTotalStudyDays:", error)
    return 0
  }
}

/**
 * 获取用户的学习热力图数据
 * @param days 要获取的天数，默认365天
 * @returns 按日期聚合的学习数据
 */
export async function getStudyHeatmapData(days = 365): Promise<HeatmapDataPoint[]> {
  try {
    // 获取当前用户ID
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) {
      console.error("User not logged in")
      return []
    }

    // 计算开始日期
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // 获取复习记录
    const { data, error } = await supabase
      .from("review_queue")
      .select("updated_at")
      .eq("user_id", userId)
      .gte("updated_at", startDate.toISOString())
      .order("updated_at", { ascending: true })

    if (error) {
      console.error("Error fetching heatmap data:", error)
      throw error
    }

    // 按日期聚合数据
    const dateMap = new Map<string, number>()

    data.forEach((item) => {
      const date = new Date(item.updated_at)
      const dateStr = date.toISOString().split("T")[0] // YYYY-MM-DD 格式

      if (dateMap.has(dateStr)) {
        dateMap.set(dateStr, dateMap.get(dateStr)! + 1)
      } else {
        dateMap.set(dateStr, 1)
      }
    })

    // 转换为数组格式
    const result: HeatmapDataPoint[] = Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count,
    }))

    return result
  } catch (error) {
    console.error("Error in getStudyHeatmapData:", error)
    return []
  }
}
