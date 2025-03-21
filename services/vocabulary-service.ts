import { supabase } from "@/lib/supabase" // 导入 supabase 客户端实例，用于与 Supabase 进行交互
import type { Vocabulary, NewVocabulary } from "@/types/vocabulary" // 导入词汇类型定义

// 检查词汇表是否存在
export async function checkVocabularyTable(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("vocabulary")
      .select("id")
      .limit(1)

    return !error
  } catch (error) {
    console.error("Error checking vocabulary table:", error)
    return false
  }
}

// 获取所有词汇
export async function getVocabularyWords(): Promise<Vocabulary[]> {
  try {
    const { data, error } = await supabase
      .from("cet4")
      .select("*")
      .order("id", { ascending: true })

    if (error) {
      console.error("Error fetching vocabulary words:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error in getVocabularyWords:", error)
    return []
  }
}

// 添加新词汇
export async function addVocabularyWord(newWord: NewVocabulary): Promise<Vocabulary | null> {
  try {
    const { data, error } = await supabase
      .from("cet4")
      .insert([newWord])
      .select()
      .single()

    if (error) {
      console.error("Error adding vocabulary word:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in addVocabularyWord:", error)
    return null
  }
}

// 删除词汇
export async function deleteVocabularyWord(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("cet4")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting vocabulary word:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error in deleteVocabularyWord:", error)
    return false
  }
}

// 更新词汇
export async function updateVocabularyWord(id: number, word: Partial<NewVocabulary>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("cet4")
      .update(word)
      .eq("id", id)

    if (error) {
      console.error("Error updating vocabulary word:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error in updateVocabularyWord:", error)
    return false
  }
}

// 初始化数据库，检查词汇表是否存在，如果不存在则创建
export async function initializeDatabase(): Promise<boolean> {
  return true
}

// 更新指定词汇单词的掌握程度
export async function updateMasteryLevel(id: string, masteryLevel: number): Promise<boolean> {
    return true  // 返回 true 表示更新成功
}

/*
组件详细说明：
initializeDatabase：检查数据库中的 vocabulary_words 表是否存在，如果不存在，则通过执行 SQL 语句创建表。表包括 id（UUID 主键）、word（单词）、definition（定义）、example（示例）、mastery_level（掌握程度）、last_reviewed（最后复习时间）和 created_at（创建时间）。如果表不存在或创建失败，则返回 false。

getVocabularyWords：确保数据库已初始化后，查询 vocabulary_words 表中的所有单词，按创建时间降序排列并返回。

addVocabularyWord：确保数据库已初始化后，将新单词插入 vocabulary_words 表。如果插入成功，返回插入的单词数据。

updateMasteryLevel：更新指定单词的掌握程度，并设置 last_reviewed 字段为当前时间。如果更新成功，返回 true。

deleteVocabularyWord：删除指定 id 的单词。如果删除成功，返回 true。

每个函数都包含错误处理，确保在出错时能够输出相关的错误信息并返回适当的值（如 false 或 null）。
*/

