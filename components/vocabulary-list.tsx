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
import { AudioPlayer } from "@/components/audio-player"

// 定义传入 props 的类型
interface VocabularyListProps {
  words: VocabularyWord[]
  onWordDeleted?: () => void
  bookId: string
}

// 主组件函数
export function VocabularyList({ words, onWordDeleted, bookId }: VocabularyListProps) {
  const { toast } = useToast() // 获取提示框功能
  const [deletingWordId, setDeletingWordId] = useState<string | null>(null) // 追踪当前正在删除的单词的 id
  const [currentPage, setCurrentPage] = useState(1) // 当前页码
  const [totalWordCount, setTotalWordCount] = useState(0) // 总单词数量
  const [isLoading, setIsLoading] = useState(true) // 加载状态
  const [wordsInPage, setWordsInPage] = useState<VocabularyWord[]>([]) // 当前页的单词
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
        if (!words) {
          const pageWords = await getVocabularyWords(bookId, currentPage, wordsPerPage)
          setWordsInPage(pageWords)
        } else {
          // 如果提供了初始单词数据，使用它
          setWordsInPage(words)
        }
      } catch (error) {
        console.error("获取单词数据失败:", error)
        toast({
          title: "加载失败",
          description: "获取单词数据时出现错误",
          variant: "destructive",
        })
        // 如果获取失败，设置为空数组
        setWordsInPage([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [bookId, currentPage, words, toast])

  // 计算总页数
  const totalPages = Math.ceil(totalWordCount / wordsPerPage)

  // 处理删除单词的函数
  const handleDeleteWord = async (wordId: string) => {
    if (window.confirm('确定要删除这个单词吗？')) {
      setDeletingWordId(wordId)
      try {
        await deleteVocabularyWord(wordId)
        if (onWordDeleted) {
          onWordDeleted()
        }
      } catch (error) {
        console.error('删除单词失败:', error)
        toast({
          title: "删除失败",
          description: "删除单词时出现错误，请重试",
          variant: "destructive",
        })
      } finally {
        setDeletingWordId(null)
      }
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
      setWordsInPage(pageWords)
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
        ) : wordsInPage.length === 0 ? (
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
                {wordsInPage.map((word) => (
                  // 遍历每个单词，渲染一行表格数据
                  <TableRow key={word.id}>
                    <TableCell className="font-medium">{word.word}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{word.definition}</TableCell>
                    <TableCell>{getMasteryLevelText(word.mastery_level)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AudioPlayer audioPath={word.vedio} word={word.word} />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteWord(String(word.id))}
                              disabled={deletingWordId === String(word.id)}
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                            >
                              {deletingWordId === String(word.id) ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                        </AlertDialog>
                      </div>
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

