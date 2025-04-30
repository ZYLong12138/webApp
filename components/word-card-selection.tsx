"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Shuffle, SortAsc, BookOpen, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getWordsByLevel, getAllBooks } from "@/services/vocabulary-service"
import type { VocabularyWord } from "@/types/vocabulary"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { useTheme } from "@/contexts/theme-context"

interface WordCardSelectionProps {
  bookId?: string
  level: number
  onComplete: () => void
  onStartLearning: (selectedWords: VocabularyWord[]) => void
}

export function WordCardSelection({ bookId, level, onComplete, onStartLearning }: WordCardSelectionProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { theme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [currentRound, setCurrentRound] = useState(1)
  const [newWords, setNewWords] = useState<VocabularyWord[]>([])
  const [oldWords, setOldWords] = useState<VocabularyWord[]>([])
  const [displayedNewWords, setDisplayedNewWords] = useState<VocabularyWord[]>([])
  const [displayedOldWords, setDisplayedOldWords] = useState<VocabularyWord[]>([])
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())
  const [allLevelWords, setAllLevelWords] = useState<VocabularyWord[]>([])
  const [previousLevelWords, setPreviousLevelWords] = useState<VocabularyWord[]>([])
  const [roundProgress, setRoundProgress] = useState({
    newWordCount: 10,
    oldWordCount: 40,
    totalNewWords: 0,
    totalWords: 50,
  })
  const [animateCards, setAnimateCards] = useState(false)
  const [title, setTitle] = useState("学习单词")
  const [isShuffling, setIsShuffling] = useState(false)
  const [isSorting, setIsSorting] = useState(false)

  // 网格布局参考
  const newWordsGridRef = useRef<HTMLDivElement>(null)
  const oldWordsGridRef = useRef<HTMLDivElement>(null)
  const [gridColumns, setGridColumns] = useState(10)

  // 获取当前关卡和之前关卡的单词
  useEffect(() => {
    const fetchWords = async () => {
      setIsLoading(true)
      try {
        // 获取当前关卡的所有单词
        const currentLevelWords = await getWordsByLevel(bookId || "my-vocabulary", level)
        setAllLevelWords(currentLevelWords)

        // 获取词书名称
        if (bookId) {
          try {
            const books = await getAllBooks()
            const book = books.find((b) => b.id === bookId)
            if (book) {
              setTitle(`${book.book_name} - 第${level}关`)
            }
          } catch (error) {
            console.error("获取词书信息失败:", error)
          }
        }

        // 获取之前关卡的单词（用于混合学习）
        let previousWords: VocabularyWord[] = []
        if (level > 1) {
          // 从之前的关卡中随机获取单词
          for (let i = 1; i < level; i++) {
            const prevLevelWords = await getWordsByLevel(bookId || "my-vocabulary", i)
            previousWords = [...previousWords, ...prevLevelWords]
          }
        }
        setPreviousLevelWords(previousWords)

        // 初始化第一轮学习
        initializeRound(1, currentLevelWords, previousWords)
      } catch (error) {
        console.error("获取单词失败:", error)
        toast({
          title: "加载失败",
          description: "获取单词数据时出现错误",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
        // 延迟触发卡片动画
        setTimeout(() => setAnimateCards(true), 100)
      }
    }

    fetchWords()
  }, [bookId, level, toast])

  // 检测网格列数
  useEffect(() => {
    const updateGridColumns = () => {
      if (newWordsGridRef.current) {
        const computedStyle = window.getComputedStyle(newWordsGridRef.current)
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

  // 初始化学习轮次
  const initializeRound = (round: number, levelWords: VocabularyWord[], prevWords: VocabularyWord[]) => {
    // 根据轮次计算新旧单词数量
    const newWordCount = round * 10
    const oldWordCount = 50 - newWordCount

    // 更新轮次进度
    setRoundProgress({
      newWordCount: Math.min(newWordCount, levelWords.length),
      oldWordCount,
      totalNewWords: Math.min(newWordCount, levelWords.length),
      totalWords: 50,
    })

    // 获取新单词（当前关卡的前N个单词）
    const newWordsForRound = levelWords.slice(0, newWordCount)
    setNewWords(newWordsForRound)
    setDisplayedNewWords([...newWordsForRound])

    // 获取旧单词（从之前关卡随机选择）
    let oldWordsForRound: VocabularyWord[] = []
    if (prevWords.length > 0 && oldWordCount > 0) {
      // 随机打乱之前关卡的单词
      const shuffled = [...prevWords].sort(() => Math.random() - 0.5)
      oldWordsForRound = shuffled.slice(0, oldWordCount)
    }
    setOldWords(oldWordsForRound)
    setDisplayedOldWords([...oldWordsForRound])

    // 重置翻转状态
    setFlippedCards(new Set())

    // 重置动画状态
    setAnimateCards(false)
    setTimeout(() => setAnimateCards(true), 100)
  }

  // 处理卡片翻转
  const handleCardFlip = (wordId: string) => {
    setFlippedCards((prev) => {
      const newFlipped = new Set(prev)
      if (newFlipped.has(wordId)) {
        newFlipped.delete(wordId)
      } else {
        newFlipped.add(wordId)
      }
      return newFlipped
    })
  }

  // 处理开始学习按钮点击
  const handleStartLearning = () => {
    if (flippedCards.size === 0) {
      toast({
        title: "请选择单词",
        description: "请至少翻转一个单词进行学习",
        variant: "destructive",
      })
      return
    }

    // 过滤出翻转的单词
    const selectedNewWords = displayedNewWords.filter((word) => flippedCards.has(word.id.toString()))
    const selectedOldWords = displayedOldWords.filter((word) => flippedCards.has(word.id.toString()))
    const wordsToLearn = [...selectedNewWords, ...selectedOldWords]

    // 传递选中的单词和所有单词
    onStartLearning(wordsToLearn)
  }

  // 处理下一轮按钮点击
  const handleNextRound = () => {
    const nextRound = currentRound + 1

    // 检查是否已完成所有轮次
    if (nextRound > 5 || nextRound * 10 > allLevelWords.length) {
      toast({
        title: "关卡完成",
        description: "您已完成本关卡的所有单词学习",
      })
      return
    }

    setCurrentRound(nextRound)
    initializeRound(nextRound, allLevelWords, previousLevelWords)
  }

  // 处理洗牌 - 分别在新旧单词区域内洗牌
  const handleShuffle = () => {
    if (isShuffling) return

    setIsShuffling(true)
    setAnimateCards(false) // 重置动画状态

    // 分别在各自区域内洗牌
    setDisplayedNewWords((prev) => [...prev].sort(() => Math.random() - 0.5))
    setDisplayedOldWords((prev) => [...prev].sort(() => Math.random() - 0.5))

    // 然后触发波浪动画
    setTimeout(() => {
      setAnimateCards(true)
      setIsShuffling(false)
    }, 100)
  }

  // 处理排序 - 分别在新旧单词区域内排序
  const handleSort = () => {
    if (isSorting) return

    setIsSorting(true)
    setAnimateCards(false) // 重置动画状态

    // 分别在各自区域内排序
    setDisplayedNewWords((prev) => [...prev].sort((a, b) => a.word.localeCompare(b.word)))
    setDisplayedOldWords((prev) => [...prev].sort((a, b) => a.word.localeCompare(b.word)))

    // 然后触发波浪动画
    setTimeout(() => {
      setAnimateCards(true)
      setIsSorting(false)
    }, 100)
  }

  // 计算卡片的波浪动画延迟
  const getCardDelay = (index: number, isNewWord: boolean) => {
    if (!animateCards) return 0

    // 计算卡片在网格中的行和列
    const row = Math.floor(index / gridColumns)
    const col = index % gridColumns

    // 基于对角线距离计算延迟
    const diagonalDistance = row + col
    return 0.03 * diagonalDistance
  }

  // 根据当前主题决定容器类名
  const getContainerClass = () => {
    switch (theme) {
      case "dusk-rose":
        return "min-h-screen gem-gradient-bg p-4"
      case "zephyr-jasmine":
        return "min-h-screen jasmine-gradient-bg p-4"
      default:
        return "min-h-screen bg-gray-50 p-4"
    }
  }

  // 获取导航栏类名
  const getNavClass = () => {
    switch (theme) {
      case "dusk-rose":
        return "flex justify-between items-center mb-6 sticky top-0 z-10 p-3 gem-nav rounded-xl shadow-sm"
      case "zephyr-jasmine":
        return "flex justify-between items-center mb-6 sticky top-0 z-10 p-3 jasmine-nav rounded-xl shadow-sm"
      default:
        return "flex justify-between items-center mb-6 sticky top-0 z-10 p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm"
    }
  }

  return (
    <motion.div className={getContainerClass()} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* 顶部导航和控制按钮 */}
      <div className={getNavClass()}>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 h-8 hover:scale-105 transition-transform text-gray-600"
            onClick={onComplete}
          >
            <ArrowLeft className="h-3 w-3" />
            返回
          </Button>
          <h1 className="text-lg font-bold ml-2 text-gray-800">{title}</h1>
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
            第{currentRound}轮/共5轮
          </span>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>学习进度</span>
          <span>
            {roundProgress.totalNewWords} / {allLevelWords.length} 个单词
          </span>
        </div>
        <Progress value={(roundProgress.totalNewWords / Math.max(1, allLevelWords.length)) * 100} className="h-2" />
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-64 bg-white/50 backdrop-blur-sm rounded-xl p-8 shadow-sm">
          <div className="relative">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          </div>
          <p className="text-gray-600 font-medium">加载词卡中...</p>
        </div>
      ) : (
        <>
          {/* 新单词卡片区域 - 使用浅绿色背景 */}
          {displayedNewWords.length > 0 && (
            <div className="bg-green-50 p-4 rounded-t-lg border-t border-l border-r border-green-200">
              <div ref={newWordsGridRef} className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                <AnimatePresence>
                  {displayedNewWords.map((word, index) => {
                    const isFlipped = flippedCards.has(word.id.toString())
                    // 检查是否是当前轮次新出现的单词
                    const isNewlyAdded = index >= (currentRound - 1) * 10 && index < currentRound * 10

                    return (
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
                          delay: getCardDelay(index, true),
                          ease: "easeOut",
                        }}
                        whileHover={{
                          scale: 1.05,
                          zIndex: 10,
                          transition: { duration: 0.1, ease: "easeOut" },
                        }}
                        whileTap={{ scale: 0.95, transition: { duration: 0.05 } }}
                      >
                        <div
                          className={`flip-card cursor-pointer ${isFlipped ? "flip-card-flipped" : ""}`}
                          onClick={() => handleCardFlip(word.id.toString())}
                        >
                          <div className="flip-card-inner">
                            {/* 卡片正面 */}
                            <div className="flip-card-front bg-white border border-green-200 rounded-md shadow-sm flex items-center justify-center">
                              <div className="font-bold text-lg text-gray-900">{word.word}</div>

                              {/* 只给新出现的单词添加标记 */}
                              {isNewlyAdded && (
                                <div className="absolute top-1 left-1">
                                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                                </div>
                              )}
                            </div>

                            {/* 卡片背面 */}
                            <div className="flip-card-back bg-white border border-green-300 rounded-md shadow-sm flex items-center justify-center p-2">
                              <div className="text-sm text-gray-700 line-clamp-3 overflow-hidden text-center">
                                {word.definition}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* 旧单词卡片区域 - 使用浅红色背景 */}
          {displayedOldWords.length > 0 && (
            <div className="bg-red-50 p-4 rounded-b-lg border-b border-l border-r border-red-200 mb-6">
              <div ref={oldWordsGridRef} className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                <AnimatePresence>
                  {displayedOldWords.map((word, index) => {
                    const isFlipped = flippedCards.has(word.id.toString())

                    return (
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
                          delay: getCardDelay(index, false),
                          ease: "easeOut",
                        }}
                        whileHover={{
                          scale: 1.05,
                          zIndex: 10,
                          transition: { duration: 0.1, ease: "easeOut" },
                        }}
                        whileTap={{ scale: 0.95, transition: { duration: 0.05 } }}
                      >
                        <div
                          className={`flip-card cursor-pointer ${isFlipped ? "flip-card-flipped" : ""}`}
                          onClick={() => handleCardFlip(word.id.toString())}
                        >
                          <div className="flip-card-inner">
                            {/* 卡片正面 */}
                            <div className="flip-card-front bg-white border border-red-200 rounded-md shadow-sm flex items-center justify-center">
                              <div className="font-bold text-lg text-gray-900">{word.word}</div>
                            </div>

                            {/* 卡片背面 */}
                            <div className="flip-card-back bg-white border border-red-300 rounded-md shadow-sm flex items-center justify-center p-2">
                              <div className="text-sm text-gray-700 line-clamp-3 overflow-hidden text-center">
                                {word.definition}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* 底部按钮 */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              variant="default"
              size="lg"
              onClick={handleStartLearning}
              disabled={flippedCards.size === 0}
              className="px-8 bg-blue-600 hover:bg-blue-700"
            >
              开始学习 ({flippedCards.size})
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleNextRound}
              className="flex items-center gap-2"
              disabled={currentRound >= 5 || currentRound * 10 >= allLevelWords.length}
            >
              下一轮
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* 区域指示器 */}
          <div className="flex justify-center gap-8 mb-6 mt-2">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm text-gray-600">新单词 ({displayedNewWords.length})</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-sm text-gray-600">旧单词 ({displayedOldWords.length})</span>
            </div>
          </div>

          {/* 轮次说明 */}
          <Card className="mt-8 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                学习说明
              </h3>
              <p className="text-sm text-gray-600">
                • 点击卡片可以翻转查看单词释义，翻转后的卡片将被标记为选中
                <br />• 每轮学习解锁10个新单词，同时显示之前关卡的单词进行混合学习
                <br />• 上方蓝色背景的卡片为本关卡的新单词，下方灰色背景的为之前关卡的单词
                <br />• 选择您想要学习的单词，然后点击"开始学习"
                <br />• 完成学习后，可以点击"下一轮"解锁更多新单词
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </motion.div>
  )
}
