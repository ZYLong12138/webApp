// 用户学习记录类型
export interface UserLearningRecord {
  userId: string
  lastLearningDate: string
  totalLearningDays: number
  createdAt: string
  updatedAt: string
}

// 单词掌握程度类型
export interface WordMastery {
  userId: string
  wordId: number
  masteryLevel: number
  lastReviewDate: string
  nextReviewDate: string
  createdAt: string
  updatedAt: string
}

// 学习统计信息类型
export interface LearningStats {
  totalWords: number
  masteredWords: number
  learningDays: number
  averageMasteryLevel: number
  lastLearningDate: string
}

// 学习历史记录类型
export interface LearningHistory {
  date: string
  wordsLearned: number
  wordsReviewed: number
  averageMasteryLevel: number
}

// 学习进度类型
export interface LearningProgress {
  totalWords: number
  learnedWords: number
  progressPercentage: number
  currentStreak: number
  longestStreak: number
} 


//单词掌握情况 add by zyl.03.31
export interface word_mastery{
  word_id:number
  mastery_level:number
  review_count:number
  last_review_time:string | number
}
//用户学习日志数据结构
export interface study_log{
  userId: string
  learning_time:number
  studied_words_yestoday:number
  study_plan:number
  study_time_length:number
  book_learning:string
}