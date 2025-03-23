"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { User, UserCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  })

  // 检查用户是否已登录（从localStorage读取状态）
  useEffect(() => {
    const loginStatus = localStorage.getItem("isLoggedIn")
    if (loginStatus === "true") {
      setIsLoggedIn(true)
    }
  }, [])

  // 处理登录表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // 处理登录提交
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)

    // 模拟登录过程（延迟以模拟网络请求）
    setTimeout(() => {
      // 无论输入什么都视为登录成功
      localStorage.setItem("isLoggedIn", "true")
      localStorage.setItem("username", loginForm.username || "用户")
      setIsLoggedIn(true)
      setOpen(false)

      toast({
        title: "登录成功",
        description: `欢迎回来，${loginForm.username || "用户"}！`,
      })

      setIsLoggingIn(false)
      setLoginForm({ username: "", password: "" })
    }, 1000)
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

      {/* 登录对话框 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>用户登录</DialogTitle>
            <DialogDescription>请输入您的账号和密码登录系统。</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  name="username"
                  value={loginForm.username}
                  onChange={handleInputChange}
                  placeholder="请输入用户名"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={loginForm.password}
                  onChange={handleInputChange}
                  placeholder="请输入密码"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoggingIn}>
                {isLoggingIn ? "登录中..." : "登录"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

