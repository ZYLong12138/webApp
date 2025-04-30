"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Star, Trash2, Pencil, Save, X, Volume2, Loader2 } from "lucide-react"
import type { VocabularyWord } from "@/types/vocabulary"
import { removeFromUserVocabulary } from "@/services/personal-vocabulary-service"
import { useToast } from "@/hooks/use-toast"
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

interface PersonalVocabularyCardsProps {
  words: VocabularyWord[]
  onUpdateNotes: (wordId: string | number, notes: string) => Promise<void>
  onToggleFavorite: (wordId: string | number) => Promise<void>
  onWordRemoved: (wordId: string | number) => void
}

export function PersonalVocabularyCards({
  words,
  onUpdateNotes,
  onToggleFavorite,
  onWordRemoved,
}: PersonalVocabularyCardsProps) {
  const { toast } = useToast()
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({})
  const [isEditing, setIsEditing] = useState<{ [key: string]: boolean }>({})
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState<string | null>(null)

  // 处理开始编辑笔记
  const handleStartEditing = (wordId: string | number, notes = "") => {
    setEditingNotes({ ...editingNotes, [wordId.toString()]: notes })
    setIsEditing({ ...isEditing, [wordId.toString()]: true })
  }

  // 处理取消编辑笔记
  const handleCancelEditing = (wordId: string | number) => {
    setIsEditing({ ...isEditing, [wordId.toString()]: false })
    // 重置为原始笔记
    const word = words.find((w) => w.id === wordId)
    if (word) {
      setEditingNotes({ ...editingNotes, [wordId.toString()]: word.notes || "" })
    }
  }

  // 处理保存笔记
  const handleSaveNotes = async (wordId: string | number) => {
    setIsSaving(wordId.toString())
    try {
      await onUpdateNotes(wordId, editingNotes[wordId.toString()] || "")
      setIsEditing({ ...isEditing, [wordId.toString()]: false })
    } catch (error) {
      console.error("保存笔记失败:", error)
    } finally {
      setIsSaving(null)
    }
  }

  // 处理移除单词
  const handleRemoveWord = async (wordId: string | number) => {
    setIsRemoving(wordId.toString())
    try {
      const success = await removeFromUserVocabulary(wordId)
      if (success) {
        onWordRemoved(wordId)
        toast({
          title: "移除成功",
          description: "单词已从生词本中移除",
        })
      } else {
        toast({
          title: "移除失败",
          description: "无法从生词本中移除单词，请重试",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("移除单词失败:", error)
      toast({
        title: "移除失败",
        description: "发生错误，请重试",
        variant: "destructive",
      })
    } finally {
      setIsRemoving(null)
    }
  }

  // 播放单词发音
  const playPronunciation = (word: string) => {
    // 这里可以添加实际的发音逻辑
    console.log(`播放单词 "${word}" 的发音`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {words.map((word) => (
        <Card key={word.id} className="overflow-hidden">
          <CardHeader className="pb-2 flex flex-row justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-blue-600">{word.word}</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => playPronunciation(word.word)}>
                  <Volume2 className="h-3 w-3 text-gray-500" />
                </Button>
              </div>
              {word.pronunciation && <p className="text-sm text-gray-500">{word.pronunciation}</p>}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggleFavorite(word.id)}>
                <Star className={`h-4 w-4 ${word.is_favorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`} />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认移除</AlertDialogTitle>
                    <AlertDialogDescription>
                      确定要将 "{word.word}" 从生词本中移除吗？此操作不会删除词库中的单词。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleRemoveWord(word.id)}
                      disabled={isRemoving === word.id.toString()}
                    >
                      {isRemoving === word.id.toString() ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          移除中...
                        </>
                      ) : (
                        "移除"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-gray-700 mb-4">{word.definition}</div>
            {word.example && <div className="text-sm text-gray-500 italic mb-4">"{word.example}"</div>}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">我的笔记</h4>
                {!isEditing[word.id.toString()] && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleStartEditing(word.id, word.notes || "")}
                  >
                    <Pencil className="h-3 w-3 text-gray-500" />
                  </Button>
                )}
              </div>
              {isEditing[word.id.toString()] ? (
                <div className="space-y-2">
                  <Textarea
                    value={editingNotes[word.id.toString()] || ""}
                    onChange={(e) => setEditingNotes({ ...editingNotes, [word.id.toString()]: e.target.value })}
                    placeholder="添加笔记..."
                    className="min-h-[80px] text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelEditing(word.id)}
                      disabled={isSaving === word.id.toString()}
                    >
                      <X className="h-3 w-3 mr-1" />
                      取消
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleSaveNotes(word.id)}
                      disabled={isSaving === word.id.toString()}
                    >
                      {isSaving === word.id.toString() ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Save className="h-3 w-3 mr-1" />
                      )}
                      保存
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 min-h-[40px] whitespace-pre-wrap">
                  {word.notes || <span className="text-gray-400 italic">无笔记</span>}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="text-xs text-gray-400 pt-0">
            添加于 {new Date(word.created_at || "").toLocaleDateString()}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
