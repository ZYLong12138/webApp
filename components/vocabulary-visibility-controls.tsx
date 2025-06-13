"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { EyeOff, Eye, Volume2, VolumeX, BookText, BookX } from "lucide-react"

interface VisibilityControlsProps {
  onToggleWord: (visible: boolean) => void
  onTogglePronunciation: (visible: boolean) => void
  onToggleDefinition: (visible: boolean) => void
}

export function VocabularyVisibilityControls({
  onToggleWord,
  onTogglePronunciation,
  onToggleDefinition,
}: VisibilityControlsProps) {
  const [wordVisible, setWordVisible] = useState(true)
  const [pronunciationVisible, setPronunciationVisible] = useState(true)
  const [definitionVisible, setDefinitionVisible] = useState(true)

  // 切换单词可见性 - 使用 useCallback 优化性能
  const toggleWordVisibility = useCallback(() => {
    const newState = !wordVisible
    setWordVisible(newState)
    // 立即调用回调函数，不等待状态更新
    onToggleWord(newState)
  }, [wordVisible, onToggleWord])

  // 切换音标可见性
  const togglePronunciationVisibility = useCallback(() => {
    const newState = !pronunciationVisible
    setPronunciationVisible(newState)
    onTogglePronunciation(newState)
  }, [pronunciationVisible, onTogglePronunciation])

  // 切换定义可见性
  const toggleDefinitionVisibility = useCallback(() => {
    const newState = !definitionVisible
    setDefinitionVisible(newState)
    onToggleDefinition(newState)
  }, [definitionVisible, onToggleDefinition])

  return (
    <div className="fixed right-4 top-1/3 flex flex-col gap-2 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full shadow-md ${!wordVisible ? "bg-blue-100" : "bg-white"}`}
              onClick={toggleWordVisibility}
            >
              {wordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{wordVisible ? "隐藏单词" : "显示单词"}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full shadow-md ${!pronunciationVisible ? "bg-blue-100" : "bg-white"}`}
              onClick={togglePronunciationVisibility}
            >
              {pronunciationVisible ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{pronunciationVisible ? "隐藏音标" : "显示音标"}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full shadow-md ${!definitionVisible ? "bg-blue-100" : "bg-white"}`}
              onClick={toggleDefinitionVisibility}
            >
              {definitionVisible ? <BookX className="h-4 w-4" /> : <BookText className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{definitionVisible ? "隐藏释义" : "显示释义"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
