import { supabase } from "@/lib/supabase"

/**
 * 获取用户的打卡统计信息
 * 从study_log表中获取连续打卡天数和累计打卡天数
 */
export async function getStudyLogStats() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from("study_log")
      .select("consecutive_days, total_days, last_study_date")
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("Error fetching study log stats:", error)
      return {
        consecutiveDays: 0,
        totalDays: 0,
        lastStudyDate: null,
      }
    }

    return {
      consecutiveDays: data?.consecutive_days || 0,
      totalDays: data?.total_days || 0,
      lastStudyDate: data?.last_study_date || null,
    }
  } catch (error) {
    console.error("Error in getStudyLogStats:", error)
    return {
      consecutiveDays: 0,
      totalDays: 0,
      lastStudyDate: null,
    }
  }
}

/**
 * 更新用户的打卡记录
 * 在用户完成学习或复习后调用此函数
 */
export async function updateStudyLog() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    // 获取当前的study_log记录
    const { data } = await getStudyLogStats()

    // 返回最新的统计数据
    return data
  } catch (error) {
    console.error("Error in updateStudyLog:", error)
    return null
  }
}
