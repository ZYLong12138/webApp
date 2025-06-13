"use client"

import { useState, useEffect, useCallback } from "react"
import { Trash2, BookOpen, Library } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { VocabularyWord } from "@/types/vocabulary"
import {
  deleteVocabularyWord,
  getBookWordCount,
  getVocabularyWords,
  getWordsByLevel,
} from "@/services/vocabulary-service"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

// 添加导入语句
import { AddToVocabularyButton } from "@/components/add-to-vocabulary-button"
import { getBatchUserVocabularyStatus } from "@/services/personal-vocabulary-service"
import { VocabularyVisibilityControls } from "@/components/vocabulary-visibility-controls"

// 定义缓存数据的接口
interface CachedVocabularyData {
  words: VocabularyWord[]
  timestamp: number
  totalCount: number
}

// 缓存过期时间（24小时）
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000

// 缓存键前缀
const CACHE_PREFIX = "vocabulary-cache-v2-"

// 最后访问的缓存键
const LAST_VISITED_KEY = "vocabulary-last-visited"

// 定义传入 props 的类型
interface VocabularyListProps {
  words?: VocabularyWord[] // 可选的单词数据，如果不提供则通过API获取
  onWordDeleted: () => void // 删除单词后的回调函数
  bookId?: string // 可选的词书ID，默认为"my-vocabulary"
  level?: number // 当前关卡
  starButtonStyle?: "default" | "simple" // 生词本按钮样式
}

// 主组件函数
export function VocabularyList({
  words: initialWords,
  onWordDeleted,
  bookId = "my-vocabulary",
  level = 1,
  starButtonStyle = "default",
}: VocabularyListProps) {
  const { toast } = useToast() // 获取提示框功能
  const [deletingId, setDeletingId] = useState<string | null>(null) // 追踪当前正在删除的单词的 id
  const [currentPage, setCurrentPage] = useState(1) // 当前页码
  const [totalWordCount, setTotalWordCount] = useState(0) // 总单词数量
  const [isLoading, setIsLoading] = useState(true) // 加载状态
  const [words, setWords] = useState<VocabularyWord[]>([]) // 当前页的单词
  const [showAllWords, setShowAllWords] = useState(false) // 是否显示所有单词
  const wordsPerPage = 200 // 每页显示的单词数量
  const [wordHighlights, setWordHighlights] = useState<Record<string | number, number>>(() => {
    // Try to load highlights from localStorage
    if (typeof window !== "undefined") {
      const savedHighlights = localStorage.getItem(`wordHighlights-${bookId}-${level}`)
      return savedHighlights ? JSON.parse(savedHighlights) : {}
    }
    return {}
  })

  const [favoriteStatus, setFavoriteStatus] = useState<Record<string | number, boolean>>({})
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(true)

  // 使用 CSS 类名而不是条件渲染来提高响应速度
  const [visibilityClasses, setVisibilityClasses] = useState({
    word: "",
    pronunciation: "",
    definition: "",
  })

  // 获取缓存键
  const getCacheKey = useCallback(
    (isLevelSpecific = false) => {
      return isLevelSpecific ? `${CACHE_PREFIX}${bookId}-level-${level}` : `${CACHE_PREFIX}${bookId}-all`
    },
    [bookId, level],
  )

  // 从缓存中获取数据
  const getDataFromCache = useCallback(
    (isLevelSpecific = false) => {
      if (typeof window === "undefined") return null

      const cacheKey = getCacheKey(isLevelSpecific)
      const cachedData = localStorage.getItem(cacheKey)

      if (!cachedData) return null

      try {
        const parsedData: CachedVocabularyData = JSON.parse(cachedData)
        const now = Date.now()

        // 检查缓存是否过期
        if (now - parsedData.timestamp > CACHE_EXPIRY_TIME) {
          localStorage.removeItem(cacheKey)
          return null
        }

        return parsedData
      } catch (error) {
        console.error("解析缓存数据失败:", error)
        localStorage.removeItem(cacheKey)
        return null
      }
    },
    [getCacheKey],
  )

  // 将数据保存到缓存
  const saveDataToCache = useCallback(
    (data: VocabularyWord[], count: number, isLevelSpecific = false) => {
      if (typeof window === "undefined" || data.length === 0) return

      const cacheData: CachedVocabularyData = {
        words: data,
        timestamp: Date.now(),
        totalCount: count,
      }

      try {
        const cacheKey = getCacheKey(isLevelSpecific)
        localStorage.setItem(cacheKey, JSON.stringify(cacheData))
        console.log(`缓存已更新: ${cacheKey}`)
      } catch (error) {
        // 如果存储失败（可能是因为超出存储限制），尝试清除旧缓存
        console.error("缓存存储失败，尝试清除旧缓存:", error)
        clearOldCaches()
        // 再次尝试存储
        try {
          localStorage.setItem(getCacheKey(isLevelSpecific), JSON.stringify(cacheData))
        } catch (e) {
          console.error("再次尝试缓存失败:", e)
        }
      }
    },
    [getCacheKey],
  )

  // 清除旧缓存
  const clearOldCaches = useCallback(() => {
    if (typeof window === "undefined") return

    const now = Date.now()
    const keysToRemove: string[] = []

    // 查找所有以缓存前缀开头的项
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "")
          // 如果缓存超过12小时，或者不是当前正在查看的内容，则删除
          if (now - data.timestamp > 12 * 60 * 60 * 1000 || (key !== getCacheKey(true) && key !== getCacheKey(false))) {
            keysToRemove.push(key)
          }
        } catch (e) {
          // 如果解析失败，也删除
          keysToRemove.push(key)
        }
      }
    }

    // 删除收集到的键
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key)
      console.log(`已清除旧缓存: ${key}`)
    })
  }, [getCacheKey])

  // 检查是否有最后访问的页面
  useEffect(() => {
    if (typeof window === "undefined" || initialWords) return

    const lastVisited = localStorage.getItem(LAST_VISITED_KEY)
    if (!lastVisited) return

    try {
      const lastVisitedData = JSON.parse(lastVisited)
      // 如果最后访问的是同一本书和同一关卡，自动恢复状态
      if (lastVisitedData.bookId === bookId && lastVisitedData.level === level) {
        // 只有在30分钟内的访问才自动恢复
        const thirtyMinutes = 30 * 60 * 1000
        if (Date.now() - lastVisitedData.timestamp < thirtyMinutes) {
          setShowAllWords(lastVisitedData.showAllWords)
          setCurrentPage(lastVisitedData.currentPage)
          console.log("恢复上次访问状态")
        }
      }
    } catch (error) {
      console.error("解析最后访问数据失败:", error)
    }
  }, [bookId, level, initialWords])

  // 获取总单词数量和当前页的单词
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      // 记录最后访问的页面信息
      if (typeof window !== "undefined") {
        localStorage.setItem(
          LAST_VISITED_KEY,
          JSON.stringify({
            bookId,
            level,
            showAllWords,
            currentPage,
            timestamp: Date.now(),
          }),
        )
      }

      try {
        // 如果提供了初始单词数据，直接使用它
        if (initialWords) {
          setWords(initialWords)
          setTotalWordCount(initialWords.length)
          setIsLoading(false)
          return
        }

        let wordData: VocabularyWord[] = []
        let count = 0

        // 尝试从缓存获取数据
        const isLevelSpecific = !showAllWords && level !== undefined
        const cachedData = getDataFromCache(isLevelSpecific)

        if (cachedData) {
          // 使用缓存数据
          wordData = cachedData.words
          count = cachedData.totalCount
          console.log("使用缓存的词表数据")
        } else {
          // 从服务器获取数据
          count = await getBookWordCount(bookId)

          if (showAllWords) {
            // 显示所有单词
            wordData = await getVocabularyWords(bookId)
            saveDataToCache(wordData, count, false)
          } else if (level) {
            // 显示当前关卡的单词
            wordData = await getWordsByLevel(bookId, level)
            saveDataToCache(wordData, count, true)
          } else {
            // 如果没有指定关卡，则按页获取
            wordData = await getVocabularyWords(bookId, currentPage, wordsPerPage)
            // 不缓存分页数据，因为可能会频繁变化
          }
          console.log("从服务器获取词表数据")
        }

        setWords(wordData)
        setTotalWordCount(count)
      } catch (error) {
        console.error("获取单词数据失败:", error)
        toast({
          title: "加载失败",
          description: "获取单词数据时出现错误",
          variant: "destructive",
        })
        // 如果获取失败，设置为空数组
        setWords([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [bookId, currentPage, initialWords, toast, level, showAllWords, getDataFromCache, saveDataToCache])

  // Save highlights to localStorage when they change
  useEffect(() => {
    if (Object.keys(wordHighlights).length > 0) {
      localStorage.setItem(`wordHighlights-${bookId}-${level}`, JSON.stringify(wordHighlights))
    }
  }, [wordHighlights, bookId, level])

  // 批量获取收藏状态
  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (!words.length) return

      setIsFavoritesLoading(true)
      try {
        // 从 personal-vocabulary-service.ts 导入这个新函数
        const wordIds = words.map((word) => word.id)
        const statuses = await getBatchUserVocabularyStatus(wordIds)
        setFavoriteStatus(statuses)
      } catch (error) {
        console.error("获取收藏状态失败:", error)
      } finally {
        setIsFavoritesLoading(false)
      }
    }

    fetchFavoriteStatus()
  }, [words])

  // 计算总页数
  const totalPages = Math.ceil(totalWordCount / wordsPerPage)

  // 处理删除单词的函数
  const handleDelete = async (id: string) => {
    setDeletingId(id) // 设置正在删除的单词 id
    try {
      // 调用删除单词的 API
      await deleteVocabularyWord(id)
      // 成功后显示成功的提示
      toast({
        title: "单词已删除",
        description: "单词已从你的词库中删除",
      })
      // 更新总单词数量
      setTotalWordCount((prev) => Math.max(0, prev - 1))
      // 从当前页面移除该单词
      setWords((prev) => prev.filter((word) => word.id !== id))
      // 如果当前页已经没有单词且不是第一页，则返回上一页
      if (words.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1)
      }

      // 删除后更新缓存
      const isLevelSpecific = !showAllWords && level !== undefined
      const cacheKey = getCacheKey(isLevelSpecific)
      const cachedData = localStorage.getItem(cacheKey)

      if (cachedData) {
        try {
          const parsedData: CachedVocabularyData = JSON.parse(cachedData)
          const updatedWords = parsedData.words.filter((word) => word.id !== id)
          saveDataToCache(updatedWords, parsedData.totalCount - 1, isLevelSpecific)
        } catch (error) {
          console.error("更新缓存失败:", error)
        }
      }

      onWordDeleted() // 调用父组件的删除回调
    } catch (error) {
      // 删除失败时显示错误提示
      toast({
        title: "删除失败",
        description: "删除单词时出现错误，请重试",
        variant: "destructive", // 错误类型提示
      })
    } finally {
      setDeletingId(null) // 无论成功与否，重置正在删除的 id
    }
  }

  // 处理页码变化
  const handlePageChange = async (page: number) => {
    setCurrentPage(page)
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: "smooth" })

    // 加载新页面的数据
    setIsLoading(true)
    try {
      const pageWords = await getVocabularyWords(bookId, page, wordsPerPage)
      setWords(pageWords)
    } catch (error) {
      console.error("获取单词数据失败:", error)
      toast({
        title: "加载失败",
        description: "获取单词数据时出现错误",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 处理切换单词视图
  const handleToggleWordView = async () => {
    setIsLoading(true)
    const newShowAllWords = !showAllWords
    setShowAllWords(newShowAllWords)

    try {
      // 尝试从缓存获取数据
      const isLevelSpecific = !newShowAllWords && level !== undefined
      const cachedData = getDataFromCache(isLevelSpecific)

      if (cachedData) {
        // 使用缓存数据
        setWords(cachedData.words)
        setTotalWordCount(cachedData.totalCount)
        setIsLoading(false)
        return
      }

      // 如果没有缓存，从服务器获取
      if (newShowAllWords) {
        // 切换到显示所有单词
        const allWords = await getVocabularyWords(bookId)
        setWords(allWords)
        const count = await getBookWordCount(bookId)
        setTotalWordCount(count)
        saveDataToCache(allWords, count, false)
      } else {
        // 切换回显示当前关卡单词
        if (level) {
          const levelWords = await getWordsByLevel(bookId, level)
          setWords(levelWords)
          const count = await getBookWordCount(bookId)
          setTotalWordCount(count)
          saveDataToCache(levelWords, count, true)
        } else {
          // 如果没有指定关卡，则按页获取
          const pageWords = await getVocabularyWords(bookId, currentPage, wordsPerPage)
          setWords(pageWords)
          const count = await getBookWordCount(bookId)
          setTotalWordCount(count)
        }
      }
    } catch (error) {
      console.error("切换单词视图失败:", error)
      toast({
        title: "加载失败",
        description: "获取单词数据时出现错误",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 处理行点击
  const handleRowClick = (wordId: string | number) => {
    setWordHighlights((prev) => {
      const currentLevel = prev[wordId] || 0
      // Increase intensity level (0-4), then back to 0
      const newLevel = (currentLevel + 1) % 5
      const newHighlights = { ...prev, [wordId]: newLevel }
      // Save to localStorage immediately
      localStorage.setItem(`wordHighlights-${bookId}-${level}`, JSON.stringify(newHighlights))
      return newHighlights
    })
  }

  // 获取高亮颜色
  const getHighlightColor = (level: number) => {
    switch (level) {
      case 1:
        return "bg-green-100"
      case 2:
        return "bg-green-200"
      case 3:
        return "bg-green-300"
      case 4:
        return "bg-green-400"
      default:
        return "bg-white"
    }
  }

  // 处理可见性切换 - 使用 CSS 类名而不是条件渲染
  const handleVisibilityChange = useCallback((type: "word" | "pronunciation" | "definition", visible: boolean) => {
    setVisibilityClasses((prev) => ({
      ...prev,
      [type]: visible ? "" : "vocabulary-hidden",
    }))
  }, [])

  return (
    <Card>
      <VocabularyVisibilityControls
        onToggleWord={(visible) => handleVisibilityChange("word", visible)}
        onTogglePronunciation={(visible) => handleVisibilityChange("pronunciation", visible)}
        onToggleDefinition={(visible) => handleVisibilityChange("definition", visible)}
      />
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>我的词库 ({isLoading ? "加载中..." : totalWordCount})</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleWordView}
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          {showAllWords ? (
            <>
              <BookOpen className="h-4 w-4" />
              <span>显示本关单词</span>
            </>
          ) : (
            <>
              <Library className="h-4 w-4" />
              <span>显示全部单词</span>
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // 加载状态
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-600">加载单词中...</span>
          </div>
        ) : words.length === 0 ? (
          // 如果词库为空，显示提示信息
          <div className="text-center py-8 text-muted-foreground">你的词库还没有单词，开始添加吧！</div>
        ) : (
          <>
            {/* 如果有单词，渲染表格 */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead>单词</TableHead>
                  <TableHead>定义</TableHead>
                  <TableHead>掌握程度</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {words.map((word, index) => {
                  // Get highlight level from state or default to 0
                  const highlightLevel = wordHighlights[word.id] || 0

                  return (
                    <TableRow
                      key={word.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleRowClick(word.id)}
                    >
                      <TableCell className={`font-medium text-center ${getHighlightColor(highlightLevel)}`}>
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className={`font-bold text-blue-600 ${visibilityClasses.word}`}>{word.word}</div>
                        {/* Display only one phonetic pronunciation if available */}
                        {word.pronunciation && (
                          <div className={`text-sm text-gray-600 mt-1 ${visibilityClasses.pronunciation}`}>
                            {word.pronunciation}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <div
                          className={`truncate ${visibilityClasses.definition}`}
                          style={{ display: "inline-block", maxWidth: "100%" }}
                        >
                          {word.definition}
                        </div>
                      </TableCell>
                      <TableCell>
                        {/* Mastery level display */}
                        {(word as any).has_mastery_data ? (
                          <span
                            className={`font-medium ${
                              word.mastery_level >= 3
                                ? "text-green-600"
                                : word.mastery_level >= 1
                                  ? "text-blue-600"
                                  : word.mastery_level <= -1
                                    ? "text-red-600"
                                    : "text-gray-600"
                            }`}
                          >
                            {word.mastery_level}
                          </span>
                        ) : (
                          <span className="text-gray-400">未学习</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {/* 在 TableRow 中的操作列中添加"添加到生词本"按钮 */}
                        {/* 在 <TableCell> 中的 <AlertDialog> 前添加 */}
                        {starButtonStyle === "simple" ? (
                          <AddToVocabularyButton
                            wordId={word.id}
                            word={word.word}
                            variant="ghost"
                            size="icon"
                            className="mr-1"
                            simpleStarOnly={true}
                            isInVocabulary={favoriteStatus[word.id] || false}
                            isStatusLoading={isFavoritesLoading}
                            onToggleSuccess={(newStatus) => {
                              setFavoriteStatus((prev) => ({
                                ...prev,
                                [word.id]: newStatus,
                              }))
                            }}
                          />
                        ) : (
                          <AddToVocabularyButton
                            wordId={word.id}
                            word={word.word}
                            variant="ghost"
                            size="icon"
                            className="mr-1"
                            isInVocabulary={favoriteStatus[word.id] || false}
                            isStatusLoading={isFavoritesLoading}
                            onToggleSuccess={(newStatus) => {
                              setFavoriteStatus((prev) => ({
                                ...prev,
                                [word.id]: newStatus,
                              }))
                            }}
                          />
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive/90"
                              onClick={(e) => e.stopPropagation()} // Prevent row click event
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除</AlertDialogTitle>
                              <AlertDialogDescription>
                                你确定要删除单词 "{word.word}" 吗？此操作无法撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => {
                                  e.stopPropagation() // Prevent row click event
                                  handleDelete(word.id)
                                }}
                                disabled={deletingId === word.id}
                              >
                                {deletingId === word.id ? "删除中..." : "删除"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {/* 分页控制 - 只在显示全部单词且总页数大于1时显示 */}
            {showAllWords && totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  上一页
                </Button>
                <span className="text-sm text-gray-500">
                  第 {currentPage} 页 / 共 {totalPages} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoading}
                >
                  下一页
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default VocabularyList
