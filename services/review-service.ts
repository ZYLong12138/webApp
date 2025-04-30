import { supabase } from "@/lib/supabase"
import type {
  ReviewQueueItem,
  NewReviewQueueItem,
  UpdateReviewQueueItem,
  ReviewResult,
  ReviewPlan,
} from "@/types/review"
import { calculateNextReview, calculateNextReviewDate } from "@/algorithm/spaced-repetition"
import type { VocabularyWord } from "@/types/vocabulary"

/**
 * 获取用户的复习队列
 * @param limit 限制返回的数量
 * @returns 复习队列项目数组
 */
export async function getReviewQueue(limit = 100): Promise<ReviewQueueItem[]> {
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

    // 获取今天及之前应该复习的单词
    const today = new Date()
    today.setHours(23, 59, 59, 999) // 设置为今天的最后一刻

    const { data, error } = await supabase
      .from("review_queue")
      .select("*")
      .eq("user_id", userId)
      .lte("next_review_date", today.toISOString())
      .order("next_review_date", { ascending: true })
      .limit(limit)

    if (error) {
      console.error("Error fetching review queue:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error in getReviewQueue:", error)
    return []
  }
}

/**
 * 获取复习队列中的单词详情
 * @param limit 限制返回的数量
 * @returns 包含单词详情的复习队列
 */
export async function getReviewWords(limit = 100): Promise<Array<ReviewQueueItem & VocabularyWord>> {
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

    // 获取今天及之前应该复习的单词
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    // 联合查询复习队列和单词详情
    const { data, error } = await supabase
      .from("review_queue")
      .select(`
        *,
        word:word_id(*)
      `)
      .eq("user_id", userId)
      .lte("next_review_date", today.toISOString())
      .order("next_review_date", { ascending: true })
      .limit(limit)

    if (error) {
      console.error("Error fetching review words:", error)
      throw error
    }

    // 处理返回的数据格式
    return (data || []).map((item) => ({
      ...item,
      ...item.word,
    }))
  } catch (error) {
    console.error("Error in getReviewWords:", error)
    return []
  }
}

/**
 * 添加单词到复习队列
 * @param wordId 单词ID
 * @param initialInterval 初始间隔（天）
 * @returns 是否成功
 */
export async function addToReviewQueue(wordId: string | number, initialInterval = 1): Promise<boolean> {
  try {
    // 获取当前用户ID
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) {
      console.error("User not logged in")
      return false
    }

    // 计算初始复习日期（添加一些随机变化）
    const randomFactor = 0.9 + Math.random() * 0.2 // 0.9-1.1之间的随机数
    const interval = initialInterval * randomFactor
    const nextReviewDate = calculateNextReviewDate(interval)

    // 检查是否已存在
    const { data: existingItem, error: checkError } = await supabase
      .from("review_queue")
      .select("id")
      .eq("user_id", userId)
      .eq("word_id", wordId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116是"没有找到结果"的错误，这是我们期望的
      console.error("Error checking existing review item:", checkError)
      throw checkError
    }

    // 如果已存在，更新复习日期
    if (existingItem) {
      const { error: updateError } = await supabase
        .from("review_queue")
        .update({
          next_review_date: nextReviewDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingItem.id)

      if (updateError) {
        console.error("Error updating review queue:", updateError)
        throw updateError
      }
    } else {
      // 如果不存在，添加新记录
      const newItem: NewReviewQueueItem = {
        user_id: userId,
        word_id: wordId,
        next_review_date: nextReviewDate,
        current_interval: interval,
        ease_factor: 2.5, // 默认难度因子
        review_count: 0,
        last_review_date: null,
        last_review_result: null,
      }

      const { error: insertError } = await supabase.from("review_queue").insert([newItem])

      if (insertError) {
        console.error("Error adding to review queue:", insertError)
        throw insertError
      }
    }

    return true
  } catch (error) {
    console.error("Error in addToReviewQueue:", error)
    return false
  }
}

/**
 * 批量添加单词到复习队列
 * @param wordIds 单词ID数组
 * @param initialInterval 初始间隔（天）
 * @returns 是否成功
 */
export async function addMultipleToReviewQueue(wordIds: Array<string | number>, initialInterval = 1): Promise<boolean> {
  try {
    // 获取当前用户ID
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) {
      console.error("User not logged in")
      return false
    }

    // 为每个单词创建一个复习项
    const reviewItems: NewReviewQueueItem[] = wordIds.map((wordId) => {
      // 为每个单词添加一些随机变化
      const randomFactor = 0.9 + Math.random() * 0.2 // 0.9-1.1之间的随机数
      const interval = initialInterval * randomFactor
      const nextReviewDate = calculateNextReviewDate(interval)

      return {
        user_id: userId,
        word_id: wordId,
        next_review_date: nextReviewDate,
        current_interval: interval,
        ease_factor: 2.5, // 默认难度因子
        review_count: 0,
        last_review_date: null,
        last_review_result: null,
      }
    })

    // 批量插入
    const { error } = await supabase.from("review_queue").upsert(reviewItems, {
      onConflict: "user_id,word_id",
      ignoreDuplicates: false,
    })

    if (error) {
      console.error("Error adding multiple words to review queue:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error in addMultipleToReviewQueue:", error)
    return false
  }
}

/**
 * 提交复习结果
 * @param reviewItemId 复习项ID
 * @param result 复习结果
 * @returns 是否成功
 */
export async function submitReviewResult(reviewItemId: number, result: ReviewResult): Promise<boolean> {
  try {
    // 获取当前复习项
    const { data: reviewItem, error: fetchError } = await supabase
      .from("review_queue")
      .select("*")
      .eq("id", reviewItemId)
      .single()

    if (fetchError) {
      console.error("Error fetching review item:", fetchError)
      throw fetchError
    }

    // 计算新的间隔和难度因子
    const { nextInterval, newEaseFactor, reviewCount } = calculateNextReview(
      result,
      reviewItem.current_interval,
      reviewItem.ease_factor,
      reviewItem.review_count,
    )

    // 计算下次复习日期
    const nextReviewDate = calculateNextReviewDate(nextInterval)

    // 更新复习项
    const updateData: UpdateReviewQueueItem = {
      next_review_date: nextReviewDate,
      current_interval: nextInterval,
      ease_factor: newEaseFactor,
      review_count: reviewCount,
      last_review_date: new Date().toISOString(),
      last_review_result: result,
    }

    const { error: updateError } = await supabase.from("review_queue").update(updateData).eq("id", reviewItemId)

    if (updateError) {
      console.error("Error updating review item:", updateError)
      throw updateError
    }

    return true
  } catch (error) {
    console.error("Error in submitReviewResult:", error)
    return false
  }
}

/**
 * 获取复习计划统计信息
 * @returns 复习计划统计
 */
export async function getReviewPlan(): Promise<ReviewPlan> {
  try {
    // 获取当前用户ID
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) {
      console.error("User not logged in")
      return {
        dueToday: 0,
        newToday: 0,
        totalReviewed: 0,
        streakDays: 0,
      }
    }

    // 获取今天的日期范围
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 获取今天到期的复习项数量
    const { count: dueCount, error: dueError } = await supabase
      .from("review_queue")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .lte("next_review_date", tomorrow.toISOString())

    if (dueError) {
      console.error("Error counting due items:", dueError)
      throw dueError
    }

    // 获取新添加的复习项数量（今天添加且未复习过的）
    const { count: newCount, error: newError } = await supabase
      .from("review_queue")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString())
      .eq("review_count", 0)

    if (newError) {
      console.error("Error counting new items:", newError)
      throw newError
    }

    // 获取总共已复习的单词数量
    const { count: totalCount, error: totalError } = await supabase
      .from("review_queue")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gt("review_count", 0)

    if (totalError) {
      console.error("Error counting total reviewed items:", totalError)
      throw totalError
    }

    // 获取连续复习天数
    // 这需要一个额外的表来跟踪每天的复习情况
    // 这里简化处理，假设为0
    const streakDays = 0

    return {
      dueToday: dueCount || 0,
      newToday: newCount || 0,
      totalReviewed: totalCount || 0,
      streakDays,
    }
  } catch (error) {
    console.error("Error in getReviewPlan:", error)
    return {
      dueToday: 0,
      newToday: 0,
      totalReviewed: 0,
      streakDays: 0,
    }
  }
}

/**
 * 从复习队列中移除单词
 * @param wordId 单词ID
 * @returns 是否成功
 */
export async function removeFromReviewQueue(wordId: string | number): Promise<boolean> {
  try {
    // 获取当前用户ID
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) {
      console.error("User not logged in")
      return false
    }

    // 从复习队列中删除
    const { error } = await supabase.from("review_queue").delete().eq("user_id", userId).eq("word_id", wordId)

    if (error) {
      console.error("Error removing from review queue:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error in removeFromReviewQueue:", error)
    return false
  }
}
