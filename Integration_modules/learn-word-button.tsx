"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"

interface LearnWordButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  bookId?: string // 可选的词书ID参数，用于传递给学习页面
  buttonText?: string // 可自定义按钮文本
  showIcon?: boolean // 是否显示图标
}

export function LearnWordButton({
  variant = "default",
  size = "default",
  className = "",
  bookId,
  buttonText = "开始学习",
  showIcon = true,
}: LearnWordButtonProps) {
  const router = useRouter()

  // 处理按钮点击，跳转到学习页面
  const handleClick = () => {
    // 如果有词书ID，则作为查询参数传递
    if (bookId) {
      router.push(`/learn_word?bookId=${bookId}`)
    } else {
      router.push("/learn_word")
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${showIcon ? "flex items-center gap-2" : ""}`}
      onClick={handleClick}
    >
      {showIcon && <BookOpen className="h-4 w-4" />}
      {buttonText}
    </Button>
  )
}

