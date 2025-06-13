"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef } from "react"

export type NoiseType = "rain" | "river" | "thunder" | "fire"

interface AudioContextType {
  activeNoises: NoiseType[]
  toggleNoise: (type: NoiseType) => void
  volume: number
  setVolume: (volume: number) => void
  isMuted: boolean
  toggleMute: () => void
  isNoiseActive: (type: NoiseType) => boolean
  isAudioInitialized: boolean
  initializeAudio: () => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [activeNoises, setActiveNoises] = useState<NoiseType[]>([])
  const [volume, setVolume] = useState(0.5)
  const [isMuted, setIsMuted] = useState(false)
  const [isAudioInitialized, setIsAudioInitialized] = useState(false)
  const audioRefs = useRef<Map<NoiseType, HTMLAudioElement>>(new Map())
  const audioLoaded = useRef<Set<NoiseType>>(new Set())
  const audioErrors = useRef<Set<NoiseType>>(new Set())

  // 音频URL
  const noiseUrls = {
    rain: "/sounds/rain.mp3",
    river: "/sounds/sea.mp3", // 使用海浪声作为河流声
    thunder: "/sounds/thunder.mp3",
    fire: "/sounds/fire.mp3",
  }

  // 初始化音频 - 仅在用户交互后调用
  const initializeAudio = () => {
    if (isAudioInitialized) return

    const noiseTypes: NoiseType[] = ["rain", "river", "thunder", "fire"]

    try {
      // 预创建所有音频实例，但不自动播放
      noiseTypes.forEach((type) => {
        if (!audioRefs.current.has(type)) {
          console.log(`Initializing ${type} audio...`)

          // 检查文件是否存在
          fetch(noiseUrls[type])
            .then((response) => {
              if (!response.ok) {
                throw new Error(`Failed to fetch ${type} audio: ${response.status} ${response.statusText}`)
              }
              return response.blob()
            })
            .then((blob) => {
              // 文件存在，创建音频元素
              const audio = new Audio()
              audio.loop = true
              audio.volume = volume

              // 使用 URL.createObjectURL 创建本地 URL
              const audioUrl = URL.createObjectURL(blob)
              audio.src = audioUrl

              // 添加事件监听器
              audio.addEventListener("canplaythrough", () => {
                audioLoaded.current.add(type)
                console.log(`${type} audio loaded successfully`)
              })

              audio.addEventListener("error", (e) => {
                const error = e as ErrorEvent
                audioErrors.current.add(type)
                console.error(`Error loading ${type} audio:`, error.message || "Unknown error")
              })

              // 添加自动恢复播放的处理
              audio.addEventListener("pause", () => {
                // 如果这个音频应该在播放但被意外暂停了
                if (activeNoises.includes(type) && !audio.ended && !isMuted) {
                  console.log(`${type} audio paused unexpectedly, attempting to resume`)

                  // 用户交互后尝试恢复播放
                  setTimeout(() => {
                    const playPromise = audio.play()
                    if (playPromise !== undefined) {
                      playPromise.catch((e) => {
                        console.error(`Failed to resume ${type} audio:`, e)
                      })
                    }
                  }, 100)
                }
              })

              audioRefs.current.set(type, audio)
            })
            .catch((error) => {
              console.error(`Error initializing ${type} audio:`, error)
            })
        }
      })

      setIsAudioInitialized(true)
    } catch (error) {
      console.error("Error initializing audio:", error)
    }
  }

  // 处理活跃噪音变化 - 只控制播放/暂停，不重新创建音频实例
  useEffect(() => {
    if (!isAudioInitialized) return

    // 获取当前应该播放的噪音类型集合
    const currentNoiseSet = new Set(activeNoises)

    // 遍历所有音频实例
    audioRefs.current.forEach((audio, type) => {
      // 如果应该播放但当前没有播放
      if (currentNoiseSet.has(type) && audio.paused) {
        console.log(`Starting ${type} audio`)

        // 尝试播放
        try {
          const playPromise = audio.play()
          if (playPromise !== undefined) {
            playPromise.catch((e) => {
              console.error(`Failed to play ${type} audio:`, e)

              // 尝试重新加载并播放
              setTimeout(() => {
                audio.load()
                audio.play().catch((e2) => {
                  console.error(`Second attempt to play ${type} audio failed:`, e2)
                })
              }, 100)
            })
          }
        } catch (error) {
          console.error(`Error playing ${type} audio:`, error)
        }
      }
      // 如果不应该播放但当前正在播放
      else if (!currentNoiseSet.has(type) && !audio.paused) {
        console.log(`Stopping ${type} audio`)
        try {
          audio.pause()
        } catch (error) {
          console.error(`Error pausing ${type} audio:`, error)
        }
      }
    })
  }, [activeNoises, isAudioInitialized])

  // 处理音量变化 - 应用到所有音频实例
  useEffect(() => {
    if (!isAudioInitialized) return

    audioRefs.current.forEach((audio) => {
      try {
        audio.volume = isMuted ? 0 : volume
      } catch (error) {
        console.error("Error setting audio volume:", error)
      }
    })
  }, [volume, isMuted, isAudioInitialized])

  // 清理函数 - 在组件卸载时执行
  useEffect(() => {
    return () => {
      audioRefs.current.forEach((audio, type) => {
        try {
          audio.pause()
          if (audio.src.startsWith("blob:")) {
            URL.revokeObjectURL(audio.src)
          }
        } catch (error) {
          console.error(`Error cleaning up ${type} audio:`, error)
        }
      })
      audioRefs.current.clear()
      audioLoaded.current.clear()
      audioErrors.current.clear()
    }
  }, [])

  // 切换噪音类型
  const toggleNoise = (type: NoiseType) => {
    // 确保音频已初始化
    if (!isAudioInitialized) {
      initializeAudio()
    }

    setActiveNoises((prev) => {
      // 如果已经激活，则移除
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type)
      }
      // 否则添加到激活列表
      return [...prev, type]
    })
  }

  // 切换静音
  const toggleMute = () => {
    setIsMuted((prev) => !prev)
  }

  // 检查噪音是否激活
  const isNoiseActive = (type: NoiseType) => activeNoises.includes(type)

  // 提供上下文值
  const contextValue: AudioContextType = {
    activeNoises,
    toggleNoise,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    isNoiseActive,
    isAudioInitialized,
    initializeAudio,
  }

  return <AudioContext.Provider value={contextValue}>{children}</AudioContext.Provider>
}

// 自定义钩子，用于在组件中访问音频上下文
export function useAudio() {
  const context = useContext(AudioContext)
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider")
  }
  return context
}
