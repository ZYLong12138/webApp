"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Volume2, RefreshCw, Check, X, Pause, Play, Settings } from "lucide-react"
import { getVocabularyWords, updateMasteryLevel } from "@/services/vocabulary-service"
import type { VocabularyWord } from "@/types/vocabulary"
import { ThemeSwitcherButton } from "@/Integration_modules/theme-switcher-button"
import { useTheme } from "@/contexts/theme-context"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

export default function DictationPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const { toast } = useToast()
  const [words, setWords] = useState<VocabularyWord[]>([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [userInput, setUserInput] = useState("")
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [linkToMastery, setLinkToMastery] = useState(true) // 添加此行，默认启用熟练度关联
  const [stats, setStats] = useState({
    startTime: Date.now(),
    inputCount: 0,
    correctCount: 0,
    totalTime: 0,
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const [bookTitle, setBookTitle] = useState("我的词库")

  // 获取单词数据
  useEffect(() => {
    const fetchWords = async () => {
      setIsLoading(true)
      try {
        const data = await getVocabularyWords()
        // 随机排序单词
        const shuffled = [...data].sort(() => Math.random() - 0.5)
        setWords(shuffled)
        setStats({
          ...stats,
          startTime: Date.now(),
        })
      } catch (err) {
        console.error("获取单词失败:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWords()
  }, [])

  // 自动聚焦输入框
  useEffect(() => {
    if (!isLoading && inputRef.current && !isPaused) {
      inputRef.current.focus()
    }
  }, [isLoading, currentWordIndex, isPaused])

  // 当前单词
  const currentWord = words[currentWordIndex] || {
    word: "",
    definition: "",
    pronunciation: "",
  }

  // 计算经过的时间（分:秒）
  const getElapsedTime = () => {
    const elapsed = Math.floor((Date.now() - stats.startTime) / 1000)
    const minutes = Math.floor(elapsed / 60)
    const seconds = elapsed % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // 计算WPM（每分钟单词数）
  const getWPM = () => {
    const minutes = (Date.now() - stats.startTime) / 1000 / 60
    return minutes > 0 ? Math.round(stats.inputCount / minutes) : 0
  }

  // 计算正确率
  const getAccuracy = () => {
    return stats.inputCount > 0 ? Math.round((stats.correctCount / stats.inputCount) * 100) : 0
  }

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value)
  }

  // 处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 检查答案
    const isAnswerCorrect = userInput.trim().toLowerCase() === currentWord.word.trim().toLowerCase()
    setIsCorrect(isAnswerCorrect)
    setShowAnswer(true)

    // 更新统计数据
    setStats({
      ...stats,
      inputCount: stats.inputCount + 1,
      correctCount: isAnswerCorrect ? stats.correctCount + 1 : stats.correctCount,
    })

    // 如果启用了熟练度关联，更新单词熟练度
    if (linkToMastery && currentWord.id) {
      try {
        // 正确加一，错误减一
        const newLevel = isAnswerCorrect ? 1 : -1
        await updateMasteryLevel(currentWord.id, newLevel)

        // 可选：显示提示
        toast({
          title: isAnswerCorrect ? "熟练度提升" : "熟练度下降",
          description: `单词 "${currentWord.word}" 的熟练度已${isAnswerCorrect ? "提升" : "降低"}`,
          variant: isAnswerCorrect ? "default" : "destructive",
        })
      } catch (error) {
        console.error("更新熟练度失败:", error)
      }
    }

    // 延迟后移动到下一个单词
    setTimeout(() => {
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(currentWordIndex + 1)
        setUserInput("")
        setIsCorrect(null)
        setShowAnswer(false)
      } else {
        // 所有单词已完成
        setIsPaused(true)
      }
    }, 1500)
  }

  // 播放发音
  const playPronunciation = () => {
    // 这里可以添加实际的发音逻辑
    console.log(`播放单词 "${currentWord.word}" 的发音`)
  }

  // 重新开始
  const handleRestart = () => {
    setCurrentWordIndex(0)
    setUserInput("")
    setIsCorrect(null)
    setShowAnswer(false)
    setIsPaused(false)
    setStats({
      startTime: Date.now(),
      inputCount: 0,
      correctCount: 0,
      totalTime: 0,
    })
    // 重新随机排序单词
    setWords((prev) => [...prev].sort(() => Math.random() - 0.5))
  }

  // 暂停/继续
  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  // 切换熟练度关联
  const toggleMasteryLink = () => {
    setLinkToMastery(!linkToMastery)
    toast({
      title: !linkToMastery ? "已启用熟练度关联" : "已禁用熟练度关联",
      description: !linkToMastery ? "拼写结果将影响单词熟练度" : "拼写结果不会影响单词熟练度",
    })
  }

  // 获取容器类名
  const getContainerClass = () => {
    switch (theme) {
      case "dusk-rose":
        return "min-h-screen gem-gradient-bg p-4"
      case "zephyr-jasmine":
        return "min-h-screen jasmine-gradient-bg p-4"
      default:
        return "min-h-screen bg-gray-50 p-4"
    }
  }

  // 获取导航栏类名
  const getNavClass = () => {
    switch (theme) {
      case "dusk-rose":
        return "flex justify-between items-center mb-6 sticky top-0 z-10 p-3 gem-nav rounded-xl shadow-sm"
      case "zephyr-jasmine":
        return "flex justify-between items-center mb-6 sticky top-0 z-10 p-3 jasmine-nav rounded-xl shadow-sm"
      default:
        return "flex justify-between items-center mb-6 sticky top-0 z-10 p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm"
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className={getContainerClass()}>
        {/* 顶部导航 */}
        <div className={getNavClass()}>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 h-8 hover:scale-105 transition-transform text-gray-600"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-3 w-3" />
              返回
            </Button>
            <h1 className="text-lg font-bold ml-2 text-gray-800">{bookTitle}</h1>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant={linkToMastery ? "default" : "outline"}
              size="sm"
              onClick={toggleMasteryLink}
              className="flex items-center gap-1 h-8 text-xs"
            >
              <Settings className="h-3 w-3" />
              {linkToMastery ? "已关联熟练度" : "未关联熟练度"}
            </Button>
            <Button variant="outline" size="sm" onClick={togglePause} className="flex items-center gap-1 h-8 text-xs">
              {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              {isPaused ? "继续" : "暂停"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRestart} className="flex items-center gap-1 h-8 text-xs">
              <RefreshCw className="h-3 w-3" />
              重新开始
            </Button>
            <ThemeSwitcherButton size="sm" variant="ghost" />
          </div>
        </div>

        {/* 主要内容 */}
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <Card className="bg-white/80 backdrop-blur-sm shadow-sm">
              <CardContent className="flex items-center justify-center p-12">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="ml-3 text-gray-600">加载单词中...</span>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* 进度条 */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>进度</span>
                  <span>
                    {currentWordIndex + 1} / {words.length}
                  </span>
                </div>
                <Progress value={(currentWordIndex / words.length) * 100} className="h-2" />
              </div>

              {/* 单词卡片 */}
              <Card className="bg-white/90 backdrop-blur-sm shadow-sm mb-6">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center">
                    {/* 中文释义 */}
                    <div className="text-lg text-gray-700 mb-8 text-center">{currentWord.definition}</div>

                    {/* 输入区域 */}
                    <div className="w-full max-w-md mb-6">
                      {showAnswer ? (
                        <div className="flex items-center justify-center">
                          <div className={`text-3xl font-bold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                            {currentWord.word}
                          </div>
                          <Button variant="ghost" size="sm" className="ml-2" onClick={playPronunciation}>
                            <Volume2 className="h-4 w-4 text-gray-500" />
                          </Button>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col items-center">
                          <div className="w-full flex items-center justify-center mb-4">
                            <div className="border-b-2 border-gray-300 w-64 text-center">
                              <Input
                                ref={inputRef}
                                type="text"
                                value={userInput}
                                onChange={handleInputChange}
                                className="text-center text-2xl border-none shadow-none focus-visible:ring-0 font-medium h-14"
                                placeholder="输入单词"
                                disabled={isPaused}
                              />
                            </div>
                          </div>
                          <Button type="submit" disabled={isPaused || userInput.trim() === ""}>
                            确认
                          </Button>
                        </form>
                      )}
                    </div>

                    {/* 音标 */}
                    {currentWord.pronunciation && (
                      <div className="text-gray-500 text-sm mb-4">{currentWord.pronunciation}</div>
                    )}

                    {/* 结果反馈 */}
                    {isCorrect !== null && (
                      <div className="flex items-center mt-4">
                        {isCorrect ? (
                          <div className="flex items-center text-green-600">
                            <Check className="h-5 w-5 mr-1" />
                            <span>正确</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <X className="h-5 w-5 mr-1" />
                            <span>错误</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 统计信息 */}
              <Card className="bg-white/80 backdrop-blur-sm shadow-sm">
                <CardContent className="p-6">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="flex flex-col items-center">
                      <div className="text-xl font-bold text-gray-800">{getElapsedTime()}</div>
                      <div className="text-xs text-gray-500">时间</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-xl font-bold text-gray-800">{stats.inputCount}</div>
                      <div className="text-xs text-gray-500">输入数</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-xl font-bold text-gray-800">{getWPM()}</div>
                      <div className="text-xs text-gray-500">WPM</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-xl font-bold text-gray-800">{getAccuracy()}%</div>
                      <div className="text-xs text-gray-500">正确率</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </ThemeProvider>
  )
}

