"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

// 定义可用的主题
export type ThemeName = "simple" | "dusk-rose" | "zephyr-jasmine"

// 主题上下文的类型
type ThemeContextType = {
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
}

// 创建主题上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// 主题提供者组件
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 从localStorage获取保存的主题，默认为"simple"
  const [theme, setTheme] = useState<ThemeName>("simple")

  // 在组件挂载时从localStorage加载主题
  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") as ThemeName
    if (savedTheme && (savedTheme === "simple" || savedTheme === "dusk-rose" || savedTheme === "zephyr-jasmine")) {
      setTheme(savedTheme)
    }
  }, [])

  // 当主题变化时，保存到localStorage并应用相应的CSS类
  useEffect(() => {
    localStorage.setItem("app-theme", theme)

    // 移除所有主题类
    document.documentElement.classList.remove("theme-simple", "theme-dusk-rose", "theme-zephyr-jasmine")

    // 添加当前主题类
    document.documentElement.classList.add(`theme-${theme}`)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

// 自定义钩子，用于在组件中访问主题
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

