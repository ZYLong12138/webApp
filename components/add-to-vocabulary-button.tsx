"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { BookPlus, Loader2 } from "lucide-react"
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
import { cn } from "@/lib/utils"
import type { VariantProps } from "class-variance-authority"
import type { buttonVariants } from "@/components/ui/button"
import { Star } from "lucide-react"

interface AddToVocabularyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  wordId: string | number
  word: string
  definition?: string
  pronunciation?: string
  simpleStarOnly?: boolean
  isInVocabulary?: boolean
  isStatusLoading?: boolean
  onToggleSuccess?: (newStatus: boolean) => void
  onSuccess?: () => void
}

export function AddToVocabularyButton({
  className,
  variant,
  size,
  wordId,
  word,
  definition,
  pronunciation,
  simpleStarOnly = false,
  isInVocabulary: propIsInVocabulary,
  isStatusLoading,
  onToggleSuccess,
  onSuccess,
  ...props
}: AddToVocabularyButtonProps) {
  const { toast } = useToast()
  const [isInVocabulary, setIsInVocabulary] = useState(propIsInVocabulary || false)
  const [isLoading, setIsLoading] = useState(isStatusLoading !== undefined ? isStatusLoading : true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [notes, setNotes] = useState("")

  // 检查单词是否已在生词本中
  useEffect(() => {
    if (propIsInVocabulary !== undefined) {
      setIsInVocabulary(propIsInVocabulary)
      return
    }

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
  }, [wordId, propIsInVocabulary])

  // 当外部 propIsInVocabulary 变化时更新内部状态
  useEffect(() => {
    if (propIsInVocabulary !== undefined) {
      setIsInVocabulary(propIsInVocabulary)
    }
  }, [propIsInVocabulary])

  // 当外部 isStatusLoading 变化时更新内部状态
  useEffect(() => {
    if (isStatusLoading !== undefined) {
      setIsLoading(isStatusLoading)
    }
  }, [isStatusLoading])

  // 处理添加到生词本
  const handleAddToVocabulary = async () => {
    setIsProcessing(true)
    try {
      const success = await addToUserVocabulary(wordId, notes)
      if (success) {
        setIsInVocabulary(true)
        if (onToggleSuccess) {
          onToggleSuccess(true)
        }
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
        if (onToggleSuccess) {
          onToggleSuccess(false)
        }
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

  // 删除这行代码，这是导致按钮消失的原因
  // if (isInVocabulary) {
  //   return null
  // }

  if (simpleStarOnly) {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={isInVocabulary ? handleRemoveFromVocabulary : handleAddToVocabulary}
        className={cn(
          isInVocabulary ? "text-yellow-500 hover:text-yellow-600" : "text-gray-400 hover:text-gray-500",
          "p-0 h-auto min-w-0 bg-transparent hover:bg-transparent",
          className,
        )}
        disabled={isLoading || isProcessing}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Star className="h-4 w-4" fill={isInVocabulary ? "currentColor" : "none"} />
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
