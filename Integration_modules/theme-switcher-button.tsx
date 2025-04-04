"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Palette, Sun, Moon, Wind } from "lucide-react"
import { useTheme, type ThemeName } from "@/contexts/theme-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ThemeSwitcherButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showIcon?: boolean
}

export function ThemeSwitcherButton({
  variant = "outline",
  size = "default",
  className = "",
  showIcon = true,
}: ThemeSwitcherButtonProps) {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  // 主题选项
  const themes: { name: ThemeName; label: string; icon: React.ReactNode }[] = [
    {
      name: "simple",
      label: "简约",
      icon: <Sun className="h-4 w-4 mr-2" />,
    },
    {
      name: "dusk-rose",
      label: "黄昏玫瑰",
      icon: <Moon className="h-4 w-4 mr-2" />,
    },
    {
      name: "zephyr-jasmine",
      label: "晨风茉莉",
      icon: <Wind className="h-4 w-4 mr-2" />,
    },
  ]

  // 切换主题
  const handleThemeChange = (newTheme: ThemeName) => {
    setTheme(newTheme)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={`${className} ${showIcon ? "flex items-center gap-2" : ""}`}>
          {showIcon && <Palette className="h-4 w-4" />}
          {size !== "icon" && "主题"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {themes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.name}
            className={`flex items-center cursor-pointer ${
              theme === themeOption.name ? "bg-accent text-accent-foreground" : ""
            }`}
            onClick={() => handleThemeChange(themeOption.name)}
          >
            {themeOption.icon}
            {themeOption.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

