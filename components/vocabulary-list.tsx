"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { VocabularyWord } from "@/types/vocabulary"
import { deleteVocabularyWord } from "@/services/vocabulary-service"
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

// 定义传入 props 的类型
interface VocabularyListProps {
  words: VocabularyWord[] // 单词数据，包含多个单词
  onWordDeleted: () => void // 删除单词后的回调函数
}

// 主组件函数
export function VocabularyList({ words, onWordDeleted }: VocabularyListProps) {
  const { toast } = useToast() // 获取提示框功能
  const [deletingId, setDeletingId] = useState<string | null>(null) // 追踪当前正在删除的单词的 id

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
      onWordDeleted() // 调用父组件的删除回调，刷新单词列表
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
        return "未知" // 默认值
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>我的词库 ({words.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {words.length === 0 ? (
          // 如果词库为空，显示提示信息
          <div className="text-center py-8 text-muted-foreground">你的词库还没有单词，开始添加吧！</div>
        ) : (
          // 如果有单词，渲染表格
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
        )}
      </CardContent>
    </Card>
  )
}

export default VocabularyList

