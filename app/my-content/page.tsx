"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/sidebar"
import { Bell, Diamond, User } from "lucide-react"
import { ScrollButtons } from "@/Integration_modules/scroll-buttons"

export default function MyContentPage() {
  const router = useRouter()

  // 这些状态变量可以在未来连接到实际功能
  const [activeTab, setActiveTab] = useState<"proficiency" | "recent">("proficiency")

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="flex min-h-screen bg-gray-50">
        {/* 侧边栏 */}
        <Sidebar />

        {/* 主内容区域 */}
        <div className="flex-1 p-6">
          {/* 顶部导航栏 */}
          <div className="flex justify-end items-center mb-8">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" className="rounded-full">
                <Diamond className="h-5 w-5 text-yellow-400" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full bg-teal-500">
                <User className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>

          {/* 单词听写区域 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-medium">单词听写</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button
                variant={activeTab === "proficiency" ? "default" : "outline"}
                onClick={() => setActiveTab("proficiency")}
                className="min-w-[120px]"
              >
                按照熟练度
              </Button>
              <Button
                variant={activeTab === "recent" ? "default" : "outline"}
                onClick={() => setActiveTab("recent")}
                className="min-w-[120px]"
              >
                最近学习
              </Button>
            </CardContent>
          </Card>

          {/* 空白卡片区域 - 可以在未来添加内容 */}
          <Card className="mb-6">
            <CardContent className="h-24 flex items-center justify-center text-gray-400">
              内容区域（未来可添加实际内容）
            </CardContent>
          </Card>

          {/* 学习记录区域 */}
          <Card className="mb-6">
            <CardContent className="p-4 space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start h-12 text-base"
                onClick={() => router.push("/book/recent")}
              >
                近日学习
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12 text-base"
                onClick={() => router.push("/book/reviewed")}
              >
                全部已学
              </Button>
            </CardContent>
          </Card>

          {/* 生词本区域 */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start h-12 text-base"
                onClick={() => router.push("/personal-vocabulary")}
              >
                生词本
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 text-base opacity-50" disabled>
                功能待开发
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 text-base opacity-50" disabled>
                功能待开发
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 滚动按钮 */}
      <ScrollButtons />
    </ThemeProvider>
  )
}
