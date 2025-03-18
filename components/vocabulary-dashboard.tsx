"use client"

import { useState, useEffect } from "react" // 导入 React 的 useState 和 useEffect 钩子
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // 导入 Tab 组件，管理不同的选项卡
import { AddWordForm } from "./add-word-form" // 导入添加单词的表单组件
import { VocabularyList } from "./vocabulary-list" // 导入显示单词列表的组件
import { ReviewSession } from "./review-session" // 导入复习会话组件
import { getVocabularyWords, initializeDatabase } from "@/services/vocabulary-service" // 导入数据库操作服务，获取单词和初始化数据库
import type { VocabularyWord } from "@/types/vocabulary" // 导入单词类型定义
import { useToast } from "@/hooks/use-toast" // 导入自定义的 toast 通知钩子
import { Alert, AlertDescription } from "@/components/ui/alert" // 导入警告框组件
import { AlertCircle, RefreshCw } from "lucide-react" // 导入图标
import { Button } from "@/components/ui/button" // 导入按钮组件
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card" // 导入卡片组件

// 定义 VocabularyDashboard 组件
export function VocabularyDashboard() {
  const { toast } = useToast() // 使用自定义的 toast 提示功能
  const [words, setWords] = useState<VocabularyWord[]>([]) // 存储单词数据的状态
  const [isLoading, setIsLoading] = useState(true) // 存储加载状态的状态
  const [error, setError] = useState<string | null>(null) // 存储错误信息的状态
  const [activeTab, setActiveTab] = useState("list") // 存储当前激活的 Tab（标签页）的状态
  const [dbInitialized, setDbInitialized] = useState(false) // 存储数据库是否初始化的状态

  // 初始化应用，包括数据库初始化和单词数据获取
  const initializeApp = async () => {
    setIsLoading(true) // 设置加载状态为 true
    setError(null) // 重置错误信息

    try {
      // 尝试初始化数据库
      const initialized = await initializeDatabase()
      setDbInitialized(initialized) // 设置数据库是否初始化成功的状态

      if (!initialized) {
        // 如果数据库初始化失败，设置错误信息并停止加载
        setError("无法初始化数据库。请检查您的 Supabase 配置和权限。")
        setIsLoading(false)
        return
      }

      // 如果数据库初始化成功，尝试获取单词数据
      await fetchWords()
    } catch (err) {
      console.error("Error initializing app:", err)
      // 捕获异常并设置错误信息
      setError("初始化应用程序时出错。请刷新页面重��。")
      setIsLoading(false)
    }
  }

  // 获取单词数据的函数
  const fetchWords = async () => {
    setIsLoading(true) // 设置加载状态为 true
    try {
      const data = await getVocabularyWords() // 从数据库获取单词数据
      setWords(data) // 更新单词数据
      setError(null) // 重置错误信息
    } catch (err) {
      console.error("Error fetching words:", err)
      // 捕获异常并设置错误信息
      setError("加载单词列表时出现错误。请检查您的数据库连接。")
    } finally {
      setIsLoading(false) // 设置加载状态为 false
    }
  }

  // 在组件挂载时初始化应用
  useEffect(() => {
    initializeApp()
  }, []) // 空依赖数组确保此副作用只在组件第一次加载时执行一次

  // 单词添加后的回调
  const handleWordAdded = () => {
    fetchWords() // 重新获取单词列表
    setActiveTab("list") // 切换到单词列表 tab
  }

  // 单词删除后的回调
  const handleWordDeleted = () => {
    fetchWords() // 重新获取单词列表
  }

  // 复习完成后的回调
  const handleReviewComplete = () => {
    setActiveTab("list") // 切换回单词列表 tab
  }

  // 如果有错误，显示错误提示
  if (error) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              错误
            </CardTitle>
            <CardDescription>应用程序遇到了一个问题</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            {/* 如果数据库没有初始化，提供可能的解决方案 */}
            {!dbInitialized && (
              <div className="bg-muted p-4 rounded-md text-sm">
                <p className="font-medium mb-2">可能的解决方案：</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>确保您的 Supabase 项目已正确设置，并且环境变量正确配置。</li>
                  <li>
                    您可能需要手动创建数据库表。请登录 Supabase 控制台，打开 SQL 编辑器，并运行以下代码：
                    <pre className="bg-background p-2 rounded mt-2 overflow-x-auto text-xs">
                      {`CREATE TABLE IF NOT EXISTS vocabulary_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  definition TEXT NOT NULL,
  example TEXT,
  mastery_level INTEGER NOT NULL DEFAULT 0,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}
                    </pre>
                  </li>
                  <li>检查您的 Supabase 权限设置，确保应用程序有权访问和修改数据库。</li>
                </ol>
              </div>
            )}

            {/* 提供一个按钮用于重试初始化 */}
            <Button onClick={initializeApp} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              重试
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 主应用界面，如果没有错误，则显示 Tab 和相关内容
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">我的单词本</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="list">单词列表</TabsTrigger>
          <TabsTrigger value="add">添加单词</TabsTrigger>
          <TabsTrigger value="review">复习单词</TabsTrigger>
        </TabsList>

        {/* 列出所有单词 */}
        <TabsContent value="list">
          {isLoading ? (
            <div className="text-center py-8">加载中...</div> // 加载状态
          ) : (
            <VocabularyList words={words} onWordDeleted={handleWordDeleted} /> // 显示单词列表
          )}
        </TabsContent>

        {/* 添加单词表单 */}
        <TabsContent value="add">
          <AddWordForm onWordAdded={handleWordAdded} /> // 添加单词表单
        </TabsContent>

        {/* 复习单词 */}
        <TabsContent value="review">
          <ReviewSession words={words} onComplete={handleReviewComplete} onMasteryUpdated={fetchWords} /> // 复习单词会话
        </TabsContent>
      </Tabs>
    </div>
  )
}
/*
主要功能解释：
初始化应用程序：包括初始化数据库和加载单词。
Tab 切换：使用 Tabs 组件切换“单词列表”、“添加单词”和“复习单词”视图。
错误处理：如果出现错误（如数据库无法初始化或加载失败），提供用户友好的错误提示并显示可能的解决方案。
加载状态：使用 isLoading 状态来显示加载进度。
复习和管理单词：提供添加、删除单词和复习功能，并通过 useState 更新 UI 状态。
*/

