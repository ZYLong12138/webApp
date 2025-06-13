"use client"

import { useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Sidebar } from "@/components/sidebar"
import { useTheme } from "@/contexts/theme-context"
import { ThemeSwitcherButton } from "@/Integration_modules/theme-switcher-button"

export default function SettingsPage() {
  const { theme } = useTheme()
  const [notifications, setNotifications] = useState(true)
  const [dailyGoal, setDailyGoal] = useState(50)
  const [autoPlay, setAutoPlay] = useState(true)

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="flex min-h-screen bg-background">
        {/* 侧边栏导航 */}
        <Sidebar />

        {/* 主内容区域 */}
        <main className="flex-1 p-6">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">设置</h1>

            {/* 主题设置 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>主题设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="theme">应用主题</Label>
                  <ThemeSwitcherButton />
                </div>
                <div className="text-sm text-muted-foreground">
                  当前主题: {theme === "simple" ? "简约" : theme === "dusk-rose" ? "黄昏玫瑰" : "晨风茉莉"}
                </div>
              </CardContent>
            </Card>

            {/* 学习设置 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>学习设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="daily-goal">每日学习目标 ({dailyGoal} 个单词)</Label>
                  <Slider
                    id="daily-goal"
                    min={10}
                    max={100}
                    step={5}
                    value={[dailyGoal]}
                    onValueChange={(value) => setDailyGoal(value[0])}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-play">自动播放发音</Label>
                  <Switch id="auto-play" checked={autoPlay} onCheckedChange={setAutoPlay} />
                </div>
              </CardContent>
            </Card>

            {/* 通知设置 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>通知设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications">学习提醒</Label>
                  <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
                </div>
              </CardContent>
            </Card>

            {/* 账户设置 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>账户设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  修改个人信息
                </Button>
                <Button variant="outline" className="w-full">
                  修改密码
                </Button>
                <Button variant="destructive" className="w-full">
                  退出登录
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}
