"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { User, UserCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { signInWithEmail, signUpWithEmail } from "@/services/auth-service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UserPageButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  buttonText?: string // 可自定义按钮文本
  showIcon?: boolean // 是否显示图标
  iconType?: "user" | "userCircle" // 可选择使用的图标类型
  onClick?: () => void // 可选的自定义点击处理函数
}

export function UserPageButton({
  variant = "outline",
  size = "default",
  className = "",
  buttonText = "个人中心",
  showIcon = true,
  iconType = "user",
  onClick,
}: UserPageButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("login")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [userData, setUserData] = useState<{
    email: string
    name?: string
  } | null>(null)

  // 检查用户是否已登录
  useEffect(() => {
    const checkLoginStatus = () => {
      const userDataStr = localStorage.getItem("userData")
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr)
          setUserData(userData)
          setIsLoggedIn(true)
        } catch (error) {
          console.error("Failed to parse user data:", error)
          localStorage.removeItem("userData")
        }
      }
    }

    checkLoginStatus()
  }, [])

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // 处理登录提交
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { email, password } = formData
      const result = await signInWithEmail(email, password)

      if (result.success) {
        // 保存用户数据到本地存储
        const userData = {
          email,
          name: email.split("@")[0], // 使用邮箱前缀作为默认名称
          ...result.data?.user,
        }
        localStorage.setItem("userData", JSON.stringify(userData))
        setUserData(userData)
        setIsLoggedIn(true)
        setOpen(false)

        toast({
          title: "登录成功",
          description: `欢迎回来，${userData.name || "用户"}！`,
        })
      } else {
        toast({
          title: "登录失败",
          description: result.message || "邮箱或密码错误",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "登录失败",
        description: "发生错误，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理注册提交
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证密码
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "密码不匹配",
        description: "请确保两次输入的密码相同",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { email, password } = formData
      const result = await signUpWithEmail(email, password)

      if (result.success) {
        toast({
          title: "注册成功",
          description: result.message || "请查收邮箱完成注册",
        })
        setActiveTab("login") // 切换到登录选项卡
      } else {
        toast({
          title: "注册失败",
          description: result.message || "注册过程中发生错误",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "注册失败",
        description: "发生错误，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理按钮点击
  const handleClick = () => {
    if (onClick) {
      // 如果提供了自定义点击处理函数，则使用它
      onClick()
    } else if (isLoggedIn) {
      // 如果已登录，导航到用户页面
      router.push("/User_page")
    } else {
      // 如果未登录，打开登录对话框
      setOpen(true)
    }
  }

  // 选择要显示的图标
  const IconComponent = iconType === "user" ? User : UserCircle

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`${className} ${showIcon ? "flex items-center gap-2" : ""}`}
        onClick={handleClick}
      >
        {showIcon && <IconComponent className={`h-4 w-4 ${isLoggedIn ? "text-blue-500" : ""}`} />}
        {size !== "icon" && buttonText}
      </Button>

      {/* 登录/注册对话框 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>用户账户</DialogTitle>
            <DialogDescription>登录或注册以访问更多功能。</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="register">注册</TabsTrigger>
            </TabsList>

            {/* 登录表单 */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="请输入邮箱"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="请输入密码"
                  />
                </div>
                <DialogFooter className="mt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "登录中..." : "登录"}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            {/* 注册表单 */}
            <TabsContent value="register">
              <form onSubmit={handleSignUp} className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="register-email">邮箱</Label>
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="请输入邮箱"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="register-password">密码</Label>
                  <Input
                    id="register-password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="请输入密码"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">确认密码</Label>
                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    placeholder="请再次输入密码"
                  />
                </div>
                <DialogFooter className="mt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "注册中..." : "注册"}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}

