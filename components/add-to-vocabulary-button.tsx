"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { BookPlus, BookCheck, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  addToUserVocabulary,
  removeFromUserVocabulary,
  isInUserVocabulary,
} from "@/services/personal-vocabulary-service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface AddToVocabularyButtonProps {
  wordId: string | number
  word: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  onSuccess?: () => void
}

export function AddToVocabularyButton({
  wordId,
  word,
  variant = "outline",
  size = "sm",
  className = "",
  onSuccess,
}: AddToVocabularyButtonProps) {
  const { toast } = useToast()
  const [isInVocabulary, setIsInVocabulary] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [notes, setNotes] = useState("")

  // 检查单词是否已在生词本中
  useEffect(() => {
    const checkVocabularyStatus = async () => {
      setIsLoading(true)
      try {
        const result = await isInUserVocabulary(wordId)
        setIsInVocabulary(result)
      } catch (error) {
        console.error("Error checking vocabulary status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkVocabularyStatus()
  }, [wordId])

  // 处理添加到生词本
  const handleAddToVocabulary = async () => {
    setIsProcessing(true)
    try {
      const success = await addToUserVocabulary(wordId, notes)
      if (success) {
        setIsInVocabulary(true)
        toast({
          title: "添加成功",
          description: `"${word}" 已添加到您的生词本`,
        })
        if (onSuccess) {
          onSuccess()
        }
      } else {
        toast({
          title: "添加失败",
          description: "无法添加到生词本，请重试",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding to vocabulary:", error)
      toast({
        title: "添加失败",
        description: "发生错误，请重试",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setIsDialogOpen(false)
    }
  }

  // 处理从生词本移除
  const handleRemoveFromVocabulary = async () => {
    setIsProcessing(true)
    try {
      const success = await removeFromUserVocabulary(wordId)
      if (success) {
        setIsInVocabulary(false)
        toast({
          title: "移除成功",
          description: `"${word}" 已从您的生词本中移除`,
        })
        if (onSuccess) {
          onSuccess()
        }
      } else {
        toast({
          title: "移除失败",
          description: "无法从生词本中移除，请重试",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing from vocabulary:", error)
      toast({
        title: "移除失败",
        description: "发生错误，请重试",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  if (isInVocabulary) {
    return (
      <Button
        variant={variant}
        size={size}
        className={`${className} text-green-600 border-green-600 hover:bg-green-50`}
        onClick={handleRemoveFromVocabulary}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <BookCheck className="h-4 w-4 mr-1" />
            已加入生词本
          </>
        )}
      </Button>
    )
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <BookPlus className="h-4 w-4 mr-1" />
          加入生词本
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>添加到生词本</DialogTitle>
          <DialogDescription>将 "{word}" 添加到您的个人生词本</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="notes">笔记（可选）</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="添加您对这个单词的笔记、记忆方法或例句..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isProcessing}>
            取消
          </Button>
          <Button onClick={handleAddToVocabulary} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BookPlus className="h-4 w-4 mr-1" />}
            添加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
