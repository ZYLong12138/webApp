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

// 持久化存储键
const STORAGE_KEYS = {
  ACTIVE_NOISES: "audio-active-noises",
  VOLUME: "audio-volume",
  IS_MUTED: "audio-is-muted",
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  // 从localStorage获取初始状态
  const getInitialActiveNoises = () => {
    if (typeof window === "undefined") return []
    const savedNoises = localStorage.getItem(STORAGE_KEYS.ACTIVE_NOISES)
    return savedNoises ? (JSON.parse(savedNoises) as NoiseType[]) : []
  }

  const getInitialVolume = () => {
    if (typeof window === "undefined") return 0.5
    const savedVolume = localStorage.getItem(STORAGE_KEYS.VOLUME)
    return savedVolume ? Number.parseFloat(savedVolume) : 0.5
  }

  const getInitialMuted = () => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(STORAGE_KEYS.IS_MUTED) === "true"
  }

  const [activeNoises, setActiveNoises] = useState<NoiseType[]>(getInitialActiveNoises)
  const [volume, setVolume] = useState(getInitialVolume)
  const [isMuted, setIsMuted] = useState(getInitialMuted)
  const [isAudioInitialized, setIsAudioInitialized] = useState(false)
  const [isAudioPreloaded, setIsAudioPreloaded] = useState(false)

  const audioRefs = useRef<Map<NoiseType, HTMLAudioElement>>(new Map())
  const audioLoaded = useRef<Set<NoiseType>>(new Set())
  const audioErrors = useRef<Set<NoiseType>>(new Set())
  const pendingPlay = useRef<Set<NoiseType>>(new Set())

  // 音频URL
  const noiseUrls = {
    rain: "/sounds/rain.mp3",
    river: "/sounds/sea.mp3", // 使用海浪声作为河流声
    thunder: "/sounds/thunder.mp3",
    fire: "/sounds/fire.mp3",
  }

  // 保存活跃噪音到localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_NOISES, JSON.stringify(activeNoises))
    }
  }, [activeNoises])

  // 保存音量设置到localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.VOLUME, volume.toString())
    }
  }, [volume])

  // 保存静音状态到localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.IS_MUTED, isMuted.toString())
    }
  }, [isMuted])

  // 预加载所有音频文件，但不播放
  const preloadAudio = () => {
    if (isAudioPreloaded) return

    const noiseTypes: NoiseType[] = ["rain", "river", "thunder", "fire"]

    try {
      // 预创建所有音频实例，但不自动播放
      noiseTypes.forEach((type) => {
        if (!audioRefs.current.has(type)) {
          console.log(`预加载 ${type} 音频...`)

          // 创建音频元素
          const audio = new Audio()
          audio.preload = "metadata"
          audio.loop = true
          audio.volume = volume
          audio.muted = isMuted
          audio.src = noiseUrls[type]

          // 添加事件监听器
          audio.addEventListener("canplaythrough", () => {
            audioLoaded.current.add(type)
            console.log(`${type} 音频加载成功`)

            // 如果这个噪音在等待播放队列中，开始播放
            if (pendingPlay.current.has(type)) {
              console.log(`开始播放之前等待的 ${type} 音频`)
              audio.play().catch((e) => {
                console.error(`播放 ${type} 音频失败:`, e)
              })
              pendingPlay.current.delete(type)
            }
          })

          audio.addEventListener("error", (e) => {
            const error = e as ErrorEvent
            audioErrors.current.add(type)
            console.error(`加载 ${type} 音频错误:`, error.message || "未知错误")
          })

          audioRefs.current.set(type, audio)
        }
      })

      setIsAudioPreloaded(true)
    } catch (error) {
      console.error("预加载音频错误:", error)
    }
  }

  // 初始化音频 - 仅在用户交互后调用
  const initializeAudio = () => {
    if (isAudioInitialized) return

    // 预加载音频
    preloadAudio()

    // 恢复之前活跃的噪音
    if (activeNoises.length > 0) {
      console.log("恢复之前活跃的噪音:", activeNoises)

      activeNoises.forEach((type) => {
        const audio = audioRefs.current.get(type)
        if (audio) {
          if (audioLoaded.current.has(type)) {
            // 如果音频已加载，直接播放
            audio.play().catch((e) => {
              console.error(`恢复播放 ${type} 音频失败:`, e)
            })
          } else {
            // 如果音频尚未加载，添加到等待队列
            pendingPlay.current.add(type)
          }
        }
      })
    }

    setIsAudioInitialized(true)
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
        console.log(`开始播放 ${type} 音频`)

        // 检查音频是否已加载
        if (audioLoaded.current.has(type)) {
          // 尝试播放
          try {
            const playPromise = audio.play()
            if (playPromise !== undefined) {
              playPromise.catch((e) => {
                console.error(`播放 ${type} 音频失败:`, e)

                // 尝试重新加载并播放
                setTimeout(() => {
                  audio.load()
                  audio.play().catch((e2) => {
                    console.error(`第二次尝试播放 ${type} 音频失败:`, e2)
                  })
                }, 100)
              })
            }
          } catch (error) {
            console.error(`播放 ${type} 音频错误:`, error)
          }
        } else {
          // 如果音频尚未加载，添加到等待队列
          console.log(`${type} 音频尚未加载，添加到等待队列`)
          pendingPlay.current.add(type)
        }
      }
      // 如果不应该播放但当前正在播放
      else if (!currentNoiseSet.has(type) && !audio.paused) {
        console.log(`停止 ${type} 音频`)
        try {
          audio.pause()
        } catch (error) {
          console.error(`暂停 ${type} 音频错误:`, error)
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
        console.error("设置音频音量错误:", error)
      }
    })
  }, [volume, isMuted, isAudioInitialized])

  // 清理函数 - 在组件卸载时执行
  useEffect(() => {
    return () => {
      // 在卸载前保存活跃噪音到sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.setItem("activeNoises", JSON.stringify(activeNoises))
      }

      audioRefs.current.forEach((audio, type) => {
        try {
          // 不暂停音频，以允许持续播放
          // 只清理blob URL
          if (audio.src.startsWith("blob:")) {
            URL.revokeObjectURL(audio.src)
          }
        } catch (error) {
          console.error(`清理 ${type} 音频错误:`, error)
        }
      })
    }
  }, [activeNoises])

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
