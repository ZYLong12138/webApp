import { supabase } from "@/lib/supabase"

/**
 * 将日期转换为UTC格式的日期字符串（YYYY-MM-DD）
 * @param date 日期对象
 * @returns UTC格式的日期字符串
 */
function dateToUTCString(date: Date): string {
  return date.toISOString().split("T")[0]
}

/**
 * 获取用户今日学习和复习的单词数量
 * @returns 今日学习和复习的单词数量
 */
export async function getTodayReviewCount(): Promise<number> {
  try {
    // 获取当前用户ID
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) {
      console.error("User not logged in")
      return 0
    }

    // 获取今天的日期（UTC）
    const today = new Date()
    const todayUTC = dateToUTCString(today)

    // 查询今日复习记录数量（使用UTC日期）
    const { data, error } = await supabase.from("review_queue").select("updated_at").eq("user_id", userId)

    if (error) {
      console.error("Error fetching today's review count:", error)
      throw error
    }

    // 手动过滤当天的记录
    const todayCount = data.filter((item) => {
      const itemDate = new Date(item.updated_at)
      const itemDateUTC = dateToUTCString(itemDate)
      return itemDateUTC === todayUTC
    }).length

    return todayCount
  } catch (error) {
    console.error("Error in getTodayReviewCount:", error)
    return 0
  }
}

/**
 * 获取用户累计学习的单词数量
 * @returns 累计学习的单词数量
 */
export async function getTotalReviewCount(): Promise<number> {
  try {
    // 获取当前用户ID
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) {
      console.error("User not logged in")
      return 0
    }

    // 查询所有复习记录数量
    const { count, error } = await supabase
      .from("review_queue")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (error) {
      console.error("Error fetching total review count:", error)
      throw error
    }

    return count || 0
  } catch (error) {
    console.error("Error in getTotalReviewCount:", error)
    return 0
  }
}

/**
 * 获取用户特定月份的学习热力图数据
 * @param year 年份
 * @param month 月份（0-11）
 * @returns 按日期聚合的特定月份学习数据
 */
export async function getMonthHeatmapData(year: number, month: number): Promise<{ date: string; count: number }[]> {
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

    // 计算指定月份的开始和结束日期（UTC）
    const startOfMonth = new Date(Date.UTC(year, month, 1))
    const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999))

    // 获取复习记录
    const { data, error } = await supabase
      .from("review_queue")
      .select("updated_at")
      .eq("user_id", userId)
      .gte("updated_at", startOfMonth.toISOString())
      .lte("updated_at", endOfMonth.toISOString())

    if (error) {
      console.error("Error fetching heatmap data:", error)
      throw error
    }

    // 按日期聚合数据
    const dateMap = new Map<string, number>()

    // 初始化月份中的所有日期为0
    for (let day = 1; day <= endOfMonth.getUTCDate(); day++) {
      const date = new Date(Date.UTC(year, month, day))
      const dateStr = dateToUTCString(date)
      dateMap.set(dateStr, 0)
    }

    // 统计每天的复习记录数量
    data.forEach((item) => {
      const date = new Date(item.updated_at)
      const dateStr = dateToUTCString(date)

      if (dateMap.has(dateStr)) {
        dateMap.set(dateStr, dateMap.get(dateStr)! + 1)
      } else {
        dateMap.set(dateStr, 1)
      }
    })

    // 转换为数组格式
    const result = Array.from(dateMap.entries()).map(([date, count]) => ({
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
    // 获取当前用户ID
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) {
      console.error("User not logged in")
      return 0
    }

    // 获取最近60天的数据
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 60)

    // 获取复习记录
    const { data, error } = await supabase
      .from("review_queue")
      .select("updated_at")
      .eq("user_id", userId)
      .gte("updated_at", startDate.toISOString())
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching consecutive study days:", error)
      throw error
    }

    if (data.length === 0) return 0

    // 按日期分组（使用UTC日期）
    const dateSet = new Set<string>()
    data.forEach((item) => {
      const date = new Date(item.updated_at)
      const dateStr = dateToUTCString(date)
      dateSet.add(dateStr)
    })

    // 转换为日期数组并排序
    const dates = Array.from(dateSet).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    // 检查今天是否有学习
    const todayStr = dateToUTCString(today)
    const hasTodayStudy = dates.includes(todayStr)

    let consecutiveDays = hasTodayStudy ? 1 : 0
    let currentDate = hasTodayStudy ? today : new Date(today.getTime() - 86400000) // 今天或昨天

    // 从最近的日期开始，检查连续天数
    while (true) {
      const dateStr = dateToUTCString(currentDate)

      // 如果当前日期不是今天，检查是否有学习记录
      if (!hasTodayStudy || dateStr !== todayStr) {
        if (dates.includes(dateStr)) {
          consecutiveDays++
        } else {
          break
        }
      }

      // 前一天
      currentDate = new Date(currentDate.getTime() - 86400000)
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
    // 获取当前用户ID
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) {
      console.error("User not logged in")
      return 0
    }

    // 获取所有复习记录
    const { data, error } = await supabase.from("review_queue").select("updated_at").eq("user_id", userId)

    if (error) {
      console.error("Error fetching total study days:", error)
      throw error
    }

    // 按日期分组（使用UTC日期）
    const dateSet = new Set<string>()
    data.forEach((item) => {
      const date = new Date(item.updated_at)
      const dateStr = dateToUTCString(date)
      dateSet.add(dateStr)
    })

    return dateSet.size
  } catch (error) {
    console.error("Error in getTotalStudyDays:", error)
    return 0
  }
}
