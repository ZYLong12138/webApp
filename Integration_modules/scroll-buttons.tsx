"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown } from "lucide-react"

export function ScrollButtons() {
  const [isVisible, setIsVisible] = useState(false)

  // 监听滚动事件，决定是否显示滚动按钮
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", toggleVisibility)
    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [])

  // 滚动到顶部
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  // 滚动到底部
  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    })
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full bg-white shadow-md hover:bg-gray-100"
        onClick={scrollToTop}
        aria-label="滚动到顶部"
      >
        <ChevronUp className="h-5 w-5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full bg-white shadow-md hover:bg-gray-100"
        onClick={scrollToBottom}
        aria-label="滚动到底部"
      >
        <ChevronDown className="h-5 w-5" />
      </Button>
    </div>
  )
}

