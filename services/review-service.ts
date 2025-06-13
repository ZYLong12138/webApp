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
 * @param bookId 可选的词书ID，用于过滤特定词书的单词
 * @param limit 限制返回的数量
 * @returns 复习队列项目数组
 */
export async function getReviewQueue(bookId?: string | number, limit = 100): Promise<ReviewQueueItem[]> {
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

    // 如果指定了词书ID，先获取该词书包含的单词ID
    let wordIds: number[] | null = null
    if (bookId) {
      const { data: mappingData, error: mappingError } = await supabase
        .from("book_word_mapping")
        .select("word_id")
        .eq("book_id", bookId)

      if (mappingError) {
        console.error(`Error fetching word IDs for book ${bookId}:`, mappingError)
        throw mappingError
      }

      if (!mappingData || mappingData.length === 0) {
        console.log(`No words found for book ${bookId}`)
        return []
      }

      wordIds = mappingData.map((item) => item.word_id)
      console.log(`Found ${wordIds.length} words for book ${bookId}`)
    }

    // 构建查询
    let query = supabase
      .from("review_queue")
      .select("*")
      .eq("user_id", userId)
      .lte("next_review_date", today.toISOString())
      .order("next_review_date", { ascending: true })

    // 如果有词书过滤，添加条件
    if (wordIds) {
      query = query.in("word_id", wordIds)
    }

    // 限制返回数量
    query = query.limit(limit)

    // 执行查询
    const { data, error } = await query

    if (error) {
      console.error("Error fetching review queue:", error)
      throw error
    }

    console.log(`Retrieved ${data?.length || 0} review queue items`)
    return data || []
  } catch (error) {
    console.error("Error in getReviewQueue:", error)
    return []
  }
}

/**
 * 获取所有复习队列项目
 * @returns 所有复习队列项目数组
 */
export async function getAllReviewQueueItems(): Promise<ReviewQueueItem[]> {
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

    const { data, error } = await supabase
      .from("review_queue")
      .select("*")
      .eq("user_id", userId)
      .order("next_review_date", { ascending: true })

    if (error) {
      console.error("Error fetching all review queue items:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error in getAllReviewQueueItems:", error)
    return []
  }
}

/**
 * 获取复习队列中的单词详情
 * @param bookId 可选的词书ID，用于过滤特定词书的单词
 * @param limit 限制返回的数量
 * @returns 包含单词详情的复习队列
 */
export async function getReviewWords(
  bookId?: string | number,
  limit = 100,
): Promise<Array<ReviewQueueItem & VocabularyWord>> {
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

    // 如果指定了词书ID，先获取该词书包含的单词ID
    let wordIds: number[] | null = null
    if (bookId) {
      const { data: mappingData, error: mappingError } = await supabase
        .from("book_word_mapping")
        .select("word_id")
        .eq("book_id", bookId)

      if (mappingError) {
        console.error(`Error fetching word IDs for book ${bookId}:`, mappingError)
        throw mappingError
      }

      if (!mappingData || mappingData.length === 0) {
        console.log(`No words found for book ${bookId}`)
        return []
      }

      wordIds = mappingData.map((item) => item.word_id)
      console.log(`Found ${wordIds.length} words for book ${bookId}`)
    }

    // 构建查询
    let query = supabase
      .from("review_queue")
      .select("*")
      .eq("user_id", userId)
      .lte("next_review_date", today.toISOString())
      .order("next_review_date", { ascending: true })

    // 如果有词书过滤，添加条件
    if (wordIds) {
      query = query.in("word_id", wordIds)
    }

    // 限制返回数量
    query = query.limit(limit)

    // 执行查询
    const { data: reviewData, error: reviewError } = await query

    if (reviewError) {
      console.error("Error fetching review queue:", reviewError)
      throw reviewError
    }

    if (!reviewData || reviewData.length === 0) {
      console.log("No review items found")
      return []
    }

    // 获取单词ID列表
    const reviewWordIds = reviewData.map((item) => item.word_id)

    // 获取单词详情
    const { data: wordsData, error: wordsError } = await supabase.from("word_list").select("*").in("id", reviewWordIds)

    if (wordsError) {
      console.error("Error fetching words data:", wordsError)
      throw wordsError
    }

    // 获取单词与词书的映射关系
    const { data: mappingData, error: mappingError } = await supabase
      .from("book_word_mapping")
      .select("*")
      .in("word_id", reviewWordIds)

    if (mappingError) {
      console.error("Error fetching book-word mapping:", mappingError)
      throw mappingError
    }

    // 合并数据
    const result = reviewData
      .map((reviewItem) => {
        // 查找单词详情
        const wordData = wordsData.find((word) => word.id === reviewItem.word_id)
        if (!wordData) {
          console.warn(`Word data not found for word_id: ${reviewItem.word_id}`)
          return null
        }

        // 查找该单词所属的所有词书
        const bookMappings = mappingData.filter((mapping) => mapping.word_id === reviewItem.word_id)
        const bookIds = bookMappings.map((mapping) => mapping.book_id)

        return {
          ...reviewItem,
          ...wordData,
          bookIds: bookIds, // 添加单词所属的词书ID数组
        }
      })
      .filter((item) => item !== null)

    console.log(`Retrieved ${result.length} review words with details`)
    return result
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
      .maybeSingle() // 使用maybeSingle代替single

    if (checkError && checkError.code !== "PGRST116") {
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
    // 获取当前用户ID
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) {
      console.error("User not logged in")
      return false
    }

    // 首先检查复习项是否存在于word_list表中
    const { data: wordData, error: wordError } = await supabase
      .from("word_list")
      .select("id")
      .eq("id", reviewItemId)
      .maybeSingle()

    if (wordError) {
      console.error(`Error checking word existence (ID: ${reviewItemId}):`, wordError)
    }

    if (!wordData) {
      console.warn(`Word with ID ${reviewItemId} does not exist in word_list table`)
      // 如果单词不存在，我们可以选择跳过而不是失败
      return false
    }

    // 获取当前复习项 - 使用maybeSingle()代替single()
    const { data: reviewItem, error: fetchError } = await supabase
      .from("review_queue")
      .select("*")
      .eq("word_id", reviewItemId) // 使用word_id而不是id
      .eq("user_id", userId)
      .maybeSingle()

    if (fetchError) {
      console.error(`Error fetching review item (word_id: ${reviewItemId}):`, fetchError)
      throw fetchError
    }

    // 如果没有找到对应的复习项，尝试创建一个新的
    if (!reviewItem) {
      console.warn(`Review item not found for word_id ${reviewItemId} and user ${userId}, creating new entry`)

      // 创建一个新的复习项
      const newItem: NewReviewQueueItem = {
        user_id: userId,
        word_id: reviewItemId,
        next_review_date: new Date().toISOString(), // 立即复习
        current_interval: 0,
        ease_factor: 2.5, // 默认难度因子
        review_count: 0,
        last_review_date: null,
        last_review_result: null,
      }

      const { error: insertError } = await supabase.from("review_queue").insert([newItem])

      if (insertError) {
        console.error(`Error creating new review item for word_id ${reviewItemId}:`, insertError)
        return false
      }

      // 重新获取刚创建的复习项
      const { data: newReviewItem, error: newFetchError } = await supabase
        .from("review_queue")
        .select("*")
        .eq("word_id", reviewItemId)
        .eq("user_id", userId)
        .maybeSingle()

      if (newFetchError) {
        console.error(`Error fetching newly created review item:`, newFetchError)
        return false
      }

      // 使用新创建的复习项，如果存在的话
      if (newReviewItem) {
        // 计算新的间隔和难度因子
        const { nextInterval, newEaseFactor, reviewCount } = calculateNextReview(
          result,
          newReviewItem.current_interval || 0,
          newReviewItem.ease_factor || 2.5,
          newReviewItem.review_count || 0,
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

        // 更新时同时使用word_id和user_id作为条件
        const { error: updateError } = await supabase
          .from("review_queue")
          .update(updateData)
          .eq("word_id", reviewItemId)
          .eq("user_id", userId)

        if (updateError) {
          console.error(`Error updating review item (word_id: ${reviewItemId}):`, updateError)
          throw updateError
        }

        return true
      } else {
        console.error(`Failed to create or retrieve review item for word_id ${reviewItemId}`)
        return false
      }
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

    // 更新时同时使用word_id和user_id作为条件
    const { error: updateError } = await supabase
      .from("review_queue")
      .update(updateData)
      .eq("word_id", reviewItemId)
      .eq("user_id", userId)

    if (updateError) {
      console.error(`Error updating review item (word_id: ${reviewItemId}):`, updateError)
      throw updateError
    }

    return true
  } catch (error) {
    console.error(`Error in submitReviewResult (ID: ${reviewItemId}):`, error)
    return false
  }
}

// 添加批量提交复习结果的函数
export async function batchSubmitReviewResults(
  results: Array<{ reviewItemId: number; result: ReviewResult }>,
): Promise<boolean> {
  try {
    // 使用事务确保所有更新要么全部成功，要么全部失败
    const updates = results.map(({ reviewItemId, result }) => submitReviewResult(reviewItemId, result))

    // 并行处理所有更新请求
    await Promise.all(updates)

    console.log(`成功更新了 ${results.length} 个复习结果`)
    return true
  } catch (error) {
    console.error("Error in batchSubmitReviewResults:", error)
    return false
  }
}

/**
 * 获取复习计划统计信息
 * @param bookId 可选的词书ID，用于获取特定词书的复习计划
 * @returns 复习计划统计
 */
export async function getReviewPlan(bookId?: string | number): Promise<ReviewPlan> {
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

    // 如果指定了词书ID，先获取该词书包含的单词ID
    let wordIds: number[] | null = null
    if (bookId) {
      const { data: mappingData, error: mappingError } = await supabase
        .from("book_word_mapping")
        .select("word_id")
        .eq("book_id", bookId)

      if (mappingError) {
        console.error(`Error fetching word IDs for book ${bookId}:`, mappingError)
        throw mappingError
      }

      if (!mappingData || mappingData.length === 0) {
        console.log(`No words found for book ${bookId}`)
        return {
          dueToday: 0,
          newToday: 0,
          totalReviewed: 0,
          streakDays: 0,
        }
      }

      wordIds = mappingData.map((item) => item.word_id)
      console.log(`Found ${wordIds.length} words for book ${bookId}`)
    }

    // 构建查询 - 今天到期的复习项
    let dueQuery = supabase
      .from("review_queue")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .lte("next_review_date", tomorrow.toISOString())

    // 如果有词书过滤，添加条件
    if (wordIds) {
      dueQuery = dueQuery.in("word_id", wordIds)
    }

    // 执行查询
    const { count: dueCount, error: dueError } = await dueQuery

    if (dueError) {
      console.error("Error counting due items:", dueError)
      throw dueError
    }

    // 构建查询 - 今天新添加的复习项
    let newQuery = supabase
      .from("review_queue")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString())
      .eq("review_count", 0)

    // 如果有词书过滤，添加条件
    if (wordIds) {
      newQuery = newQuery.in("word_id", wordIds)
    }

    // 执行查询
    const { count: newCount, error: newError } = await newQuery

    if (newError) {
      console.error("Error counting new items:", newError)
      throw newError
    }

    // 构建查询 - 总共已复习的单词
    let totalQuery = supabase
      .from("review_queue")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gt("review_count", 0)

    // 如果有词书过滤，添加条件
    if (wordIds) {
      totalQuery = totalQuery.in("word_id", wordIds)
    }

    // 执行查询
    const { count: totalCount, error: totalError } = await totalQuery

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

/**
 * 获取已复习的单词
 * @param bookId 可选的词书ID，用于过滤特定词书的单词
 * @param fromDate 可选的起始日期，用于获取该日期之后复习的单词
 * @returns 包含单词详情的复习队列
 */
export async function getReviewedWords(bookId?: string | number, fromDate?: string): Promise<VocabularyWord[]> {
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

    // 获取复习队列中的单词ID
    let reviewQuery = supabase.from("review_queue").select("word_id").eq("user_id", userId).gt("review_count", 0) // 只获取已复习过的单词

    // 如果指定了起始日期，添加日期过滤
    if (fromDate) {
      reviewQuery = reviewQuery.gte("last_review_date", fromDate)
    }

    const { data: reviewData, error: reviewError } = await reviewQuery

    if (reviewError) {
      console.error("Error fetching reviewed words:", reviewError)
      throw reviewError
    }

    if (!reviewData || reviewData.length === 0) {
      console.log("No reviewed words found")
      return []
    }

    // 提取单词ID
    const wordIds = reviewData.map((item) => item.word_id)

    // 获取单词详情
    const { data: wordsData, error: wordsError } = await supabase.from("word_list").select("*").in("id", wordIds)

    if (wordsError) {
      console.error("Error fetching word details:", wordsError)
      throw wordsError
    }

    // 如果指定了词书ID，过滤单词
    if (bookId) {
      // 获取词书中的单词ID
      const { data: mappingData, error: mappingError } = await supabase
        .from("book_word_mapping")
        .select("word_id")
        .eq("book_id", bookId)

      if (mappingError) {
        console.error("Error fetching book word mappings:", mappingError)
        throw mappingError
      }

      if (mappingData && mappingData.length > 0) {
        const bookWordIds = mappingData.map((item) => item.word_id)
        // 只保留同时在词书和复习队列中的单词
        return wordsData.filter((word) => bookWordIds.includes(word.id))
      }

      return []
    }

    // 获取单词的掌握程度
    const { data: masteryData, error: masteryError } = await supabase
      .from("word_mastery")
      .select("*")
      .eq("user_id", userId)
      .in("word_id", wordIds)

    if (masteryError) {
      console.error("Error fetching mastery data:", masteryError)
      // 如果获取掌握程度失败，仍然返回单词数据，但掌握程度默认为0
      return wordsData.map((word) => ({
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
    return wordsData.map((word) => {
      const mastery = masteryMap.get(word.id)
      return {
        ...word,
        mastery_level: mastery ? mastery.mastery_level : 0,
        last_reviewed: mastery ? mastery.last_reviewed : null,
        has_mastery_data: !!mastery,
      }
    })
  } catch (error) {
    console.error("Error in getReviewedWords:", error)
    return []
  }
}
