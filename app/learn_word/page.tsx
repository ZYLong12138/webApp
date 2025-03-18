"use client"

import { useRouter } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { WordLearningCard } from "@/components/word-learning-card"

export default function LearnWordPage() {
  const router = useRouter()

  // 处理学习完成
  const handleComplete = () => {
    router.back()
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* 顶部导航 */}
        <div className="p-4">
          <Button variant="ghost" className="text-white flex items-center gap-2" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            返回词书
          </Button>
        </div>

        {/* 主要内容 */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-2xl mx-auto w-full">
          <WordLearningCard onComplete={handleComplete} maxWordsToLearn={5} />
        </div>
      </div>
    </ThemeProvider>
  )
}

