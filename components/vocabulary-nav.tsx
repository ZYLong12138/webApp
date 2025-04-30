"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BookMarked, Home } from "lucide-react"

interface VocabularyNavProps {
  currentPath?: string
}

export function VocabularyNav({ currentPath = "" }: VocabularyNavProps) {
  const router = useRouter()

  return (
    <div className="flex justify-center gap-2 mb-6">
      <Button
        variant={currentPath === "/word_list" ? "default" : "outline"}
        className="flex items-center gap-2"
        onClick={() => router.push("/word_list")}
      >
        <Home className="h-4 w-4" />
        词库
      </Button>
      <Button
        variant={currentPath === "/personal-vocabulary" ? "default" : "outline"}
        className="flex items-center gap-2"
        onClick={() => router.push("/personal-vocabulary")}
      >
        <BookMarked className="h-4 w-4" />
        生词本
      </Button>
    </div>
  )
}
