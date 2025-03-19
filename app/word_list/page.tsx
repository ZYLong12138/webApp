// Add "use client" directive at the top
"use client"

// Import useRouter from next/navigation
import { useRouter } from "next/navigation"
// 引入 VocabularyDashboard 组件，用于显示词汇学习仪表盘
import { VocabularyDashboard } from "@/components/vocabulary-dashboard"

// 引入 ThemeProvider 组件，用于为应用提供主题切换功能
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

// Import the QuickAddWordButton component
import { QuickAddWordButton } from "@/Integration_modules/quick-add-word-button"
// Import the LearnWordButton component
import { LearnWordButton } from "@/Integration_modules/learn-word-button"
// Add this new import for ReviewCardButton
import { ReviewCardButton } from "@/Integration_modules/review-card-button"

export default function WordListPage() {
  // Initialize the router
  const router = useRouter()

  return (
    // ThemeProvider 组件包装整个应用，提供主题切换功能
    // - attribute="class"：主题会通过修改 class 名称来切换（通常是 <html> 或 <body> 标签的 class）
    // - defaultTheme="system"：默认主题设置为系统主题（可以自动切换到深色或浅色模式）
    // - enableSystem：启用根据系统设置的主题自动切换（例如 Windows 或 macOS 的暗黑模式）
    // - disableTransitionOnChange：禁用主题切换时的过渡动画
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <main className="min-h-screen bg-background">
        {/* Add back button and action buttons in a flex container */}
        <div className="container mx-auto pt-4 px-4 flex justify-between items-center">
          <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.push("/book_select")}>
            <ArrowLeft className="h-4 w-4" />
            返回词书选择
          </Button>

          {/* Add buttons in a flex container */}
          <div className="flex gap-2">
            {/* Add the ReviewCardButton here */}
            <ReviewCardButton variant="outline" buttonText="词卡复习" />

            {/* Existing LearnWordButton */}
            <LearnWordButton variant="default" size="default" buttonText="开始学习单词" />
          </div>
        </div>
        {/* VocabularyDashboard 组件，用于显示和管理词汇学习内容 */}
        <VocabularyDashboard />
        {/* Fixed position Quick Add Word button */}
        <div className="fixed bottom-6 right-6">
          <QuickAddWordButton
            size="lg"
            className="shadow-lg"
            onWordAdded={() => {
              // Refresh the page to show the newly added word
              window.location.reload()
            }}
          />
        </div>
      </main>
    </ThemeProvider>
  )
}

