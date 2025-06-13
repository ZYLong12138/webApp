import { supabase } from "@/lib/supabase"
import type { VocabularyWord } from "@/types/vocabulary"

// 获取用户的生词本
export async function getUserVocabulary(page = 1, limit = 50): Promise<VocabularyWord[]> {
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

    // 计算分页的起始位置
    const from = (page - 1) * limit
    const to = from + limit - 1

    // 从user_vocabulary_words表获取用户的生词
    const { data, error } = await supabase
      .from("user_vocabulary_words")
      .select("*, word_id(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("Error fetching user vocabulary:", error)
      throw error
    }

    // 转换数据格式以匹配VocabularyWord类型
    return data.map((item) => ({
      id: item.word_id.id,
      word: item.word_id.word,
      definition: item.word_id.definition,
      example: item.word_id.example,
      pronunciation: item.word_id.pronunciation,
      mastery_level: 0, // 默认掌握程度
      last_reviewed: null,
      notes: item.notes, // 用户添加的笔记
      created_at: item.created_at,
      is_favorite: item.is_favorite,
    }))
  } catch (error) {
    console.error("Error in getUserVocabulary:", error)
    return []
  }
}

// 添加单词到生词本
export async function addToUserVocabulary(wordId: string | number, notes?: string): Promise<boolean> {
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

    // 检查单词是否已在生词本中
    const { data: existingData, error: checkError } = await supabase
      .from("user_vocabulary_words")
      .select("id")
      .eq("user_id", userId)
      .eq("word_id", wordId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116是"没有找到结果"的错误，这是我们期望的
      console.error("Error checking existing word:", checkError)
      throw checkError
    }

    // 如果单词已存在，更新笔记
    if (existingData) {
      const { error: updateError } = await supabase
        .from("user_vocabulary_words")
        .update({ notes, updated_at: new Date().toISOString() })
        .eq("id", existingData.id)

      if (updateError) {
        console.error("Error updating user vocabulary:", updateError)
        throw updateError
      }
    } else {
      // 如果单词不存在，添加到生词本
      const { error: insertError } = await supabase.from("user_vocabulary_words").insert([
        {
          user_id: userId,
          word_id: wordId,
          notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_favorite: false,
        },
      ])

      if (insertError) {
        console.error("Error adding to user vocabulary:", insertError)
        throw insertError
      }
    }

    return true
  } catch (error) {
    console.error("Error in addToUserVocabulary:", error)
    return false
  }
}

// 从生词本中移除单词
export async function removeFromUserVocabulary(wordId: string | number): Promise<boolean> {
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

    // 从生词本中删除单词
    const { error } = await supabase.from("user_vocabulary_words").delete().eq("user_id", userId).eq("word_id", wordId)

    if (error) {
      console.error("Error removing from user vocabulary:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error in removeFromUserVocabulary:", error)
    return false
  }
}

// 更新生词笔记
export async function updateVocabularyNotes(wordId: string | number, notes: string): Promise<boolean> {
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

    // 更新笔记
    const { error } = await supabase
      .from("user_vocabulary_words")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("word_id", wordId)

    if (error) {
      console.error("Error updating vocabulary notes:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error in updateVocabularyNotes:", error)
    return false
  }
}

// 切换收藏状态
export async function toggleFavorite(wordId: string | number): Promise<boolean> {
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

    // 获取当前收藏状态
    const { data, error: fetchError } = await supabase
      .from("user_vocabulary_words")
      .select("is_favorite")
      .eq("user_id", userId)
      .eq("word_id", wordId)
      .single()

    if (fetchError) {
      console.error("Error fetching favorite status:", fetchError)
      throw fetchError
    }

    // 切换收藏状态
    const { error: updateError } = await supabase
      .from("user_vocabulary_words")
      .update({ is_favorite: !data.is_favorite, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("word_id", wordId)

    if (updateError) {
      console.error("Error toggling favorite status:", updateError)
      throw updateError
    }

    return true
  } catch (error) {
    console.error("Error in toggleFavorite:", error)
    return false
  }
}

// 获取用户生词本中的单词数量
export async function getUserVocabularyCount(): Promise<number> {
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

    // 获取单词数量
    const { count, error } = await supabase
      .from("user_vocabulary_words")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (error) {
      console.error("Error counting user vocabulary:", error)
      throw error
    }

    return count || 0
  } catch (error) {
    console.error("Error in getUserVocabularyCount:", error)
    return 0
  }
}

// 检查单词是否在生词本中
export async function isInUserVocabulary(wordId: string | number): Promise<boolean> {
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

    // 检查单词是否存在
    const { data, error } = await supabase
      .from("user_vocabulary_words")
      .select("id")
      .eq("user_id", userId)
      .eq("word_id", wordId)
      .single()

    if (error && error.code === "PGRST116") {
      // 没有找到结果
      return false
    }

    if (error) {
      console.error("Error checking user vocabulary:", error)
      throw error
    }

    return !!data
  } catch (error) {
    console.error("Error in isInUserVocabulary:", error)
    return false
  }
}

// 批量获取用户生词本状态
export async function getBatchUserVocabularyStatus(
  wordIds: (string | number)[],
): Promise<Record<string | number, boolean>> {
  try {
    // 如果没有单词ID，返回空对象
    if (!wordIds.length) return {}

    // 获取当前用户ID
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) {
      console.error("User not logged in")
      return {}
    }

    // 从user_vocabulary_words表批量获取用户的生词状态
    const { data, error } = await supabase
      .from("user_vocabulary_words")
      .select("word_id")
      .eq("user_id", userId)
      .in("word_id", wordIds)

    if (error) {
      console.error("Error fetching user vocabulary status:", error)
      throw error
    }

    // 创建结果对象，默认所有单词都不在生词本中
    const result: Record<string | number, boolean> = {}
    wordIds.forEach((id) => {
      result[id] = false
    })

    // 更新在生词本中的单词状态
    data.forEach((item) => {
      result[item.word_id] = true
    })

    return result
  } catch (error) {
    console.error("Error in getBatchUserVocabularyStatus:", error)
    return {}
  }
}
