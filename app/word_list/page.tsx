"use client"

import { useRouter } from "next/navigation"
import { VocabularyDashboard } from "@/components/vocabulary-dashboard"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { QuickAddWordButton } from "@/Integration_modules/quick-add-word-button"
import { LearnWordButton } from "@/Integration_modules/learn-word-button"
import { ReviewCardButton } from "@/Integration_modules/review-card-button"
import { ScrollButtons } from "@/Integration_modules/scroll-buttons"
import { DictationButton } from "@/Integration_modules/dictation-button"
import { VocabularyNav } from "@/components/vocabulary-nav"
import { SpacedReviewButton } from "@/Integration_modules/spaced-review-button"

export default function WordListPage() {
  const router = useRouter()

  return (
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
            <ReviewCardButton variant="outline" buttonText="词卡复习" />
            <DictationButton variant="outline" buttonText="单词默写" />
            <SpacedReviewButton variant="outline" buttonText="间隔复习" />
            <LearnWordButton variant="default" size="default" buttonText="开始学习单词" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-8 text-center">我的单词本</h1>
        <VocabularyNav currentPath="/word_list" />
        <VocabularyDashboard bookId="my-vocabulary" />
        <div className="fixed bottom-6 right-6">
          <QuickAddWordButton
            size="lg"
            className="shadow-lg"
            onWordAdded={() => {
              window.location.reload()
            }}
          />
        </div>
        <ScrollButtons />
      </main>
    </ThemeProvider>
  )
}
