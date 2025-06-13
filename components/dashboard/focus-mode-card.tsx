"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Droplets, Waves, Zap, Flame, VolumeX, Volume2 } from "lucide-react"
import { useAudio } from "@/contexts/audio-context"

interface FocusModeCardProps {
  title: string
  children?: React.ReactNode
  showMusicControls?: boolean
}

export function FocusModeCard({ title, children, showMusicControls = false }: FocusModeCardProps) {
  // 使用全局音频上下文
  const {
    activeNoises,
    toggleNoise,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    isNoiseActive,
    isAudioInitialized,
    initializeAudio,
  } = useAudio()

  // 确保按钮点击时初始化音频
  const handleNoiseToggle = (type: string) => {
    // 确保在用户交互时初始化音频
    if (!isAudioInitialized) {
      initializeAudio()
    }
    toggleNoise(type as any)
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <h3 className="font-medium mb-3">{title}</h3>
        <div className="flex flex-col space-y-3">
          {showMusicControls && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-8 w-8 ${isNoiseActive("rain") ? "bg-blue-100 text-blue-600" : ""}`}
                    onClick={() => handleNoiseToggle("rain")}
                    title="雨声"
                  >
                    <Droplets size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-8 w-8 ${isNoiseActive("river") ? "bg-blue-100 text-blue-600" : ""}`}
                    onClick={() => handleNoiseToggle("river")}
                    title="河流声"
                  >
                    <Waves size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-8 w-8 ${isNoiseActive("thunder") ? "bg-blue-100 text-blue-600" : ""}`}
                    onClick={() => handleNoiseToggle("thunder")}
                    title="雷声"
                  >
                    <Zap size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-8 w-8 ${isNoiseActive("fire") ? "bg-blue-100 text-blue-600" : ""}`}
                    onClick={() => handleNoiseToggle("fire")}
                    title="火声"
                  >
                    <Flame size={16} />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleMute}
                  disabled={activeNoises.length === 0}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </Button>
              </div>

              {activeNoises.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs">音量</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(Number.parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}
            </>
          )}

          {children && <div className={showMusicControls ? "mt-2" : ""}>{children}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
