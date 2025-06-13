"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BookOpen, Grid } from "lucide-react"

interface ReviewCardButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  buttonText?: string // 可自定义按钮文本
  showIcon?: boolean // 是否显示图标
  icon?: "grid" | "book" // 可选择使用的图标类型
  bookId?: string // 添加词书ID参数
  level?: number // 添加关卡参数
  disabled?: boolean // 添加禁用状态
  learnedOnly?: boolean // 是否只显示已学习的单词
}

export function ReviewCardButton({
  variant = "default",
  size = "default",
  className = "",
  buttonText = "词卡复习",
  showIcon = true,
  icon = "grid",
  bookId,
  level,
  disabled = false,
  learnedOnly = false,
}: ReviewCardButtonProps) {
  const router = useRouter()

  // 处理按钮点击，跳转到词卡复习页面
  const handleClick = () => {
    if (disabled) return

    let url = "/review_card"
    const params = new URLSearchParams()

    if (bookId) {
      params.append("bookId", bookId)
    }

    if (level) {
      params.append("level", level.toString())
    }

    if (learnedOnly) {
      params.append("learnedOnly", "true")
    }

    const queryString = params.toString()
    if (queryString) {
      url += `?${queryString}`
    }

    router.push(url)
  }

  // 选择要显示的图标
  const IconComponent = icon === "grid" ? Grid : BookOpen

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${showIcon ? "flex items-center gap-2" : ""} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      onClick={handleClick}
      disabled={disabled}
    >
      {showIcon && <IconComponent className="h-4 w-4" />}
      {buttonText}
    </Button>
  )
}
