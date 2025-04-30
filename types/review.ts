// 复习结果类型
export type ReviewResult = "again" | "hard" | "good" | "easy"

// 复习队列项类型
export interface ReviewQueueItem {
  id: number
  user_id: string
  word_id: number | string
  next_review_date: string // ISO 日期字符串
  current_interval: number // 当前间隔（天）
  ease_factor: number // 难度因子
  review_count: number // 复习次数
  last_review_date: string | null // ISO 日期字符串
  last_review_result: ReviewResult | null
  created_at: string
  updated_at: string
}

// 用于创建新复习项的类型
export interface NewReviewQueueItem {
  user_id: string
  word_id: number | string
  next_review_date: string
  current_interval?: number
  ease_factor?: number
  review_count?: number
  last_review_date?: string | null
  last_review_result?: ReviewResult | null
}

// 用于更新复习项的类型
export interface UpdateReviewQueueItem {
  next_review_date?: string
  current_interval?: number
  ease_factor?: number
  review_count?: number
  last_review_date?: string | null
  last_review_result?: ReviewResult | null
}

// 复习计划类型
export interface ReviewPlan {
  dueToday: number // 今天待复习的单词数量
  newToday: number // 今天新学习的单词数量
  totalReviewed: number // 总共已复习的单词数量
  streakDays: number // 连续复习天数
}

// 复习统计类型
export interface ReviewStats {
  totalReviewed: number // 总共已复习的单词数量
  masteredWords: number // 已掌握的单词数量
  learningWords: number // 正在学习的单词数量
  difficultWords: number // 困难单词数量
  averageInterval: number // 平均间隔天数
  streakDays: number // 连续复习天数
  lastReviewDate: string | null // 上次复习日期
}
