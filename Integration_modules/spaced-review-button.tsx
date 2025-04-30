"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { getReviewPlan } from "@/services/review-service"
import { Badge } from "@/components/ui/badge"

interface SpacedReviewButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  buttonText?: string // 可自定义按钮文本
  showIcon?: boolean // 是否显示图标
  showCount?: boolean // 是否显示待复习数量
}

export function SpacedReviewButton({
  variant = "outline",
  size = "default",
  className = "",
  buttonText = "间隔复习",
  showIcon = true,
  showCount = true,
}: SpacedReviewButtonProps) {
  const router = useRouter()
  const [dueCount, setDueCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 获取待复习单词数量
  useEffect(() => {
    const fetchReviewPlan = async () => {
      try {
        const plan = await getReviewPlan()
        setDueCount(plan.dueToday)
      } catch (error) {
        console.error("获取复习计划失败:", error)
      }
    }

    fetchReviewPlan()
  }, [])

  // 处理按钮点击，跳转到间隔复习页面
  const handleClick = () => {
    setIsLoading(true)
    router.push("/spaced-review")
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${showIcon ? "flex items-center gap-2" : ""}`}
      onClick={handleClick}
      disabled={isLoading}
    >
      {showIcon && <Clock className="h-4 w-4" />}
      {buttonText}
      {showCount && dueCount !== null && dueCount > 0 && (
        <Badge variant="secondary" className="ml-1 bg-red-100 text-red-800 hover:bg-red-200">
          {dueCount}
        </Badge>
      )}
    </Button>
  )
}
