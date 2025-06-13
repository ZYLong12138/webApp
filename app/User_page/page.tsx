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
  const [userData, setUserData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 从localStorage获取用户数据
  useEffect(() => {
    const getUserData = () => {
      setIsLoading(true)
      const userDataStr = localStorage.getItem("userData")

      if (userDataStr) {
        try {
          const parsedUserData = JSON.parse(userDataStr)
          setUserData(parsedUserData)
        } catch (error) {
          console.error("Failed to parse user data:", error)
          localStorage.removeItem("userData")
          router.push("/")
        }
      } else {
        // 未登录，重定向到首页
        router.push("/")
      }

      setIsLoading(false)
    }

    getUserData()
  }, [router])

  // 处理退出登录
  const handleLogout = () => {
    localStorage.removeItem("userData")

    toast({
      title: "已退出登录",
      description: "您已成功退出登录",
    })

    router.push("/")
  }

  // 如果正在加载或没有用户数据，显示加载状态
  if (isLoading || !userData) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
          <p>加载中...</p>
        </div>
      </ThemeProvider>
    )
  }

  // 扩展用户数据，添加默认值
  const enhancedUserData = {
    ...userData,
    isMember: userData.isMember || false,
    currentBook: userData.currentBook || {
      id: "my-vocabulary",
      title: "我的单词本",
      wordCount: 0,
    },
    streakDays: userData.streakDays || 0,
    joinDate: userData.joinDate || new Date().toLocaleDateString("zh-CN"),
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="min-h-screen bg-gray-50 p-4">
        {/* Top navigation */}
        <div className="container mx-auto max-w-4xl flex justify-between items-center mb-6">
          <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Main content */}
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold mb-6 text-center">用户信息</h1>

          <div className="max-w-4xl mx-auto">
            <UserForm userData={enhancedUserData} />
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
