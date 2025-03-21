"use client"

import { useRouter } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const router = useRouter()

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <main className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-8">VocabMaster</h1>
        <p className="text-xl mb-8 text-center max-w-md">欢迎使用VocabMaster，您的个人词汇学习助手</p>
        
        <div className="space-y-4">
          <Button size="lg" className="w-64" onClick={() => router.push("/book_select")}>
            进入词书选择
          </Button>
          <Button variant="outline" size="lg" className="w-64" onClick={() => router.push("/word_list")}>
            直接查看词库
          </Button>
        </div>
      </main>
    </ThemeProvider>
  )
}

