"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Layers } from "lucide-react"
import { LevelSelectionModal } from "@/components/level-selection-modal"

interface LevelSelectionButtonProps {
  bookId: string
  bookName: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  buttonText?: string
  showIcon?: boolean
  onLevelSelect: (level: number) => void
}

export function LevelSelectionButton({
  bookId,
  bookName,
  variant = "outline",
  size = "default",
  className = "",
  buttonText = "选择关卡",
  showIcon = true,
  onLevelSelect,
}: LevelSelectionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`${className} ${showIcon ? "flex items-center gap-2" : ""}`}
        onClick={handleOpenModal}
      >
        {showIcon && <Layers className="h-4 w-4" />}
        {buttonText}
      </Button>

      <LevelSelectionModal
        bookId={bookId}
        bookName={bookName}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onLevelSelect={onLevelSelect}
      />
    </>
  )
}

