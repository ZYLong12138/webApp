"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import type { LucideIcon } from "lucide-react"

// Define the props interface for the BookButton component
interface BookButtonProps {
  id: string // Unique identifier for the book
  title: string // Title of the vocabulary book
  wordCount: number // Number of words in the book
  description: string // Short description of the book
  icon?: LucideIcon // Optional icon component
  tagColor?: string // Color of the tag (e.g., "bg-orange-500", "bg-blue-400")
  tagText?: string // Text to display in the tag
  href?: string // Optional custom URL to navigate to (defaults to /book/[id])
  onClick?: () => void // Optional custom click handler
}

export function BookButton({
  id,
  title,
  wordCount,
  description,
  icon: Icon,
  tagColor = "bg-blue-500",
  tagText,
  href,
  onClick,
}: BookButtonProps) {
  const router = useRouter()

  // Handle click event
  const handleClick = () => {
    if (onClick) {
      // Use custom click handler if provided
      onClick()
    } else {
      // Navigate to the book page
      router.push(href || `/book/${id}`)
    }
  }

  return (
    <div
      className="bg-slate-700 rounded-lg p-4 flex justify-between items-center cursor-pointer hover:bg-slate-600 transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="text-slate-300 mt-1">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h3 className="font-medium text-white">{title}</h3>
          <p className="text-sm text-slate-400">词汇量 {wordCount}</p>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      </div>
      <div className={`${tagColor} text-white px-3 py-1 rounded-md whitespace-nowrap`}>{tagText || "词书"}</div>
    </div>
  )
}

// Export a grid container component for displaying multiple book buttons
export function BookButtonGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{children}</div>
}

