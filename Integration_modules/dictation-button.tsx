"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"

interface DictationButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  buttonText?: string
  showIcon?: boolean
  bookId?: string
}

export function DictationButton({
  variant = "outline",
  size = "default",
  className = "",
  buttonText = "单词默写",
  showIcon = true,
  bookId,
}: DictationButtonProps) {
  const router = useRouter()

  // 处理按钮点击，跳转到默写页面
  const handleClick = () => {
    // 如果有词书ID，则作为查询参数传递
    if (bookId) {
      router.push(`/dictation?bookId=${bookId}`)
    } else {
      router.push("/dictation")
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${showIcon ? "flex items-center gap-2" : ""}`}
      onClick={handleClick}
    >
      {showIcon && <Edit className="h-4 w-4" />}
      {buttonText}
    </Button>
  )
}

