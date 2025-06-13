"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface SpacedReviewButtonProps {
  bookId: string
  count?: number
  isLoading?: boolean
  disabled?: boolean
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function SpacedReviewButton({
  bookId,
  count = 0,
  isLoading = false,
  disabled = false,
  variant = "outline",
  size = "default",
  className,
}: SpacedReviewButtonProps) {
  const router = useRouter()
  const [isButtonLoading, setIsButtonLoading] = useState(isLoading)

  // 当外部isLoading或count属性变化时更新按钮状态
  useEffect(() => {
    // 如果count为0，不再显示加载状态
    if (count === 0) {
      setIsButtonLoading(false)
    } else {
      setIsButtonLoading(isLoading)
    }
  }, [isLoading, count])

  const handleClick = () => {
    router.push(`/spaced-review?bookId=${bookId}`)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1",
        className,
        // 添加橙色边框样式
        "border-amber-500 text-amber-600 hover:bg-amber-50",
        // 禁用状态时的样式
        disabled || count === 0
          ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400 hover:bg-transparent"
          : "",
      )}
      disabled={isButtonLoading || disabled || count === 0}
    >
      <Clock className="h-4 w-4" />
      <span>待复习</span>
      {count > 0 && (
        <Badge variant="secondary" className="ml-1 px-1 min-w-5 text-center bg-amber-100 text-amber-800">
          {count}
        </Badge>
      )}
    </Button>
  )
}
