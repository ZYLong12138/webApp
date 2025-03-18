import { supabase } from "@/lib/supabase" // 导入 supabase 客户端实例，用于与 Supabase 进行交互
import type { NewVocabularyWord, VocabularyWord } from "@/types/vocabulary" // 导入词汇类型定义

// 初始化数据库，检查词汇表是否存在，如果不存在则创建
export async function initializeDatabase(): Promise<boolean> {
  try {
    let tableExists = false // 用于标记词汇表是否存在

    // 使用 try-catch 检查表是否存在
    try {
      const { data, error } = await supabase.from("vocabulary_words").select("id").limit(1) // 尝试从 vocabulary_words 表中查询一条数据

      // 如果查询成功且没有错误，则表存在
      tableExists = !error
    } catch (checkError) {
      console.log("Table check failed, assuming table does not exist:", checkError) // 如果查询失败，假设表不存在
      tableExists = false
    }

    // 如果表不存在，则尝试创建该表
    if (!tableExists) {
      console.log("Table does not exist, attempting to create it")

      try {
        // 使用 SQL 语句直接创建表
        const { error: sqlError } = await supabase.sql(`
          CREATE TABLE IF NOT EXISTS vocabulary_words (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  // 自动生成唯一的 UUID 作为主键
            word TEXT NOT NULL,                             // 单词字段，不可为空
            definition TEXT NOT NULL,                       // 定义字段，不可为空
            example TEXT,                                   // 示例字段，允许为空
            mastery_level INTEGER NOT NULL DEFAULT 0,       // 掌握程度，默认为 0
            last_reviewed TIMESTAMP WITH TIME ZONE,         // 最后复习时间
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  // 创建时间，默认为当前时间
          );

          CREATE INDEX IF NOT EXISTS idx_vocabulary_words_word ON vocabulary_words(word);  // 为 word 字段创建索引
          CREATE INDEX IF NOT EXISTS idx_vocabulary_words_mastery ON vocabulary_words(mastery_level);  // 为 mastery_level 字段创建索引
        `)

        if (sqlError) {
          console.error("Error creating table via SQL:", sqlError)  // 如果创建表失败，输出错误信息
          return false
        }

        console.log("Table created successfully")  // 表创建成功
        return true
      } catch (createError) {
        console.error("Error creating table:", createError)  // 创建表时出现错误
        return false
      }
    }

    console.log("Table already exists")  // 表已经存在
    return true
  } catch (error) {
    console.error("Error initializing database:", error)  // 初始化数据库时发生错误
    return false
  }
}

// 获取所有词汇单词，返回词汇数据数组
export async function getVocabularyWords(): Promise<VocabularyWord[]> {
  try {
    // 确保数据库已初始化
    const initialized = await initializeDatabase()
    if (!initialized) {
      console.error("Database initialization failed")  // 初始化数据库失败
      return []
    }

    // 查询所有词汇单词，按创建时间降序排序
    const { data, error } = await supabase
      .from("vocabulary_words")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching vocabulary words:", error)  // 查询失败，输出错误信息
      throw error
    }

    return data || []  // 返回查询结果，如果没有数据则返回空数组
  } catch (error) {
    console.error("Error in getVocabularyWords:", error)  // 捕获任何查询过程中发生的错误
    return []  // 返回空数组表示查询失败
  }
}

// 添加一个新的词汇单词到数据库
export async function addVocabularyWord(newWord: NewVocabularyWord): Promise<VocabularyWord | null> {
  try {
    // 确保数据库已初始化
    const initialized = await initializeDatabase()
    if (!initialized) {
      console.error("Database initialization failed")  // 初始化数据库失败
      return null
    }

    // 向 vocabulary_words 表插入新单词
    const { data, error } = await supabase
      .from("vocabulary_words")
      .insert([
        {
          ...newWord,  // 将新单词的属性添加到插入数据中
          mastery_level: 0,  // 默认设置掌握程度为 0
        },
      ])
      .select()  // 返回插入的数据
      .single()  // 只返回一个插入的单词

    if (error) {
      console.error("Error adding vocabulary word:", error)  // 插入失败时输出错误信息
      throw error
    }

    return data  // 返回成功插入的单词数据
  } catch (error) {
    console.error("Error in addVocabularyWord:", error)  // 捕获插入过程中发生的错误
    return null  // 返回 null 表示插入失败
  }
}

// 更新指定词汇单词的掌握程度
export async function updateMasteryLevel(id: string, masteryLevel: number): Promise<boolean> {
  try {
    // 更新指定 id 的单词的掌握程度，并更新最后复习时间
    const { error } = await supabase
      .from("vocabulary_words")
      .update({
        mastery_level: masteryLevel,
        last_reviewed: new Date().toISOString(),  // 设置当前时间为最后复习时间
      })
      .eq("id", id)  // 通过 id 精确更新

    if (error) {
      console.error("Error updating mastery level:", error)  // 更新失败时输出错误信息
      throw error
    }

    return true  // 更新成功返回 true
  } catch (error) {
    console.error("Error in updateMasteryLevel:", error)  // 捕获更新过程中发生的错误
    return false  // 返回 false 表示更新失败
  }
}

// 删除指定 id 的词汇单词
export async function deleteVocabularyWord(id: string): Promise<boolean> {
  try {
    // 删除指定 id 的单词
    const { error } = await supabase.from("vocabulary_words").delete().eq("id", id)

    if (error) {
      console.error("Error deleting vocabulary word:", error)  // 删除失败时输出错误信息
      throw error
    }

    return true  // 删除成功返回 true
  } catch (error) {
    console.error("Error in deleteVocabularyWord:", error)  // 捕获删除过程中发生的错误
    return false  // 返回 false 表示删除失败
  }
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

