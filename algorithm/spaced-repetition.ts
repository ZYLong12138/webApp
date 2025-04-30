import type { ReviewResult } from "@/types/review"

/**
 * 计算下一次复习的间隔和难度因子
 * 基于SM-2间隔重复算法
 *
 * @param result 复习结果 (again, hard, good, easy)
 * @param currentInterval 当前间隔（天）
 * @param easeFactor 当前难度因子
 * @param reviewCount 复习次数
 * @returns 包含新间隔和新难度因子的对象
 */
export function calculateNextReview(
  result: ReviewResult,
  currentInterval: number,
  easeFactor: number,
  reviewCount: number,
): {
  nextInterval: number
  newEaseFactor: number
  reviewCount: number
} {
  // 默认难度因子范围
  const MIN_EASE_FACTOR = 1.3
  const DEFAULT_EASE_FACTOR = 2.5

  // 复习次数增加
  const newReviewCount = reviewCount + 1

  // 根据复习结果调整难度因子和间隔
  let newEaseFactor = easeFactor
  let nextInterval = 0

  switch (result) {
    case "again": // 完全不记得
      // 重置间隔为1天
      nextInterval = 1
      // 降低难度因子
      newEaseFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2)
      break

    case "hard": // 记得但很困难
      // 如果是首次学习或复习间隔很短
      if (currentInterval < 1) {
        nextInterval = 1
      } else {
        // 间隔增加但比正常情况慢
        nextInterval = currentInterval * 1.2
      }
      // 稍微降低难度因子
      newEaseFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.15)
      break

    case "good": // 记得比较好
      // 如果是首次学习
      if (reviewCount === 0) {
        nextInterval = 1
      } else if (reviewCount === 1) {
        nextInterval = 3
      } else {
        // 正常增加间隔
        nextInterval = currentInterval * easeFactor
      }
      break

    case "easy": // 非常容易记住
      // 如果是首次学习
      if (reviewCount === 0) {
        nextInterval = 3
      } else if (reviewCount === 1) {
        nextInterval = 7
      } else {
        // 大幅增加间隔
        nextInterval = currentInterval * easeFactor * 1.3
      }
      // 增加难度因子
      newEaseFactor = easeFactor + 0.15
      break
  }

  // 添加一些随机变化，使复习时间更自然（±5%）
  const randomFactor = 0.95 + Math.random() * 0.1
  nextInterval = nextInterval * randomFactor

  // 确保间隔至少为1天
  nextInterval = Math.max(1, Math.round(nextInterval))

  return {
    nextInterval,
    newEaseFactor,
    reviewCount: newReviewCount,
  }
}

/**
 * 计算下次复习日期
 *
 * @param interval 间隔天数
 * @returns 下次复习的日期（ISO字符串）
 */
export function calculateNextReviewDate(interval: number): string {
  const now = new Date()
  const nextDate = new Date(now)
  nextDate.setDate(now.getDate() + interval)
  return nextDate.toISOString()
}

/**
 * 获取今天应该复习的单词
 *
 * @param reviewItems 所有复习项
 * @returns 今天应该复习的项目
 */
export function getDueItems(reviewItems: any[]): any[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return reviewItems.filter((item) => {
    const reviewDate = new Date(item.next_review_date)
    reviewDate.setHours(0, 0, 0, 0)
    return reviewDate <= today
  })
}

/**
 * 根据复习结果的颜色代码
 *
 * @param interval 间隔天数
 * @returns 对应的颜色类名
 */
export function getIntervalColorClass(interval: number): string {
  if (interval <= 1) return "bg-red-100 border-red-300" // 需要频繁复习
  if (interval <= 3) return "bg-orange-100 border-orange-300" // 短期记忆
  if (interval <= 7) return "bg-yellow-100 border-yellow-300" // 开始巩固
  if (interval <= 14) return "bg-blue-100 border-blue-300" // 中期记忆
  if (interval <= 30) return "bg-green-100 border-green-300" // 长期记忆
  return "bg-purple-100 border-purple-300" // 已掌握
}
