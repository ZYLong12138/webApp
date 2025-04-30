"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Search, BookOpen, Star, Loader2, SortAsc } from "lucide-react"
import { getUserVocabulary, updateVocabularyNotes, toggleFavorite } from "@/services/personal-vocabulary-service"
import type { VocabularyWord } from "@/types/vocabulary"
import { ScrollButtons } from "@/Integration_modules/scroll-buttons"
import { PersonalVocabularyList } from "@/components/personal-vocabulary-list"
import { PersonalVocabularyCards } from "@/components/personal-vocabulary-cards"
import { useToast } from "@/hooks/use-toast"

export default function PersonalVocabularyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [words, setWords] = useState<VocabularyWord[]>([])
  const [filteredWords, setFilteredWords] = useState<VocabularyWord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("list")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "recent">("recent")
  const [filterFavorites, setFilterFavorites] = useState(false)

  // 获取生词本数据
  useEffect(() => {
    const fetchVocabulary = async () => {
      setIsLoading(true)
      try {
        const data = await getUserVocabulary()
        setWords(data)
        setFilteredWords(data)
      } catch (error) {
        console.error("获取生词本失败:", error)
        toast({
          title: "加载失败",
          description: "获取生词本数据时出现错误",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchVocabulary()
  }, [toast])

  // 处理搜索
  useEffect(() => {
    let result = [...words]

    // 应用收藏过滤
    if (filterFavorites) {
      result = result.filter((word) => word.is_favorite)
    }

    // 应用搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (word) =>
          word.word.toLowerCase().includes(query) ||
          word.definition.toLowerCase().includes(query) ||
          (word.notes && word.notes.toLowerCase().includes(query)),
      )
    }

    // 应用排序
    if (sortOrder === "asc") {
      result.sort((a, b) => a.word.localeCompare(b.word))
    } else if (sortOrder === "desc") {
      result.sort((a, b) => b.word.localeCompare(a.word))
    } else {
      // 按添加时间排序（最近添加的在前）
      result.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
      })
    }

    setFilteredWords(result)
  }, [words, searchQuery, sortOrder, filterFavorites])

  // 处理笔记更新
  const handleUpdateNotes = async (wordId: string | number, notes: string) => {
    try {
      const success = await updateVocabularyNotes(wordId, notes)
      if (success) {
        // 更新本地状态
        setWords((prevWords) => prevWords.map((word) => (word.id === wordId ? { ...word, notes } : word)))
        toast({
          title: "笔记已更新",
          description: "您的笔记已成功保存",
        })
      } else {
        toast({
          title: "更新失败",
          description: "无法更新笔记，请重试",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("更新笔记失败:", error)
      toast({
        title: "更新失败",
        description: "发生错误，请重试",
        variant: "destructive",
      })
    }
  }

  // 处理收藏切换
  const handleToggleFavorite = async (wordId: string | number) => {
    try {
      const success = await toggleFavorite(wordId)
      if (success) {
        // 更新本地状态
        setWords((prevWords) =>
          prevWords.map((word) => (word.id === wordId ? { ...word, is_favorite: !word.is_favorite } : word)),
        )
      } else {
        toast({
          title: "操作失败",
          description: "无法更新收藏状态，请重试",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("切换收藏状态失败:", error)
      toast({
        title: "操作失败",
        description: "发生错误，请重试",
        variant: "destructive",
      })
    }
  }

  // 处理单词移除后的回调
  const handleWordRemoved = (wordId: string | number) => {
    setWords((prevWords) => prevWords.filter((word) => word.id !== wordId))
  }

  // 渲染内容函数
  const renderContent = () => {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-600">加载生词本中...</span>
          </CardContent>
        </Card>
      )
    }

    if (filteredWords.length === 0) {
      return (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">您的生词本还是空的</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || filterFavorites
                ? "没有找到匹配的单词，请尝试其他搜索条件"
                : "在学习单词时，点击“加入生词本”按钮来保存您想要重点记忆的单词"}
            </p>
            <Button onClick={() => router.push("/word_list")}>返回词库</Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="list">列表视图</TabsTrigger>
          <TabsTrigger value="cards">卡片视图</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <PersonalVocabularyList
            words={filteredWords}
            onUpdateNotes={handleUpdateNotes}
            onToggleFavorite={handleToggleFavorite}
            onWordRemoved={handleWordRemoved}
          />
        </TabsContent>
        <TabsContent value="cards">
          <PersonalVocabularyCards
            words={filteredWords}
            onUpdateNotes={handleUpdateNotes}
            onToggleFavorite={handleToggleFavorite}
            onWordRemoved={handleWordRemoved}
          />
        </TabsContent>
      </Tabs>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="min-h-screen bg-gray-50">
        {/* 顶部导航 */}
        <div className="container mx-auto pt-4 px-4">
          <div className="flex justify-between items-center mb-6">
            <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.push("/word_list")}>
              <ArrowLeft className="h-4 w-4" />
              返回词库
            </Button>
          </div>

          <h1 className="text-3xl font-bold mb-6 text-center flex items-center justify-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            我的生词本
          </h1>

          {/* 搜索和过滤 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Input
                className="pl-10"
                placeholder="搜索单词、释义或笔记..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortOrder === "recent" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortOrder("recent")}
                className="flex items-center gap-1"
              >
                <SortAsc className="h-4 w-4" />
                最近添加
              </Button>
              <Button
                variant={sortOrder === "asc" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortOrder("asc")}
                className="flex items-center gap-1"
              >
                <SortAsc className="h-4 w-4" />
                A-Z
              </Button>
              <Button
                variant={sortOrder === "desc" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortOrder("desc")}
                className="flex items-center gap-1"
              >
                <SortAsc className="h-4 w-4 rotate-180" />
                Z-A
              </Button>
              <Button
                variant={filterFavorites ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterFavorites(!filterFavorites)}
                className="flex items-center gap-1"
              >
                <Star className={`h-4 w-4 ${filterFavorites ? "fill-yellow-400 text-yellow-400" : ""}`} />
                收藏
              </Button>
            </div>
          </div>

          {/* 内容区域 */}
          {renderContent()}
        </div>

        {/* 滚动按钮 */}
        <ScrollButtons />
      </div>
    </ThemeProvider>
  )
}
