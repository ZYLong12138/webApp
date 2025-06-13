import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "../design/themes.css" // 添加主题CSS
import { ThemeProvider } from "@/contexts/theme-context" // 导入主题提供者
import { AudioProvider } from "@/contexts/audio-context" // 导入音频提供者
import { PomodoroTimer } from "@/components/pomodoro/pomodoro-timer" // 导入番茄时钟组件

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "VocabMaster - 词汇学习助手",
  description: "一个帮助你学习和记忆词汇的应用",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <ThemeProvider>
          <AudioProvider>
            {children}
            <PomodoroTimer />
          </AudioProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
