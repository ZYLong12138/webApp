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
}

export function ReviewCardButton({
  variant = "default",
  size = "default",
  className = "",
  buttonText = "词卡复习",
  showIcon = true,
  icon = "grid",
}: ReviewCardButtonProps) {
  const router = useRouter()

  // 处理按钮点击，跳转到词卡复习页面
  const handleClick = () => {
    router.push("/review_card")
  }

  // 选择要显示的图标
  const IconComponent = icon === "grid" ? Grid : BookOpen

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${showIcon ? "flex items-center gap-2" : ""}`}
      onClick={handleClick}
    >
      {showIcon && <IconComponent className="h-4 w-4" />}
      {buttonText}
    </Button>
  )
}

