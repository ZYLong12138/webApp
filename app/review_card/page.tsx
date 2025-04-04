"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ThemeProvider as ShadcnThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Shuffle, SortAsc, Loader2 } from "lucide-react"
import { getVocabularyWords } from "@/services/vocabulary-service"
import type { VocabularyWord } from "@/types/vocabulary"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeSwitcherButton } from "@/Integration_modules/theme-switcher-button"
import { useTheme } from "@/contexts/theme-context"

export default function ReviewCardPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [words, setWords] = useState<VocabularyWord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState("我的词库")
  const [isShuffling, setIsShuffling] = useState(false)
  const [isSorting, setIsSorting] = useState(false)
  const [animateCards, setAnimateCards] = useState(false)

  // 网格布局参考
  const gridRef = useRef<HTMLDivElement>(null)
  const [gridColumns, setGridColumns] = useState(10)

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
        // 初始加载时触发波浪动画
        setTimeout(() => setAnimateCards(true), 100)
      } catch (err) {
        console.error("获取单词失败:", err)
        setError("加载单词列表时出现错误")
      } finally {
        setIsLoading(false)
      }
    }

    fetchWords()
  }, [])

  // 检测网格列数
  useEffect(() => {
    const updateGridColumns = () => {
      if (gridRef.current) {
        const computedStyle = window.getComputedStyle(gridRef.current)
        const columnsMatch = computedStyle.gridTemplateColumns.match(/repeat\((\d+)/i)
        if (columnsMatch && columnsMatch[1]) {
          setGridColumns(Number.parseInt(columnsMatch[1], 10))
        }
      }
    }

    updateGridColumns()
    window.addEventListener("resize", updateGridColumns)
    return () => window.removeEventListener("resize", updateGridColumns)
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

  // 标准洗牌算法 (Fisher-Yates)
  const shuffleArray = (array: VocabularyWord[]) => {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

  // 处理洗牌
  const handleShuffle = () => {
    if (isShuffling) return

    setIsShuffling(true)
    setAnimateCards(false) // 重置动画状态

    // 先执行洗牌
    setWords((prev) => shuffleArray(prev))
    setFlippedCards(new Set()) // 重置翻转状态

    // 然后触发波浪动画
    setTimeout(() => {
      setAnimateCards(true)
      setIsShuffling(false)
    }, 100)
  }

  // 处理排序
  const handleSort = () => {
    if (isSorting) return

    setIsSorting(true)
    setAnimateCards(false) // 重置动画状态

    // 先执行排序
    setWords((prev) => [...prev].sort((a, b) => a.word.localeCompare(b.word)))
    setFlippedCards(new Set()) // 重置翻转状态

    // 然后触发波浪动画
    setTimeout(() => {
      setAnimateCards(true)
      setIsSorting(false)
    }, 100)
  }

  // 处理页面导航
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setAnimateCards(false)
      setCurrentPage((prev) => prev + 1)
      setFlippedCards(new Set()) // 重置翻转状态
      window.scrollTo({ top: 0, behavior: "smooth" })

      // 在页面切换后触发波浪动画
      setTimeout(() => setAnimateCards(true), 100)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setAnimateCards(false)
      setCurrentPage((prev) => prev - 1)
      setFlippedCards(new Set()) // 重置翻转状态
      window.scrollTo({ top: 0, behavior: "smooth" })

      // 在页面切换后触发波浪动画
      setTimeout(() => setAnimateCards(true), 100)
    }
  }

  // 页面变体
  const pageVariants = {
    initial: { opacity: 0 },
    enter: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  }

  // 计算卡片的波浪动画延迟
  const getCardDelay = (index: number) => {
    if (!animateCards) return 0

    // 计算卡片在网格中的行和列
    const row = Math.floor(index / gridColumns)
    const col = index % gridColumns

    // 基于对角线距离计算延迟
    // 对角线距离 = 行 + 列
    const diagonalDistance = row + col

    // 基础延迟 + 对角线距离 * 延迟增量
    return 0.05 * diagonalDistance
  }

  // 根据当前主题决定容器类名
  const getContainerClass = () => {
    switch (theme) {
      case "dusk-rose":
        return "min-h-screen gem-gradient-bg p-4"
      case "zephyr-jasmine":
        return "min-h-screen jasmine-gradient-bg p-4"
      default:
        return "min-h-screen p-4 themed-bg"
    }
  }

  // 卡片类名
  const getCardClass = (isFlipped: boolean) => {
    const baseClass = `
    flip-card cursor-pointer rounded-md shadow-sm 
    transition-all duration-300 transform
    ${isFlipped ? "flip-card-flipped" : ""}
    hover:shadow-md
  `

    if (theme === "dusk-rose") {
      return `${baseClass} shimmer`
    } else if (theme === "zephyr-jasmine") {
      return `${baseClass} shimmer`
    } else {
      return `${baseClass} ${isFlipped ? "bg-blue-50" : ""}`
    }
  }

  // 卡片正面类名
  const getFrontCardClass = () => {
    switch (theme) {
      case "dusk-rose":
        return "flip-card-front gem-card-front flex items-center justify-center p-1 text-center"
      case "zephyr-jasmine":
        return "flip-card-front jasmine-card-front flex items-center justify-center p-1 text-center"
      default:
        return "flip-card-front themed-card flex items-center justify-center p-1 text-center"
    }
  }

  // 卡片背面类名
  const getBackCardClass = () => {
    switch (theme) {
      case "dusk-rose":
        return "flip-card-back gem-card-back flex items-center justify-center p-1 text-center"
      case "zephyr-jasmine":
        return "flip-card-back jasmine-card-back flex items-center justify-center p-1 text-center"
      default:
        return "flip-card-back themed-card flex items-center justify-center p-1 text-center"
    }
  }

  // 导航栏类名
  const getNavClass = () => {
    switch (theme) {
      case "dusk-rose":
        return "flex justify-between items-center mb-6 sticky top-0 z-10 p-3 gem-nav rounded-xl shadow-sm"
      case "zephyr-jasmine":
        return "flex justify-between items-center mb-6 sticky top-0 z-10 p-3 jasmine-nav rounded-xl shadow-sm"
      default:
        return "flex justify-between items-center mb-6 sticky top-0 z-10 p-3 themed-nav rounded-xl shadow-sm"
    }
  }

  // 获取主题颜色
  const getThemeColors = () => {
    switch (theme) {
      case "zephyr-jasmine":
        return {
          primary: "rgba(75, 195, 178, 0.6)", // 淡青绿色
          secondary: "rgba(174, 220, 170, 0.4)", // 淡薄荷绿
          accent: "rgba(27, 167, 208, 0.5)", // 淡蓝色
        }
      case "dusk-rose":
        return {
          primary: "#a0b4ff",
          secondary: "#f39872",
          accent: "#e5beef",
        }
      default:
        return {
          primary: "#3b82f6",
          secondary: "#dbeafe",
          accent: "#e5e7eb",
        }
    }
  }

  return (
    <ShadcnThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <motion.div className={getContainerClass()} initial="initial" animate="enter" exit="exit" variants={pageVariants}>
        {/* 顶部导航和控制按钮 */}
        <div className={getNavClass()}>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 h-8 hover:scale-105 transition-transform text-gray-600"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-3 w-3" />
              返回
            </Button>
            <h1 className="text-lg font-bold ml-2 themed-text-primary">{title}</h1>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShuffle}
              className={`flex items-center gap-1 h-8 text-xs transition-all ${isShuffling ? "bg-accent/20" : ""}`}
              disabled={isShuffling}
            >
              <Shuffle className={`h-3 w-3 ${isShuffling ? "animate-spin" : ""}`} />
              洗牌
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSort}
              className={`flex items-center gap-1 h-8 text-xs transition-all ${isSorting ? "bg-accent/20" : ""}`}
              disabled={isSorting}
            >
              <SortAsc className={`h-3 w-3 ${isSorting ? "animate-bounce" : ""}`} />
              排序
            </Button>
            <span className="px-3 py-1 bg-accent/10 text-gray-600 rounded-md text-xs font-medium border border-accent/20 shadow-sm">
              {currentPage}/{totalPages || 1}
            </span>
            <ThemeSwitcherButton size="sm" variant="ghost" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 bg-white/50 backdrop-blur-sm rounded-xl p-8 shadow-sm">
            <div className="relative">
              <Loader2 className="h-12 w-12 text-accent animate-spin mb-4" />
              <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/20 to-accent/0 animate-pulse"></div>
            </div>
            <p className="text-gray-600 font-medium">加载词卡中...</p>
          </div>
        ) : error ? (
          <motion.div
            className="bg-red-50/80 backdrop-blur-sm text-red-600 p-6 rounded-xl shadow-sm"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="font-medium">{error}</p>
          </motion.div>
        ) : words.length === 0 ? (
          <motion.div
            className="bg-accent/10 backdrop-blur-sm text-gray-600 p-6 rounded-xl shadow-sm"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="font-medium">词库中没有单词，请先添加一些单词。</p>
          </motion.div>
        ) : (
          <>
            {/* 单词卡片网格 */}
            <div ref={gridRef} className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-6">
              <AnimatePresence>
                {currentWords.map((word, index) => (
                  <motion.div
                    key={word.id}
                    className="perspective"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={
                      animateCards
                        ? {
                            scale: 1,
                            opacity: 1,
                          }
                        : { scale: 0.6, opacity: 0 }
                    }
                    transition={{
                      duration: 0.4,
                      delay: getCardDelay(index),
                      ease: "easeOut",
                    }}
                    whileHover={{
                      scale: 1.05,
                      zIndex: 10,
                      transition: { duration: 0.1, ease: "easeOut" }, // 更快的悬停动画
                    }}
                    onHoverEnd={() => {
                      // 移除后摇效果，直接回到原始状态
                    }}
                    whileTap={{ scale: 0.95, transition: { duration: 0.05 } }} // 更快的点击动画
                  >
                    <div className={getCardClass(flippedCards.has(word.id))} onClick={() => handleCardFlip(word.id)}>
                      <div className="flip-card-inner">
                        <div className={getFrontCardClass()}>
                          <div className="font-bold text-lg text-gray-900">{word.word}</div>
                        </div>
                        <div className={getBackCardClass()}>
                          <div className="text-xs text-gray-900 font-medium line-clamp-3 overflow-hidden">
                            {word.definition}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* 分页控制 */}
            <div className="flex justify-center gap-3 mt-6 pb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="flex items-center h-9 bg-white/70 backdrop-blur-sm hover:bg-accent/10 transition-colors text-gray-600"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center h-9 bg-white/70 backdrop-blur-sm hover:bg-accent/10 transition-colors text-gray-600"
              >
                下一页
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </ShadcnThemeProvider>
  )
}

