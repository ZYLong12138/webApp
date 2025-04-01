import { supabase } from "@/lib/supabase"
import type { VocabularyWord, NewVocabularyWord } from "@/types/vocabulary"

// 检查词汇表是否存在
export async function checkVocabularyTables(): Promise<{
  wordListExists: boolean
  bookListExists: boolean
  mappingExists: boolean
}> {
  try {
    // 检查word_list表
    const { data: wordData, error: wordError } = await supabase.from("word_list").select("id").limit(1)

    // 检查book_list表
    const { data: bookData, error: bookError } = await supabase.from("book_list").select("id").limit(1)

    // 检查book_word_mapping表（使用小写表名）
    const { data: mappingData, error: mappingError } = await supabase
      .from("book_word_mapping")
      .select("book_id, word_id")
      .limit(1)

    return {
      wordListExists: !wordError,
      bookListExists: !bookError,
      mappingExists: !mappingError,
    }
  } catch (error) {
    console.error("Error checking vocabulary tables:", error)
    return {
      wordListExists: false,
      bookListExists: false,
      mappingExists: false,
    }
  }
}

// 获取所有词书
export async function getAllBooks() {
  try {
    const { data, error } = await supabase.from("book_list").select("*").order("book_name", { ascending: true })

    if (error) {
      console.error("Error fetching books:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error in getAllBooks:", error)
    return []
  }
}

// 获取特定词书的信息
export async function getBookById(bookId: string) {
  try {
    const { data, error } = await supabase.from("book_list").select("*").eq("id", bookId).single()

    if (error) {
      console.error("Error fetching book:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in getBookById:", error)
    return null
  }
}

// 获取所有词汇或特定词书的词汇，支持分页
export async function getVocabularyWords(bookId?: string, page = 1, limit = 200): Promise<VocabularyWord[]> {
  try {
    // 获取当前用户ID
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id

    // 计算分页的起始位置
    const from = (page - 1) * limit
    const to = from + limit - 1

    // 如果没有指定词书ID，直接获取所有单词
    if (!bookId || bookId === "my-vocabulary") {
      const { data: words, error: wordsError } = await supabase
        .from("word_list")
        .select("*")
        .order("id", { ascending: true })
        .range(from, to)

      if (wordsError) {
        console.error("Error fetching vocabulary words:", wordsError)
        throw wordsError
      }

      // 处理掌握程度数据
      return processWordMasteryData(words || [], userId)
    }

    // 如果指定了词书ID，尝试通过映射表过滤单词
    try {
      // 尝试获取词书中的单词ID列表
      const { data: mappingData, error: mappingError } = await supabase
        .from("book_word_mapping") // 使用小写表名
        .select("word_id")
        .eq("book_id", bookId)

      // 如果映射表不存在或查询出错，直接返回空数组
      if (mappingError) {
        console.error("Error fetching word mappings:", mappingError)
        return []
      }

      // 如果词书中有单词，过滤word_list表
      if (mappingData && mappingData.length > 0) {
        const wordIds = mappingData.map((item) => item.word_id)

        // 使用分页参数获取单词
        const { data: words, error: wordsError } = await supabase
          .from("word_list")
          .select("*")
          .in("id", wordIds)
          .order("id", { ascending: true })
          .range(from, to)

        if (wordsError) {
          console.error("Error fetching vocabulary words:", wordsError)
          throw wordsError
        }

        // 处理掌握程度数据
        return processWordMasteryData(words || [], userId)
      } else {
        // 词书中没有单词，返回空数组
        return []
      }
    } catch (error) {
      // 如果出现错误（例如表不存在），返回空数组
      console.error("Error in book word mapping:", error)
      return []
    }
  } catch (error) {
    console.error("Error in getVocabularyWords:", error)
    return []
  }
}

// 添加一个辅助函数来处理单词掌握程度数据
async function processWordMasteryData(words: any[], userId: string | undefined): Promise<VocabularyWord[]> {
  // 如果用户未登录，只返回单词数据，掌握程度默认为0
  if (!userId) {
    return words.map((word) => ({
      ...word,
      mastery_level: 0,
      last_reviewed: null,
    }))
  }

  // 如果用户已登录，获取掌握程度数据
  try {
    const { data: masteryData, error: masteryError } = await supabase
      .from("word_mastery")
      .select("*")
      .eq("user_id", userId)

    if (masteryError) {
      console.error("Error fetching mastery data:", masteryError)
      // 如果获取掌握程度失败，仍然返回单词数据，但掌握程度默认为0
      return words.map((word) => ({
        ...word,
        mastery_level: 0,
        last_reviewed: null,
      }))
    }

    // 创建掌握程度查找表
    const masteryMap = new Map()
    masteryData?.forEach((mastery) => {
      masteryMap.set(mastery.word_id, {
        mastery_level: mastery.mastery_level,
        last_reviewed: mastery.last_reviewed,
      })
    })

    // 合并单词数据和掌握程度
    return words.map((word) => {
      const mastery = masteryMap.get(word.id)
      return {
        ...word,
        mastery_level: mastery ? mastery.mastery_level : 0,
        last_reviewed: mastery ? mastery.last_reviewed : null,
      }
    })
  } catch (error) {
    console.error("Error processing mastery data:", error)
    return words.map((word) => ({
      ...word,
      mastery_level: 0,
      last_reviewed: null,
    }))
  }
}

// 修改 getBookWordCount 函数，使用小写表名并添加错误处理
export async function getBookWordCount(bookId: string): Promise<number> {
  try {
    // 如果是"我的单词本"，返回所有单词数量
    if (bookId === "my-vocabulary") {
      const { count, error } = await supabase.from("word_list").select("*", { count: "exact", head: true })

      if (error) {
        console.error("Error counting words:", error)
        return 0
      }

      return count || 0
    }

    // 否则尝试获取特定词书的单词数量
    try {
      const { count, error } = await supabase
        .from("book_word_mapping") // 使用小写表名
        .select("*", { count: "exact", head: true })
        .eq("book_id", bookId)

      if (error) {
        console.error("Error counting book words:", error)
        return 0
      }

      return count || 0
    } catch (error) {
      // 如果表不存在或其他错误，返回0
      console.error("Error in getBookWordCount:", error)
      return 0
    }
  } catch (error) {
    console.error("Error in getBookWordCount:", error)
    return 0
  }
}

// 添加新词汇
export async function addVocabularyWord(newWord: NewVocabularyWord, bookId?: string): Promise<VocabularyWord | null> {
  try {
    // 添加单词到word_list表
    const { data, error } = await supabase.from("word_list").insert([newWord]).select().single()

    if (error) {
      console.error("Error adding vocabulary word:", error)
      throw error
    }

    // 如果指定了词书ID，添加映射关系
    if (bookId && data) {
      const { error: mappingError } = await supabase.from("Book_word_mapping").insert([
        {
          book_id: bookId,
          word_id: data.id,
        },
      ])

      if (mappingError) {
        console.error("Error adding word to book:", mappingError)
        // 不抛出错误，因为单词已经添加成功
      }
    }

    return {
      ...data,
      mastery_level: 0,
      last_reviewed: null,
    }
  } catch (error) {
    console.error("Error in addVocabularyWord:", error)
    return null
  }
}

// 修改 deleteVocabularyWord 函数，使用小写表名
export async function deleteVocabularyWord(id: string | number): Promise<boolean> {
  try {
    // 获取当前用户ID
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id

    // 首先删除掌握程度记录（如果存在）
    if (userId) {
      const { error: masteryError } = await supabase
        .from("word_mastery")
        .delete()
        .eq("word_id", id)
        .eq("user_id", userId)

      if (masteryError) {
        console.error("Error deleting mastery record:", masteryError)
        // 继续尝试删除单词，即使掌握程度删除失败
      }
    }

    // 尝试删除词书映射关系
    try {
      const { error: mappingError } = await supabase
        .from("book_word_mapping") // 使用小写表名
        .delete()
        .eq("word_id", id)

      if (mappingError) {
        console.error("Error deleting word mapping:", mappingError)
        // 继续尝试删除单词，即使映射删除失败
      }
    } catch (error) {
      // 如果表不存在，忽略错误
      console.error("Error deleting from mapping table:", error)
    }

    // 然后删除单词
    const { error } = await supabase.from("word_list").delete().eq("id", id)

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
export async function updateVocabularyWord(id: string | number, word: Partial<NewVocabularyWord>): Promise<boolean> {
  try {
    const { error } = await supabase.from("word_list").update(word).eq("id", id)

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

// 初始化数据库，检查词汇表是否存在
export async function initializeDatabase(): Promise<boolean> {
  try {
    const { wordListExists, bookListExists, mappingExists } = await checkVocabularyTables()

    if (!wordListExists || !bookListExists || !mappingExists) {
      console.error("One or more required tables do not exist")
      return false
    }

    // 检查word_mastery表是否存在
    try {
      const { data, error } = await supabase.from("word_mastery").select("word_id, user_id").limit(1)

      if (error) {
        console.error("word_mastery table may not exist:", error)
        return false
      }
    } catch (error) {
      console.error("Error checking word_mastery table:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in initializeDatabase:", error)
    return false
  }
}

// 更新指定词汇单词的掌握程度
export async function updateMasteryLevel(id: string | number, masteryLevel: number): Promise<boolean> {
  try {
    // 获取当前用户ID
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) {
      console.error("User not logged in, cannot update mastery level")
      return false
    }

    // 使用upsert操作 - 如果记录存在则更新，不存在则插入
    const { error } = await supabase.from("word_mastery").upsert(
      {
        word_id: id,
        user_id: userId,
        mastery_level: masteryLevel,
        last_reviewed: new Date().toISOString(),
      },
      {
        onConflict: "word_id,user_id", // 指定冲突检测的列
      },
    )

    if (error) {
      console.error("Error updating mastery level:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error in updateMasteryLevel:", error)
    return false
  }
}

// 添加单词到词书
export async function addWordToBook(wordId: number, bookId: string): Promise<boolean> {
  try {
    // 检查映射是否已存在
    const { data: existingMapping, error: checkError } = await supabase
      .from("book_word_mapping") // 使用小写表名
      .select("*")
      .eq("word_id", wordId)
      .eq("book_id", bookId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 是"没有找到结果"的错误，这是我们期望的
      console.error("Error checking existing mapping:", checkError)
      throw checkError
    }

    // 如果映射已存在，直接返回成功
    if (existingMapping) {
      return true
    }

    // 添加新映射
    const { error } = await supabase.from("book_word_mapping").insert([
      {
        book_id: bookId,
        word_id: wordId,
      },
    ])

    if (error) {
      console.error("Error adding word to book:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error in addWordToBook:", error)
    return false
  }
}

// 从词书中移除单词
export async function removeWordFromBook(wordId: number, bookId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("book_word_mapping") // 使用小写表名
      .delete()
      .eq("word_id", wordId)
      .eq("book_id", bookId)

    if (error) {
      console.error("Error removing word from book:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error in removeWordFromBook:", error)
    return false
  }
}

// 创建新词书
export async function createBook(bookName: string, description: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("book_list")
      .insert([
        {
          book_name: bookName,
          description: description,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating book:", error)
      throw error
    }

    return data?.id || null
  } catch (error) {
    console.error("Error in createBook:", error)
    return null
  }
}

// 修改 deleteBook 函数，使用小写表名
export async function deleteBook(bookId: string): Promise<boolean> {
  try {
    // 尝试删除词书中的所有单词映射
    try {
      const { error: mappingError } = await supabase
        .from("book_word_mapping") // 使用小写表名
        .delete()
        .eq("book_id", bookId)

      if (mappingError) {
        console.error("Error deleting book mappings:", mappingError)
        // 继续尝试删除词书，即使映射删除失败
      }
    } catch (error) {
      // 如果表不存在，忽略错误
      console.error("Error deleting from mapping table:", error)
    }

    // 然后删除词书
    const { error } = await supabase.from("book_list").delete().eq("id", bookId)

    if (error) {
      console.error("Error deleting book:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error in deleteBook:", error)
    return false
  }
}

