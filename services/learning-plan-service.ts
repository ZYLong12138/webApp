import { supabase } from "@/lib/supabase"

// 学习计划接口
export interface LearningPlan {
  id: string
  user_id: string
  book_id: string
  daily_word_count: number
  total_words: number
  completed_words: number
  created_at: string
  updated_at: string
  book_name?: string // 可选，用于显示
}

// 创建学习计划参数
export interface CreateLearningPlanParams {
  bookId: string
  dailyWordCount: number
}

/**
 * 创建学习计划
 */
export async function createLearningPlan(params: CreateLearningPlanParams): Promise<LearningPlan> {
  try {
    // 获取当前用户
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("用户未登录")
    }

    // 获取词书信息，包括总单词数
    const { data: bookData, error: bookError } = await supabase
      .from("book_list")
      .select("*")
      .eq("id", params.bookId)
      .single()

    if (bookError) {
      throw new Error("获取词书信息失败")
    }

    // 获取词书中的单词总数
    const { count: totalWords, error: countError } = await supabase
      .from("book_word_mapping")
      .select("*", { count: "exact", head: true })
      .eq("book_id", params.bookId)

    if (countError) {
      throw new Error("获取单词数量失败")
    }

    // 检查用户是否已有该词书的学习计划
    const { data: existingPlan, error: existingError } = await supabase
      .from("learning_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("book_id", params.bookId)
      .maybeSingle()

    if (existingError && existingError.code !== "PGRST116") {
      throw new Error("检查现有计划失败")
    }

    let plan

    if (existingPlan) {
      // 更新现有计划
      const { data: updatedPlan, error: updateError } = await supabase
        .from("learning_plans")
        .update({
          daily_word_count: params.dailyWordCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPlan.id)
        .select()
        .single()

      if (updateError) {
        throw new Error("更新学习计划失败")
      }

      plan = updatedPlan
    } else {
      // 创建新计划
      const { data: newPlan, error: insertError } = await supabase
        .from("learning_plans")
        .insert({
          user_id: user.id,
          book_id: params.bookId,
          daily_word_count: params.dailyWordCount,
          total_words: totalWords,
          completed_words: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        throw new Error("创建学习计划失败")
      }

      plan = newPlan
    }

    return {
      ...plan,
      book_name: bookData.book_name,
    }
  } catch (error) {
    console.error("创建学习计划错误:", error)
    throw error
  }
}

/**
 * 获取用户的所有学习计划
 */
export async function getUserLearningPlans(): Promise<LearningPlan[]> {
  try {
    // 获取当前用户
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("用户未登录")
    }

    // 获取用户的所有学习计划
    const { data: plans, error } = await supabase
      .from("learning_plans")
      .select(`
        *,
        book_list(book_name)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error("获取学习计划失败")
    }

    // 格式化返回数据
    return plans.map((plan) => ({
      ...plan,
      book_name: plan.book_list?.book_name,
    }))
  } catch (error) {
    console.error("获取学习计划错误:", error)
    throw error
  }
}

/**
 * 更新学习计划进度
 */
export async function updateLearningPlanProgress(planId: string, completedWords: number): Promise<void> {
  try {
    // 获取当前用户
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("用户未登录")
    }

    // 更新学习计划进度
    const { error } = await supabase
      .from("learning_plans")
      .update({
        completed_words: completedWords,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId)
      .eq("user_id", user.id)

    if (error) {
      throw new Error("更新学习计划进度失败")
    }
  } catch (error) {
    console.error("更新学习计划进度错误:", error)
    throw error
  }
}

/**
 * 删除学习计划
 */
export async function deleteLearningPlan(planId: string): Promise<void> {
  try {
    // 获取当前用户
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("用户未登录")
    }

    // 删除学习计划
    const { error } = await supabase.from("learning_plans").delete().eq("id", planId).eq("user_id", user.id)

    if (error) {
      throw new Error("删除学习计划失败")
    }
  } catch (error) {
    console.error("删除学习计划错误:", error)
    throw error
  }
}
