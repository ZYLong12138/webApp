"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, RotateCcw, Settings, Minimize, Coffee, BrainCircuit, Volume2, VolumeX } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// 番茄时钟状态类型
type TimerState = "idle" | "work" | "break" | "longBreak"
type TimerMode = "work" | "break" | "longBreak"

// 默认设置
const DEFAULT_SETTINGS = {
  workDuration: 25, // 工作时长（分钟）
  breakDuration: 5, // 短休息时长（分钟）
  longBreakDuration: 15, // 长休息时长（分钟）
  sessionsBeforeLongBreak: 4, // 长休息前的工作次数
  autoStartBreaks: true, // 自动开始休息
  autoStartWork: true, // 自动开始工作
  soundEnabled: true, // 声音开关
}

// 本地存储键
const STORAGE_KEY = "pomodoroSettings"
const TIMER_STATE_KEY = "pomodoroTimerState"

// 请求全屏
const requestFullscreen = () => {
  try {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen()
    } else if ((document.documentElement as any).webkitRequestFullscreen) {
      ;(document.documentElement as any).webkitRequestFullscreen()
    } else if ((document.documentElement as any).msRequestFullscreen) {
      ;(document.documentElement as any).msRequestFullscreen()
    }
  } catch (e) {
    console.error("Failed to enter fullscreen:", e)
  }
}

// 退出全屏
const exitFullscreen = () => {
  try {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if ((document as any).webkitExitFullscreen) {
      ;(document as any).webkitExitFullscreen()
    } else if ((document as any).msExitFullscreen) {
      ;(document as any).msExitFullscreen()
    }
  } catch (e) {
    console.error("Failed to exit fullscreen:", e)
  }
}

// 检查是否处于全屏状态
const isInFullscreen = () => {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).msFullscreenElement
  )
}

export function PomodoroTimer() {
  // 状态
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [timerState, setTimerState] = useState<TimerState>("idle")
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_SETTINGS.workDuration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [soundEnabled, setSoundEnabled] = useState(DEFAULT_SETTINGS.soundEnabled)
  const [audioLoaded, setAudioLoaded] = useState(false)

  // 跟踪全屏状态
  const [isFullscreen, setIsFullscreen] = useState(false)

  // 引用
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(isInFullscreen())
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("msfullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("msfullscreenchange", handleFullscreenChange)
    }
  }, [])

  // 初始化
  useEffect(() => {
    // 从本地存储加载设置
    const savedSettings = localStorage.getItem(STORAGE_KEY)
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }

    // 从本地存储加载计时器状态
    const savedTimerState = localStorage.getItem(TIMER_STATE_KEY)
    if (savedTimerState) {
      const { state, remaining, running, sessions } = JSON.parse(savedTimerState)
      setTimerState(state)
      setTimeRemaining(remaining)
      setIsRunning(running)
      setCompletedSessions(sessions)
    }

    // 创建音频元素
    try {
      // 使用内联的音频数据
      const audio = new Audio()
      audio.src =
        "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"
      audio.load()
      audio.oncanplaythrough = () => {
        setAudioLoaded(true)
        console.log("Audio loaded successfully")
      }
      audio.onerror = (e) => {
        console.error("Audio loading error:", e)
      }
      audioRef.current = audio
    } catch (e) {
      console.error("Failed to initialize audio:", e)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // 保存设置到本地存储
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  // 保存计时器状态到本地存储
  useEffect(() => {
    localStorage.setItem(
      TIMER_STATE_KEY,
      JSON.stringify({
        state: timerState,
        remaining: timeRemaining,
        running: isRunning,
        sessions: completedSessions,
      }),
    )
  }, [timerState, timeRemaining, isRunning, completedSessions])

  // 计时器逻辑
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // 计时结束
            clearInterval(timerRef.current!)
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRunning, soundEnabled])

  // 播放声音
  const playSound = () => {
    if (!soundEnabled || !audioRef.current || !audioLoaded) {
      console.log("Sound not played:", { soundEnabled, audioEnabled, audioExists: !!audioRef.current, audioLoaded })
      return
    }

    try {
      // 重置音频位置并播放
      audioRef.current.currentTime = 0
      audioRef.current
        .play()
        .then(() => console.log("Sound played successfully"))
        .catch((e) => console.error("Failed to play sound:", e))
    } catch (e) {
      console.error("Error playing sound:", e)
    }
  }

  // 处理计时器完成
  const handleTimerComplete = () => {
    // 播放声音
    playSound()

    if (timerState === "work") {
      // 工作模式结束，如果当前是全屏状态则退出全屏
      if (isFullscreen) {
        exitFullscreen()
      }

      const newSessions = completedSessions + 1
      setCompletedSessions(newSessions)

      // 检查是否应该进入长休息
      if (newSessions % settings.sessionsBeforeLongBreak === 0) {
        setTimerState("longBreak")
        setTimeRemaining(settings.longBreakDuration * 60)
        if (settings.autoStartBreaks) {
          setIsRunning(true)
        } else {
          setIsRunning(false)
        }
      } else {
        setTimerState("break")
        setTimeRemaining(settings.breakDuration * 60)
        if (settings.autoStartBreaks) {
          setIsRunning(true)
        } else {
          setIsRunning(false)
        }
      }
    } else {
      // 休息结束，开始新的工作周期
      setTimerState("work")
      setTimeRemaining(settings.workDuration * 60)

      // 如果自动开始工作且当前不是全屏状态，请求全屏
      if (settings.autoStartWork) {
        setIsRunning(true)
        if (!isFullscreen) {
          requestFullscreen()
        }
      } else {
        setIsRunning(false)
      }
    }
  }

  // 开始/暂停计时器
  const toggleTimer = () => {
    if (timerState === "idle") {
      setTimerState("work")
      setTimeRemaining(settings.workDuration * 60)
    }

    const willStart = !isRunning
    setIsRunning(willStart)

    // 如果是开始计时，自动最小化
    if (willStart) {
      setIsExpanded(false)

      // 如果是工作模式且当前不是全屏状态，请求全屏
      if ((timerState === "work" || timerState === "idle") && !isFullscreen) {
        requestFullscreen()
      }
    }
  }

  // 重置计时器
  const resetTimer = () => {
    setIsRunning(false)
    if (timerState === "work") {
      setTimeRemaining(settings.workDuration * 60)
    } else if (timerState === "break") {
      setTimeRemaining(settings.breakDuration * 60)
    } else if (timerState === "longBreak") {
      setTimeRemaining(settings.longBreakDuration * 60)
    }
  }

  // 切换模式
  const switchMode = (mode: TimerMode) => {
    setIsRunning(false)
    setTimerState(mode)

    // 如果切换到工作模式，请求全屏
    if (mode === "work") {
      setTimeRemaining(settings.workDuration * 60)
      if (!isFullscreen) {
        requestFullscreen()
      }
    } else if (mode === "break") {
      setTimeRemaining(settings.breakDuration * 60)
      if (isFullscreen) {
        exitFullscreen()
      }
    } else if (mode === "longBreak") {
      setTimeRemaining(settings.longBreakDuration * 60)
      if (isFullscreen) {
        exitFullscreen()
      }
    }
  }

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // 获取进度百分比
  const getProgressPercentage = () => {
    let totalTime
    if (timerState === "work") {
      totalTime = settings.workDuration * 60
    } else if (timerState === "break") {
      totalTime = settings.breakDuration * 60
    } else if (timerState === "longBreak") {
      totalTime = settings.longBreakDuration * 60
    } else {
      return 0
    }

    return ((totalTime - timeRemaining) / totalTime) * 100
  }

  // 获取当前模式的颜色
  const getModeColor = () => {
    switch (timerState) {
      case "work":
        return "bg-red-500"
      case "break":
        return "bg-green-500"
      case "longBreak":
        return "bg-blue-500"
      default:
        return "bg-gray-300"
    }
  }

  // 获取当前模式的文本
  const getModeText = () => {
    switch (timerState) {
      case "work":
        return "专注工作"
      case "break":
        return "短休息"
      case "longBreak":
        return "长休息"
      default:
        return "番茄时钟"
    }
  }

  // 更新设置
  const updateSetting = (key: keyof typeof DEFAULT_SETTINGS, value: number | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // 渲染设置面板
  const renderSettings = () => {
    return (
      <div className="p-4 space-y-4">
        <div>
          <label className="text-sm font-medium">工作时长 ({settings.workDuration} 分钟)</label>
          <Slider
            value={[settings.workDuration]}
            min={1}
            max={60}
            step={1}
            onValueChange={(value) => updateSetting("workDuration", value[0])}
            className="mt-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">短休息时长 ({settings.breakDuration} 分钟)</label>
          <Slider
            value={[settings.breakDuration]}
            min={1}
            max={30}
            step={1}
            onValueChange={(value) => updateSetting("breakDuration", value[0])}
            className="mt-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">长休息时长 ({settings.longBreakDuration} 分钟)</label>
          <Slider
            value={[settings.longBreakDuration]}
            min={5}
            max={60}
            step={1}
            onValueChange={(value) => updateSetting("longBreakDuration", value[0])}
            className="mt-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">长休息前的工作次数 ({settings.sessionsBeforeLongBreak})</label>
          <Slider
            value={[settings.sessionsBeforeLongBreak]}
            min={1}
            max={10}
            step={1}
            onValueChange={(value) => updateSetting("sessionsBeforeLongBreak", value[0])}
            className="mt-2"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">自动开始休息</label>
          <input
            type="checkbox"
            checked={settings.autoStartBreaks}
            onChange={(e) => updateSetting("autoStartBreaks", e.target.checked)}
            className="h-4 w-4"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">自动开始工作</label>
          <input
            type="checkbox"
            checked={settings.autoStartWork}
            onChange={(e) => updateSetting("autoStartWork", e.target.checked)}
            className="h-4 w-4"
          />
        </div>
      </div>
    )
  }

  // 渲染最小化状态
  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`rounded-full h-12 w-12 shadow-lg ${getModeColor()} hover:${getModeColor()} border-2 border-white`}
                onClick={() => {
                  if (isRunning) {
                    // 如果计时器正在运行，点击按钮暂停计时器
                    toggleTimer()
                  } else {
                    // 如果计时器未运行，点击按钮展开面板
                    setIsExpanded(true)
                  }
                }}
              >
                <span className="sr-only">打开番茄时钟</span>
                {isRunning ? (
                  <span className="text-white font-bold">{formatTime(timeRemaining)}</span>
                ) : (
                  <span className="text-white">
                    {timerState === "work" ? <BrainCircuit size={20} /> : <Coffee size={20} />}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {getModeText()} {isRunning ? formatTime(timeRemaining) : ""}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  // 渲染展开状态
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-72 shadow-lg">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center space-x-2">
            {timerState === "work" ? <BrainCircuit size={18} /> : <Coffee size={18} />}
            <h3 className="font-medium">{getModeText()}</h3>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSoundEnabled(!soundEnabled)}>
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowSettings(!showSettings)}>
              <Settings size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsExpanded(false)}>
              <Minimize size={16} />
            </Button>
          </div>
        </div>

        {showSettings ? (
          renderSettings()
        ) : (
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold mb-2">{formatTime(timeRemaining)}</div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className={`h-2 rounded-full ${getModeColor()}`}
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>

              <div className="flex space-x-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={`${timerState === "work" ? "bg-red-100" : ""}`}
                  onClick={() => switchMode("work")}
                >
                  工作
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`${timerState === "break" ? "bg-green-100" : ""}`}
                  onClick={() => switchMode("break")}
                >
                  短休息
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`${timerState === "longBreak" ? "bg-blue-100" : ""}`}
                  onClick={() => switchMode("longBreak")}
                >
                  长休息
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="icon" onClick={toggleTimer}>
                  {isRunning ? <Pause size={18} /> : <Play size={18} />}
                </Button>
                <Button variant="outline" size="icon" onClick={resetTimer}>
                  <RotateCcw size={18} />
                </Button>
              </div>

              <div className="mt-2 text-sm text-gray-500">已完成 {completedSessions} 个工作周期</div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
