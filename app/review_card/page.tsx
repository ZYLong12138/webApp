"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Shuffle, SortAsc } from "lucide-react"
import { getVocabularyWords } from "@/services/vocabulary-service"
import type { VocabularyWord } from "@/types/vocabulary"

export default function ReviewCardPage() {
  const router = useRouter()
  const [words, setWords] = useState<VocabularyWord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState("我的词库")

  // 每页显示的卡片数量
  const cardsPerPage = 50 // 10 x 5 grid

  // 计算总页数
  const totalPages = Math.ceil(words.length / cardsPerPage)

  // 获取当前页的单词
  const currentWords = words.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage)

  // 获取单词数据
  useEffect(() => {
    const fetchWords = async () => {
      setIsLoading(true)
      try {
        const data = await getVocabularyWords()
        setWords(data)
        setError(null)
      } catch (err) {
        console.error("获取单词失败:", err)
        setError("加载单词列表时出现错误")
      } finally {
        setIsLoading(false)
      }
    }

    fetchWords()
  }, [])

  // 处理卡片翻转
  const handleCardFlip = (id: string) => {
    setFlippedCards((prev) => {
      const newFlipped = new Set(prev)
      if (newFlipped.has(id)) {
        newFlipped.delete(id)
      } else {
        newFlipped.add(id)
      }
      return newFlipped
    })
  }

  // 处理洗牌
  const handleShuffle = () => {
    setWords((prev) => [...prev].sort(() => Math.random() - 0.5))
    setFlippedCards(new Set()) // 重置翻转状态
  }

  // 处理排序
  const handleSort = () => {
    setWords((prev) => [...prev].sort((a, b) => a.word.localeCompare(b.word)))
    setFlippedCards(new Set()) // 重置翻转状态
  }

  // 处理页面导航
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1)
      setFlippedCards(new Set()) // 重置翻转状态
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
      setFlippedCards(new Set()) // 重置翻转状态
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="min-h-screen bg-gray-50 p-2">
        {/* 顶部导航和控制按钮 */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" className="flex items-center gap-1 h-8" onClick={() => router.back()}>
              <ArrowLeft className="h-3 w-3" />
              返回
            </Button>
            <h1 className="text-lg font-bold ml-2">{title}</h1>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={handleShuffle} className="flex items-center gap-1 h-8 text-xs">
              <Shuffle className="h-3 w-3" />
              随机
            </Button>
            <Button variant="outline" size="sm" onClick={handleSort} className="flex items-center gap-1 h-8 text-xs">
              <SortAsc className="h-3 w-3" />
              排序
            </Button>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
              {currentPage}/{totalPages || 1}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>加载中...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-800 p-4 rounded-md">
            <p>{error}</p>
          </div>
        ) : words.length === 0 ? (
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded-md">
            <p>词库中没有单词，请先添加一些单词。</p>
          </div>
        ) : (
          <>
            {/* 单词卡片网格 */}
            <div className="grid grid-cols-10 gap-1 mb-4">
              {currentWords.map((word) => (
                <div
                  key={word.id}
                  className={`
                    aspect-[1/1] cursor-pointer rounded-sm shadow-sm 
                    transition-all duration-300 transform 
                    ${flippedCards.has(word.id) ? "bg-blue-100" : "bg-white hover:bg-gray-100"}
                    flex items-center justify-center p-1 text-center
                    border border-gray-200 text-xs
                  `}
                  onClick={() => handleCardFlip(word.id)}
                >
                  {flippedCards.has(word.id) ? (
                    <div className="text-xs text-gray-700 line-clamp-3 overflow-hidden">{word.definition}</div>
                  ) : (
                    <div className="font-bold text-lg">{word.word}</div>
                  )}
                </div>
              ))}
            </div>

            {/* 分页控制 */}
            <div className="flex justify-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="flex items-center h-8"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center h-8"
              >
                下一页
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </>
        )}
      </div>
    </ThemeProvider>
  )
}

