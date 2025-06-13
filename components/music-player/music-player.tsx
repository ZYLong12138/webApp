"use client"

import { useState, useRef, useEffect } from "react"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  List,
  ChevronRight,
  ChevronLeft,
  Repeat,
  Repeat1,
  Shuffle,
  X,
} from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useMusic } from "@/contexts/music-context"
import "./music-player.css"

// 持久化存储键
const STORAGE_KEYS = {
  EXPANDED: "music-player-expanded",
}

export function MusicPlayer() {
  // 从localStorage获取初始状态
  const getInitialExpanded = () => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(STORAGE_KEYS.EXPANDED) === "true"
  }

  const [expanded, setExpanded] = useState(getInitialExpanded)
  const [showPlaylist, setShowPlaylist] = useState(false)

  const {
    playlist,
    currentSongIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackMode,
    togglePlay,
    previous,
    next,
    seek,
    setVolume,
    toggleMute,
    setCurrentSongIndex,
    cyclePlaybackMode,
  } = useMusic()

  const currentSong = playlist[currentSongIndex]
  const playlistRef = useRef<HTMLDivElement>(null)

  // 保存展开状态到localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.EXPANDED, expanded.toString())
    }
  }, [expanded])

  // 点击外部时关闭播放列表
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (playlistRef.current && !playlistRef.current.contains(event.target as Node)) {
        setShowPlaylist(false)
      }
    }

    if (showPlaylist) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showPlaylist])

  const handleProgressChange = (value: number[]) => {
    seek(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
  }

  const toggleExpand = () => {
    setExpanded(!expanded)
    if (!expanded) {
      setShowPlaylist(false)
    }
  }

  const togglePlaylist = () => {
    setShowPlaylist(!showPlaylist)
  }

  // 格式化时间为 MM:SS
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "00:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // 渲染播放模式图标
  const renderPlaybackModeIcon = () => {
    switch (playbackMode) {
      case "sequential":
        return <Repeat size={20} />
      case "random":
        return <Shuffle size={20} />
      case "repeat":
        return <Repeat1 size={20} />
    }
  }

  return (
    <div className={cn("music-player-container", expanded ? "expanded" : "collapsed")}>
      <div className="album-cover" onClick={expanded ? undefined : togglePlay}>
        <img
          src={currentSong?.coverUrl || "/placeholder.svg?height=80&width=80&query=music"}
          alt={currentSong?.title || "专辑封面"}
        />
        {!expanded && (
          <div className="play-overlay">
            {isPlaying ? (
              <Pause
                className="play-icon"
                onClick={(e) => {
                  e.stopPropagation()
                  togglePlay()
                }}
              />
            ) : (
              <Play
                className="play-icon"
                onClick={(e) => {
                  e.stopPropagation()
                  togglePlay()
                }}
              />
            )}
          </div>
        )}
      </div>

      {expanded && (
        <div className="player-controls">
          <div className="song-info">
            <h3 className="song-title">{currentSong?.title || "未加载歌曲"}</h3>
            <p className="song-artist">{currentSong?.artist || ""}</p>
          </div>

          <div className="progress-container">
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={0.1}
              onValueChange={handleProgressChange}
              aria-label="歌曲进度"
            />
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="control-row">
            <div className="control-buttons">
              <button onClick={previous} aria-label="上一首">
                <SkipBack size={20} />
              </button>
              <button onClick={togglePlay} aria-label={isPlaying ? "暂停" : "播放"}>
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button onClick={next} aria-label="下一首">
                <SkipForward size={20} />
              </button>
            </div>

            <div className="volume-controls">
              <button onClick={toggleMute} aria-label={isMuted ? "取消静音" : "静音"}>
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <Slider
                value={[isMuted ? 0 : volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="volume-slider"
                aria-label="音量"
              />
            </div>

            <div className="playback-controls">
              <button onClick={cyclePlaybackMode} aria-label={`播放模式: ${playbackMode}`}>
                {renderPlaybackModeIcon()}
              </button>
              <button onClick={togglePlaylist} aria-label="显示播放列表">
                <List size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 侧边控制展开/收起 */}
      <button className="side-edge-control" onClick={toggleExpand} aria-label={expanded ? "收起播放器" : "展开播放器"}>
        {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* 播放列表下拉框 */}
      {showPlaylist && expanded && (
        <div className="playlist-dropdown" ref={playlistRef}>
          <div className="playlist-header">
            <h4>播放列表 ({playlist.length})</h4>
            <button onClick={() => setShowPlaylist(false)} aria-label="关闭播放列表">
              <X size={16} />
            </button>
          </div>
          <div className="playlist-items">
            {playlist.length > 0 ? (
              playlist.map((song, index) => (
                <div
                  key={song.id}
                  className={cn("playlist-item", index === currentSongIndex && "active")}
                  onClick={() => setCurrentSongIndex(index)}
                >
                  <div className="playlist-item-info">
                    <span className="playlist-item-title">{song.title}</span>
                    <span className="playlist-item-artist">{song.artist}</span>
                  </div>
                  {index === currentSongIndex && isPlaying && (
                    <div className="playlist-item-playing">
                      <span>正在播放</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="playlist-empty">播放列表中没有歌曲</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
