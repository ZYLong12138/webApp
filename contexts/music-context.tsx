"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { type MusicTrack, defaultPlaylist } from "@/data/music-library"

interface MusicContextType {
  playlist: MusicTrack[]
  currentSongIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  playbackMode: PlaybackMode
  setPlaylist: (songs: MusicTrack[]) => void
  setCurrentSongIndex: (index: number) => void
  togglePlay: () => void
  play: () => void
  pause: () => void
  next: () => void
  previous: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  addSong: (song: MusicTrack) => void
  removeSong: (id: string) => void
  setPlaybackMode: (mode: PlaybackMode) => void
  cyclePlaybackMode: () => void
}

export type PlaybackMode = "sequential" | "random" | "repeat"

const MusicContext = createContext<MusicContextType | undefined>(undefined)

// 创建一个单例音频元素，在渲染之间保持状态
let globalAudioElement: HTMLAudioElement | null = null

if (typeof window !== "undefined" && !globalAudioElement) {
  globalAudioElement = new Audio()
  globalAudioElement.preload = "metadata"
}

// 持久化存储键
const STORAGE_KEYS = {
  CURRENT_SONG_INDEX: "music-player-current-song-index",
  CURRENT_TIME: "music-player-current-time",
  IS_PLAYING: "music-player-is-playing",
  VOLUME: "music-player-volume",
  IS_MUTED: "music-player-is-muted",
  PLAYBACK_MODE: "music-player-playback-mode",
}

export function MusicProvider({ children }: { children: ReactNode }) {
  // 从localStorage获取初始状态
  const getInitialState = () => {
    if (typeof window === "undefined") return 0
    const savedIndex = localStorage.getItem(STORAGE_KEYS.CURRENT_SONG_INDEX)
    return savedIndex ? Number.parseInt(savedIndex, 10) : 0
  }

  const getInitialVolume = () => {
    if (typeof window === "undefined") return 0.7
    const savedVolume = localStorage.getItem(STORAGE_KEYS.VOLUME)
    return savedVolume ? Number.parseFloat(savedVolume) : 0.7
  }

  const getInitialMuted = () => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(STORAGE_KEYS.IS_MUTED) === "true"
  }

  const getInitialPlaybackMode = () => {
    if (typeof window === "undefined") return "sequential" as PlaybackMode
    const mode = localStorage.getItem(STORAGE_KEYS.PLAYBACK_MODE)
    return (mode as PlaybackMode) || "sequential"
  }

  // 使用从外部文件导入的默认播放列表
  const [playlist, setPlaylist] = useState<MusicTrack[]>(defaultPlaylist)
  const [currentSongIndex, setCurrentSongIndex] = useState(getInitialState)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(getInitialVolume)
  const [isMuted, setIsMuted] = useState(getInitialMuted)
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(getInitialPlaybackMode)
  const [isInitialized, setIsInitialized] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isChangingSong = useRef(false)
  const durationRef = useRef<number>(0)

  // 保存当前歌曲索引到localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SONG_INDEX, currentSongIndex.toString())
    }
  }, [currentSongIndex])

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

  // 保存播放模式到localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.PLAYBACK_MODE, playbackMode)
    }
  }, [playbackMode])

  // 初始化音频
  useEffect(() => {
    if (!globalAudioElement) return

    audioRef.current = globalAudioElement

    // 设置事件监听器
    const handleLoadedMetadata = () => {
      // 修复Bug 1: 确保正确获取并保存歌曲时长
      if (globalAudioElement && !isNaN(globalAudioElement.duration) && globalAudioElement.duration > 0) {
        durationRef.current = globalAudioElement.duration
        setDuration(globalAudioElement.duration)
        console.log(`歌曲加载完成，时长: ${globalAudioElement.duration}秒`)
      } else {
        console.warn("无法获取歌曲时长或时长无效")
      }

      // 如果是切换歌曲，自动开始播放
      if (isChangingSong.current) {
        globalAudioElement!.play().catch((err) => {
          console.error("播放音频失败:", err)
        })
        isChangingSong.current = false
      }
    }

    const handleDurationChange = () => {
      // 当duration变化时更新状态
      if (globalAudioElement && !isNaN(globalAudioElement.duration) && globalAudioElement.duration > 0) {
        durationRef.current = globalAudioElement.duration
        setDuration(globalAudioElement.duration)
        console.log(`歌曲时长更新: ${globalAudioElement.duration}秒`)
      }
    }

    // 修复Bug 2: 根据播放模式处理歌曲结束事件
    const handleEnded = () => {
      console.log(`歌曲结束，当前播放模式: ${playbackMode}`)

      if (playbackMode === "repeat") {
        // 单曲循环：重新播放当前歌曲
        if (globalAudioElement) {
          globalAudioElement.currentTime = 0
          globalAudioElement.play().catch((err) => {
            console.error("重新播放当前歌曲失败:", err)
          })
        }
      } else if (playbackMode === "random" && playlist.length > 1) {
        // 随机播放：随机选择一首不是当前歌曲的歌曲
        let randomIndex
        do {
          randomIndex = Math.floor(Math.random() * playlist.length)
        } while (randomIndex === currentSongIndex && playlist.length > 1)

        setCurrentSongIndex(randomIndex)
      } else {
        // 顺序播放：播放下一首
        const newIndex = (currentSongIndex + 1) % playlist.length
        setCurrentSongIndex(newIndex)
      }
    }

    const handlePlay = () => {
      setIsPlaying(true)
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.IS_PLAYING, "true")
      }
    }

    const handlePause = () => {
      setIsPlaying(false)
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.IS_PLAYING, "false")
      }
    }

    const handleTimeUpdate = () => {
      if (globalAudioElement) {
        setCurrentTime(globalAudioElement.currentTime)

        // 如果duration丢失，尝试从引用中恢复
        if (duration === 0 && durationRef.current > 0) {
          setDuration(durationRef.current)
        }

        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, globalAudioElement.currentTime.toString())
        }
      }
    }

    globalAudioElement.addEventListener("loadedmetadata", handleLoadedMetadata)
    globalAudioElement.addEventListener("durationchange", handleDurationChange)
    globalAudioElement.addEventListener("ended", handleEnded)
    globalAudioElement.addEventListener("play", handlePlay)
    globalAudioElement.addEventListener("pause", handlePause)
    globalAudioElement.addEventListener("timeupdate", handleTimeUpdate)

    // 如果需要，加载初始歌曲
    if (!isInitialized && playlist.length > 0) {
      const currentSong = playlist[currentSongIndex]
      if (currentSong && (!globalAudioElement.src || !globalAudioElement.src.includes(currentSong.audioUrl))) {
        globalAudioElement.src = currentSong.audioUrl
        globalAudioElement.load()

        // 恢复上次的播放位置
        const savedTime = localStorage.getItem(STORAGE_KEYS.CURRENT_TIME)
        if (savedTime) {
          const time = Number.parseFloat(savedTime)
          if (!isNaN(time) && time > 0) {
            globalAudioElement.currentTime = time
          }
        }

        // 如果上次是播放状态，则自动播放
        const wasPlaying = localStorage.getItem(STORAGE_KEYS.IS_PLAYING) === "true"
        if (wasPlaying) {
          globalAudioElement.play().catch((err) => {
            console.error("恢复播放失败:", err)
          })
        }
      }

      setIsInitialized(true)
    }

    // 同步状态
    setIsPlaying(!globalAudioElement.paused)
    setCurrentTime(globalAudioElement.currentTime)

    // 确保duration正确设置
    if (globalAudioElement.duration && !isNaN(globalAudioElement.duration)) {
      durationRef.current = globalAudioElement.duration
      setDuration(globalAudioElement.duration)
    }

    setVolume(globalAudioElement.volume)
    setIsMuted(globalAudioElement.muted)

    // 清理
    return () => {
      if (globalAudioElement) {
        globalAudioElement.removeEventListener("loadedmetadata", handleLoadedMetadata)
        globalAudioElement.removeEventListener("durationchange", handleDurationChange)
        globalAudioElement.removeEventListener("ended", handleEnded)
        globalAudioElement.removeEventListener("play", handlePlay)
        globalAudioElement.removeEventListener("pause", handlePause)
        globalAudioElement.removeEventListener("timeupdate", handleTimeUpdate)
      }
    }
  }, [isInitialized, playlist, playbackMode, currentSongIndex, duration])

  // 当当前歌曲改变时更新音频源
  useEffect(() => {
    if (!audioRef.current || playlist.length === 0 || !isInitialized) return

    const currentSong = playlist[currentSongIndex]

    // 只有当源不同时才更改
    if (audioRef.current.src !== currentSong.audioUrl) {
      isChangingSong.current = true
      audioRef.current.src = currentSong.audioUrl
      audioRef.current.load()

      // 自动播放新选择的歌曲
      audioRef.current.play().catch((err) => {
        console.error("播放音频失败:", err)
        isChangingSong.current = false
      })

      // 更新播放状态
      setIsPlaying(true)
    }
  }, [playlist, currentSongIndex, isInitialized])

  // 处理音量变化
  useEffect(() => {
    if (!audioRef.current) return

    audioRef.current.volume = volume
    audioRef.current.muted = isMuted
  }, [volume, isMuted])

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch((err) => {
        console.error("播放音频失败:", err)
      })
    }
  }

  const play = () => {
    if (!audioRef.current) return

    audioRef.current.play().catch((err) => {
      console.error("播放音频失败:", err)
    })
  }

  const pause = () => {
    if (!audioRef.current) return

    audioRef.current.pause()
  }

  const next = () => {
    if (playlist.length <= 1) return

    // 根据播放模式决定下一首歌
    if (playbackMode === "random") {
      // 随机模式：随机选择一首不是当前歌曲的歌曲
      let randomIndex
      do {
        randomIndex = Math.floor(Math.random() * playlist.length)
      } while (randomIndex === currentSongIndex && playlist.length > 1)

      setCurrentSongIndex(randomIndex)
    } else {
      // 顺序模式：播放下一首
      const newIndex = (currentSongIndex + 1) % playlist.length
      setCurrentSongIndex(newIndex)
    }
  }

  const previous = () => {
    if (playlist.length <= 1) return

    // 根据播放模式决定上一首歌
    if (playbackMode === "random") {
      // 随机模式：随机选择一首不是当前歌曲的歌曲
      let randomIndex
      do {
        randomIndex = Math.floor(Math.random() * playlist.length)
      } while (randomIndex === currentSongIndex && playlist.length > 1)

      setCurrentSongIndex(randomIndex)
    } else {
      // 顺序模式：播放上一首
      const newIndex = (currentSongIndex - 1 + playlist.length) % playlist.length
      setCurrentSongIndex(newIndex)
    }
  }

  const seek = (time: number) => {
    if (!audioRef.current) return

    audioRef.current.currentTime = time
    setCurrentTime(time)

    // 更新localStorage中的时间
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, time.toString())
    }
  }

  const toggleMute = () => {
    if (!audioRef.current) return

    const newMutedState = !isMuted
    audioRef.current.muted = newMutedState
    setIsMuted(newMutedState)
  }

  const addSong = (song: MusicTrack) => {
    setPlaylist((prev) => [...prev, song])
  }

  const removeSong = (id: string) => {
    setPlaylist((prev) => {
      const newPlaylist = prev.filter((song) => song.id !== id)

      // 如果需要，调整当前歌曲索引
      if (currentSongIndex >= newPlaylist.length) {
        setCurrentSongIndex(Math.max(0, newPlaylist.length - 1))
      }

      return newPlaylist
    })
  }

  const cyclePlaybackMode = () => {
    setPlaybackMode((prev) => {
      if (prev === "sequential") return "random"
      if (prev === "random") return "repeat"
      return "sequential"
    })
  }

  return (
    <MusicContext.Provider
      value={{
        playlist,
        currentSongIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        playbackMode,
        setPlaylist,
        setCurrentSongIndex,
        togglePlay,
        play,
        pause,
        next,
        previous,
        seek,
        setVolume,
        toggleMute,
        addSong,
        removeSong,
        setPlaybackMode,
        cyclePlaybackMode,
      }}
    >
      {children}
    </MusicContext.Provider>
  )
}

export function useMusic() {
  const context = useContext(MusicContext)
  if (context === undefined) {
    throw new Error("useMusic 必须在 MusicProvider 内部使用")
  }
  return context
}
