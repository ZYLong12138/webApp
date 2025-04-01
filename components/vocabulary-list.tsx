"use client"

import { useState, useEffect } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { VocabularyWord } from "@/types/vocabulary"
import { deleteVocabularyWord, getBookWordCount, getVocabularyWords } from "@/services/vocabulary-service"
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

// 定义传入 props 的类型
interface VocabularyListProps {
  words?: VocabularyWord[] // 可选的单词数据，如果不提供则通过API获取
  onWordDeleted: () => void // 删除单词后的回调函数
  bookId?: string // 可选的词书ID，默认为"my-vocabulary"
}

// 主组件函数
export function VocabularyList({ words: initialWords, onWordDeleted, bookId = "my-vocabulary" }: VocabularyListProps) {
  const { toast } = useToast() // 获取提示框功能
  const [deletingId, setDeletingId] = useState<string | null>(null) // 追踪当前正在删除的单词的 id
  const [currentPage, setCurrentPage] = useState(1) // 当前页码
  const [totalWordCount, setTotalWordCount] = useState(0) // 总单词数量
  const [isLoading, setIsLoading] = useState(true) // 加载状态
  const [words, setWords] = useState<VocabularyWord[]>([]) // 当前页的单词
  const wordsPerPage = 200 // 每页显示的单词数量

  // 获取总单词数量和当前页的单词
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // 获取总单词数量
        const count = await getBookWordCount(bookId)
        setTotalWordCount(count)

        // 如果没有提供初始单词数据，则通过API获取
        if (!initialWords) {
          const pageWords = await getVocabularyWords(bookId, currentPage, wordsPerPage)
          setWords(pageWords)
        } else {
          // 如果提供了初始单词数据，使用它
          setWords(initialWords)
        }
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
  }, [bookId, currentPage, initialWords, toast])

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

  // 根据掌握程度返回对应的文本
  const getMasteryLevelText = (level: number) => {
    switch (level) {
      case 0:
        return "未掌握"
      case 1:
        return "初步了解"
      case 2:
        return "基本掌握"
      case 3:
        return "熟练掌握"
      case 4:
        return "完全掌握"
      default:
        return "未学习" // 默认值
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>我的词库 ({isLoading ? "加载中..." : totalWordCount})</CardTitle>
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
                  <TableHead>单词</TableHead>
                  <TableHead>定义</TableHead>
                  <TableHead>掌握程度</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {words.map((word) => (
                  // 遍历每个单词，渲染一行表格数据
                  <TableRow key={word.id}>
                    <TableCell className="font-medium">{word.word}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{word.definition}</TableCell>
                    <TableCell>{getMasteryLevelText(word.mastery_level)}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90">
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
                            <AlertDialogAction onClick={() => handleDelete(word.id)} disabled={deletingId === word.id}>
                              {deletingId === word.id ? "删除中..." : "删除"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* 分页控制 */}
            {totalPages > 1 && (
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

