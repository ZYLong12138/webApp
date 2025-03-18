"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { addVocabularyWord } from "@/services/vocabulary-service"
import type { NewVocabularyWord } from "@/types/vocabulary"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface QuickAddWordButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  onWordAdded?: () => void
}

export function QuickAddWordButton({
  variant = "default",
  size = "default",
  className = "",
  onWordAdded,
}: QuickAddWordButtonProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<NewVocabularyWord>({
    word: "",
    definition: "",
    example: "",
  })

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      word: "",
      definition: "",
      example: "",
    })
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Call the service function to add the new word
      await addVocabularyWord(formData)

      // Show success toast
      toast({
        title: "单词添加成功",
        description: `已添加 "${formData.word}" 到你的词库`,
      })

      // Reset form and close dialog
      resetForm()
      setOpen(false)

      // Call the callback if provided
      if (onWordAdded) {
        onWordAdded()
      }
    } catch (error) {
      // Show error toast
      toast({
        title: "添加失败",
        description: "添加单词时出现错误，请重试",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <PlusCircle className="mr-2 h-4 w-4" />
          快速添加单词
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>添加新单词</DialogTitle>
          <DialogDescription>填写单词信息并点击提交，将单词添加到您的词库中。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="word">单词</Label>
              <Input
                id="word"
                name="word"
                value={formData.word}
                onChange={handleChange}
                required
                placeholder="输入单词"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="definition">定义</Label>
              <Textarea
                id="definition"
                name="definition"
                value={formData.definition}
                onChange={handleChange}
                required
                placeholder="输入单词的定义"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="example">例句</Label>
              <Textarea
                id="example"
                name="example"
                value={formData.example}
                onChange={handleChange}
                placeholder="输入例句（可选）"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "添加中..." : "添加单词"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

