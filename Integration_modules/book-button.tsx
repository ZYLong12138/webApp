"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { Book } from 'lucide-react'

// 定义 BookButton 组件的 props 接口
interface BookButtonProps {
  id: string // 词书的唯一标识符
  title: string // 词书标题
  wordCount: number // 词书中的单词数量
  description: string // 词书简短描述
  icon?: LucideIcon // 可选的图标组件
  tagColor?: string // 标签颜色（例如 "bg-orange-500", "bg-blue-400"）
  tagText?: string // 标签中显示的文本
  href?: string // 可选的自定义 URL（默认为 /book/[id]）
  onClick?: () => void // 可选的自定义点击处理函数
  asTitle?: boolean // 是否作为标题显示（新增）
  className?: string // 自定义类名（新增）
}

export function BookButton({
  id,
  title,
  wordCount,
  description,
  icon: Icon = Book, // 默认使用 Book 图标
  tagColor = "bg-blue-500",
  tagText = "词书",
  href,
  onClick,
  asTitle = false, // 默认不作为标题
  className = "",
}: BookButtonProps) {
  const router = useRouter()

  // 处理点击事件
  const handleClick = () => {
    if (onClick) {
      // 如果提供了自定义点击处理函数，则使用它
      onClick()
    } else {
      // 导航到词书页面
      router.push(href || `/book/${id}`)
    }
  }

  // 如果作为标题显示，使用h3标签样式但保持可点击
  if (asTitle) {
    return (
      <h3 
        className={`text-lg font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors ${className}`}
        onClick={handleClick}
      >
        {title}
      </h3>
    )
  }

  // 否则使用原来的卡片样式
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors shadow-sm ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="text-blue-600 mt-1">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h3 className="font-medium text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500">词汇量 {wordCount}</p>
          <p className="text-sm text-gray-500 line-clamp-2">{description}</p>
        </div>
      </div>
      <div className={`${tagColor} text-white px-3 py-1 rounded-md whitespace-nowrap`}>{tagText}</div>
    </div>
  )
}

// 导出一个网格容器组件，用于显示多个词书按钮
export function BookButtonGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
}
