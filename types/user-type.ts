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