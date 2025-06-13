import { supabase } from "@/lib/supabase"

// 获取用户的学习时间统计
export async function getStudyTimeStats() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    // 获取今天的学习时间总和
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: todaySessions, error: todayError } = await supabase
      .from("study_sessions")
      .select("duration")
      .eq("user_id", user.id)
      .gte("start_time", today.toISOString())
      .not("duration", "is", null)

    if (todayError) {
      console.error("Error fetching today study sessions:", todayError)
      return null
    }

    // 计算今天的总学习时间（秒）
    const todayTotalSeconds = todaySessions?.reduce((total, session) => total + (session.duration || 0), 0) || 0

    // 获取累计打卡天数 - 使用review_queue表的updated_at字段
    const totalDays = await calculateTotalDaysFromReviewQueue(user.id)

    // 获取连续打卡天数 - 使用review_queue表的updated_at字段
    const streakDays = await calculateStreakDaysFromReviewQueue(user.id)

    // 格式化时间
    const formatTime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)

      if (hours > 0) {
        return `${hours}h ${minutes}min`
      }
      return `${minutes}min`
    }

    return {
      todayTime: formatTime(todayTotalSeconds),
      streakDays: streakDays,
      totalDays: totalDays,
    }
  } catch (error) {
    console.error("Error in getStudyTimeStats:", error)
    return null
  }
}

// 从review_queue表计算累计打卡天数
async function calculateTotalDaysFromReviewQueue(userId: string) {
  try {
    // 获取用户的review_queue记录
    const { data, error } = await supabase.from("review_queue").select("updated_at").eq("user_id", userId)

    if (error) {
      console.error("Error fetching review queue for total days calculation:", error)
      return 0
    }

    if (!data || data.length === 0) {
      return 0 // 没有复习记录
    }

    // 获取不重复的日期数量
    const uniqueDates = new Set()
    data.forEach((record) => {
      const date = new Date(record.updated_at).toISOString().split("T")[0]
      uniqueDates.add(date)
    })

    // 返回不重复的日期数量，即累计打卡天数
    return uniqueDates.size
  } catch (error) {
    console.error("Error calculating total days:", error)
    return 0
  }
}

// 从review_queue表计算连续打卡天数
async function calculateStreakDaysFromReviewQueue(userId: string) {
  try {
    // 获取用户的review_queue记录，按更新时间降序排列
    const { data, error } = await supabase
      .from("review_queue")
      .select("updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching review queue for streak calculation:", error)
      return 0
    }

    if (!data || data.length === 0) {
      return 0 // 没有复习记录
    }

    // 获取不重复的日期
    const uniqueDates = new Set()
    data.forEach((record) => {
      const date = new Date(record.updated_at).toISOString().split("T")[0]
      uniqueDates.add(date)
    })

    const dates = Array.from(uniqueDates).sort(
      (a, b) => new Date(b as string).getTime() - new Date(a as string).getTime(),
    )

    // 检查最近的日期是否是今天
    const today = new Date().toISOString().split("T")[0]
    if (dates[0] !== today) {
      return 0 // 如果今天没有学习，连续天数为0
    }

    let streakDays = 1 // 今天已经学习了
    const msPerDay = 24 * 60 * 60 * 1000

    // 检查之前的日期是否连续
    for (let i = 1; i < dates.length; i++) {
      const currentDate = new Date(dates[i - 1] as string)
      const prevDate = new Date(dates[i] as string)

      // 检查日期是否连续
      const dayDiff = Math.round((currentDate.getTime() - prevDate.getTime()) / msPerDay)

      if (dayDiff === 1) {
        streakDays++
      } else {
        break
      }
    }

    return streakDays
  } catch (error) {
    console.error("Error calculating streak days:", error)
    return 0
  }
}

// 获取用户的学习时间历史（用于图表展示）
export async function getStudyTimeHistory(days = 7) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    // 计算日期范围
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 获取时间段内的学习会话
    const { data, error } = await supabase
      .from("study_sessions")
      .select("start_time, duration")
      .eq("user_id", user.id)
      .gte("start_time", startDate.toISOString())
      .lte("start_time", endDate.toISOString())
      .not("duration", "is", null)

    if (error) {
      console.error("Error fetching study time history:", error)
      return []
    }

    // 按日期分组
    const dailyTotals = {}
    data?.forEach((session) => {
      const date = new Date(session.start_time).toISOString().split("T")[0]
      dailyTotals[date] = (dailyTotals[date] || 0) + (session.duration || 0)
    })

    // 填充所有日期（包括没有学习记录的日期）
    const result = []
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split("T")[0]

      result.push({
        date: dateStr,
        minutes: Math.round((dailyTotals[dateStr] || 0) / 60), // 转换为分钟
      })
    }

    return result
  } catch (error) {
    console.error("Error in getStudyTimeHistory:", error)
    return []
  }
}
