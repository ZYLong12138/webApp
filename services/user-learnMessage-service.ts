import { supabase } from "@/lib/supabase" // 导入 supabase 客户端实例，用于与 Supabase 进行交互
import type { VocabularyWord, NewVocabularyWord } from "@/types/vocabulary" // 导入词汇类型定义
import type {
  UserLearningRecord,
  WordMastery,
  LearningStats,
  LearningHistory,
  LearningProgress
} from "@/types/user-type"

// 用户学习记录相关函数
export async function getUserLearningRecord(userId: string): Promise<UserLearningRecord> {
  try {
    const { data, error } = await supabase
      .from("user_learning_records")
      .select("*")
      .eq("userId", userId)
      .single()

    if (error) {
      console.error("Error fetching user learning record:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in getUserLearningRecord:", error)
    throw error
  }
}

export async function updateUserLearningDate(userId: string): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase
      .from("user_learning_records")
      .upsert({
        userId,
        lastLearningDate: today,
        updatedAt: new Date().toISOString()
      })

    if (error) {
      console.error("Error updating user learning date:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateUserLearningDate:", error)
    return false
  }
}

export async function checkUserTodayLearning(userId: string): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from("user_learning_records")
      .select("lastLearningDate")
      .eq("userId", userId)
      .eq("lastLearningDate", today)
      .single()

    if (error) {
      console.error("Error checking user today learning:", error)
      return false
    }

    return !!data
  } catch (error) {
    console.error("Error in checkUserTodayLearning:", error)
    return false
  }
}

// 单词掌握程度相关函数
export async function getUserWordMastery(userId: string, wordId: number): Promise<WordMastery> {
  try {
    const { data, error } = await supabase
      .from("word_mastery")
      .select("*")
      .eq("userId", userId)
      .eq("wordId", wordId)
      .single()

    if (error) {
      console.error("Error fetching word mastery:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in getUserWordMastery:", error)
    throw error
  }
}

export async function updateUserWordMastery(
  userId: string,
  wordId: number,
  masteryLevel: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("word_mastery")
      .upsert({
        userId,
        wordId,
        masteryLevel,
        lastReviewDate: new Date().toISOString(),
        nextReviewDate: calculateNextReviewDate(masteryLevel),
        updatedAt: new Date().toISOString()
      })

    if (error) {
      console.error("Error updating word mastery:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateUserWordMastery:", error)
    return false
  }
}

export async function getUserAllWordMastery(userId: string): Promise<WordMastery[]> {
  try {
    const { data, error } = await supabase
      .from("word_mastery")
      .select("*")
      .eq("userId", userId)
      .order("wordId", { ascending: true })

    if (error) {
      console.error("Error fetching all word mastery:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getUserAllWordMastery:", error)
    return []
  }
}

export async function getUserWordsByMasteryLevel(
  userId: string,
  masteryLevel: number
): Promise<WordMastery[]> {
  try {
    const { data, error } = await supabase
      .from("word_mastery")
      .select("*")
      .eq("userId", userId)
      .eq("masteryLevel", masteryLevel)
      .order("wordId", { ascending: true })

    if (error) {
      console.error("Error fetching words by mastery level:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getUserWordsByMasteryLevel:", error)
    return []
  }
}

// 学习统计相关函数
export async function getUserLearningStats(userId: string): Promise<LearningStats> {
  try {
    const { data: masteryData, error: masteryError } = await supabase
      .from("word_mastery")
      .select("masteryLevel")
      .eq("userId", userId)

    if (masteryError) {
      console.error("Error fetching mastery data:", masteryError)
      throw masteryError
    }

    const { data: recordData, error: recordError } = await supabase
      .from("user_learning_records")
      .select("lastLearningDate")
      .eq("userId", userId)
      .single()

    if (recordError) {
      console.error("Error fetching record data:", recordError)
      throw recordError
    }

    const totalWords = masteryData.length
    const masteredWords = masteryData.filter(w => w.masteryLevel >= 3).length
    const averageMasteryLevel = masteryData.reduce((acc, curr) => acc + curr.masteryLevel, 0) / totalWords

    return {
      totalWords,
      masteredWords,
      learningDays: 0, // 需要从其他表获取
      averageMasteryLevel,
      lastLearningDate: recordData.lastLearningDate
    }
  } catch (error) {
    console.error("Error in getUserLearningStats:", error)
    throw error
  }
}

export async function getUserRecentLearningHistory(
  userId: string,
  days: number
): Promise<LearningHistory[]> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from("learning_history")
      .select("*")
      .eq("userId", userId)
      .gte("date", startDateStr)
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching learning history:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getUserRecentLearningHistory:", error)
    return []
  }
}

// 学习进度相关函数
export async function getUserLearningProgress(userId: string): Promise<LearningProgress> {
  try {
    const { data: masteryData, error: masteryError } = await supabase
      .from("word_mastery")
      .select("*")
      .eq("userId", userId)

    if (masteryError) {
      console.error("Error fetching mastery data:", masteryError)
      throw masteryError
    }

    const { data: streakData, error: streakError } = await supabase
      .from("user_learning_records")
      .select("currentStreak, longestStreak")
      .eq("userId", userId)
      .single()

    if (streakError) {
      console.error("Error fetching streak data:", streakError)
      throw streakError
    }

    const totalWords = 4000 // 假设总单词数为4000
    const learnedWords = masteryData.length
    const progressPercentage = (learnedWords / totalWords) * 100

    return {
      totalWords,
      learnedWords,
      progressPercentage,
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak
    }
  } catch (error) {
    console.error("Error in getUserLearningProgress:", error)
    throw error
  }
}

export async function getUserWordsToReview(userId: string): Promise<WordMastery[]> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from("word_mastery")
      .select("*")
      .eq("userId", userId)
      .lte("nextReviewDate", today)
      .order("nextReviewDate", { ascending: true })

    if (error) {
      console.error("Error fetching words to review:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getUserWordsToReview:", error)
    return []
  }
}

// 辅助函数：计算下次复习日期
function calculateNextReviewDate(masteryLevel: number): string {
  const today = new Date()
  let daysToAdd = 1 // 默认1天后复习

  // 根据掌握程度调整复习间隔
  switch (masteryLevel) {
    case 0: // 完全不会
      daysToAdd = 1
      break
    case 1: // 有点印象
      daysToAdd = 3
      break
    case 2: // 基本掌握
      daysToAdd = 7
      break
    case 3: // 熟练掌握
      daysToAdd = 14
      break
    case 4: // 完全掌握
      daysToAdd = 30
      break
    default:
      daysToAdd = 1
  }

  today.setDate(today.getDate() + daysToAdd)
  return today.toISOString().split('T')[0]
}