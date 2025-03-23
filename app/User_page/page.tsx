"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings, LogOut } from "lucide-react"
import { UserForm } from "@/components/user-form"
import { useToast } from "@/hooks/use-toast"

export default function UserPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [username, setUsername] = useState("用户")

  // 从localStorage获取用户名
  useEffect(() => {
    const storedUsername = localStorage.getItem("username")
    if (storedUsername) {
      setUsername(storedUsername)
    }

    // 检查用户是否已登录，如果未登录则重定向到首页
    const isLoggedIn = localStorage.getItem("isLoggedIn")
    if (isLoggedIn !== "true") {
      router.push("/")
    }
  }, [router])

  // 处理退出登录
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("username")

    toast({
      title: "已退出登录",
      description: "您已成功退出登录",
    })

    router.push("/")
  }

  // Mock user data - in a real app, this would come from an API or context
  const userData = {
    username: username,
    avatarUrl: "/placeholder.svg?height=100&width=100",
    isMember: true,
    currentBook: {
      id: "gre-vocab",
      title: "我的单词本",
      wordCount: 42,
    },
    streakDays: 7,
    joinDate: "2023年3月15日",
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="min-h-screen bg-gray-50 p-4">
        {/* Top navigation */}
        <div className="container mx-auto max-w-4xl flex justify-between items-center mb-6">
          <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.push("/book_select")}>
            <ArrowLeft className="h-4 w-4" />
            返回词书选择
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Main content */}
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold mb-6 text-center">用户信息</h1>

          <div className="max-w-4xl mx-auto">
            <UserForm
              username={userData.username}
              avatarUrl={userData.avatarUrl}
              isMember={userData.isMember}
              currentBook={userData.currentBook}
              streakDays={userData.streakDays}
              joinDate={userData.joinDate}
            />
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </Button>
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}

