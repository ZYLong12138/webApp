// 引入必要的库和组件
"use client" // 确保这是客户端代码

import type React from "react"
import { useState } from "react" // 导入 React 的 useState hook，用于状态管理
import { Button } from "@/components/ui/button" // 导入按钮组件
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card" // 导入卡片组件，用于包装表单
import { Input } from "@/components/ui/input" // 导入输入框组件
import { Label } from "@/components/ui/label" // 导入标签组件，用于表单字段描述
import { Textarea } from "@/components/ui/textarea" // 导入文本区域组件，用于输入多行文本
import { addVocabularyWord } from "@/services/vocabulary-service" // 导入服务，用于向服务器添加新单词
import type { NewVocabularyWord } from "@/types/vocabulary" // 导入类型定义，用于描述新单词的数据结构
import { useToast } from "@/hooks/use-toast" // 导入自定义的 Toast 提示钩子，用于显示提示消息

// 定义组件的 props 类型
interface AddWordFormProps {
  onWordAdded: () => void // 添加单词后调用的回调函数
}

// 主组件
export function AddWordForm({ onWordAdded }: AddWordFormProps) {
  const { toast } = useToast() // 获取 Toast 提示函数
  const [isSubmitting, setIsSubmitting] = useState(false) // 提交状态，防止重复提交
  const [formData, setFormData] = useState<NewVocabularyWord>({
    // 存储表单数据，初始化为空
    word: "",
    definition: "",
    example: "",
  })

  // 处理输入框和文本框的变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target // 获取表单字段的名字和值
    setFormData((prev) => ({ ...prev, [name]: value })) // 更新表单数据
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // 防止表单默认的刷新行为
    setIsSubmitting(true) // 设置提交状态为 true，防止重复提交

    try {
      // 调用服务函数添加新单词
      await addVocabularyWord(formData)
      toast({
        // 显示成功的 Toast 提示
        title: "单词添加成功",
        description: `已添加 "${formData.word}" 到你的词库`,
      })
      setFormData({ word: "", definition: "", example: "" }) // 清空表单数据
      onWordAdded() // 调用父组件的回调函数
    } catch (error) {
      toast({
        // 显示失败的 Toast 提示
        title: "添加失败",
        description: "添加单词时出现错误，请重试",
        variant: "destructive", // 错误提示的变种
      })
    } finally {
      setIsSubmitting(false) // 提交完成，恢复提交状态
    }
  }

  return (
    <Card>
      {/* 卡片组件，用于包装表单 */}
      <CardHeader>
        <CardTitle>添加新单词</CardTitle> {/* 卡片标题 */}
      </CardHeader>
      {/* 表单元素 */}
      <form onSubmit={handleSubmit}>
        {" "}
        {/* 表单提交事件处理 */}
        <CardContent className="space-y-4">
          {/* 输入框部分：单词 */}
          <div className="space-y-2">
            <Label htmlFor="word">单词</Label> {/* 标签 */}
            <Input
              id="word"
              name="word"
              value={formData.word}
              onChange={handleChange}
              required
              placeholder="输入单词"
            />
          </div>
          {/* 输入框部分：定义 */}
          <div className="space-y-2">
            <Label htmlFor="definition">定义</Label> {/* 标签 */}
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
          {/* 输入框部分：例句（可选） */}
          <div className="space-y-2">
            <Label htmlFor="example">例句</Label> {/* 标签 */}
            <Textarea
              id="example"
              name="example"
              value={formData.example}
              onChange={handleChange}
              placeholder="输入例句（可选）"
              rows={2}
            />
          </div>
        </CardContent>
        {/* 表单底部：提交按钮 */}
        <CardFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "添加中..." : "添加单词"} {/* 根据提交状态显示不同的按钮文字 */}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

