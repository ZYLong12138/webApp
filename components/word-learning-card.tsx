"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Volume2, Check, X, Star, ChevronRight } from "lucide-react"
import { LearningManager, TestType } from "../algorithm/learning"
import { getWordsByBatch, updateMasteryLevel, getMasteryLevel, hasMoreBatches } from "../services/vocabulary-service"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"

interface WordLearningCardProps {
  onComplete: () => void // 学习完成后的回调
  maxWordsToLearn?: number // 每批学习单词数量，默认为5
  bookId?: string // 可选的词书ID，用于过滤单词
}

export function WordLearningCard({ onComplete, maxWordsToLearn = 5, bookId }: WordLearningCardProps) {
  const { toast } = useToast()
  const [learningManager, setLearningManager] = useState<LearningManager | null>(null)
  const [currentTest, setCurrentTest] = useState<any>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState({ totalWords: 0, completedWords: 0, currentTestIndex: 0, totalTests: 0 })
  const [currentWordStatus, setCurrentWordStatus] = useState<{
    [TestType.WORD_TO_DEFINITION]: boolean
    [TestType.DEFINITION_TO_WORD]: boolean
    [TestType.AUDIO_TO_WORD]: boolean
  }>({
    [TestType.WORD_TO_DEFINITION]: false,
    [TestType.DEFINITION_TO_WORD]: false,
    [TestType.AUDIO_TO_WORD]: false,
  })
  // 添加一个状态来跟踪当前单词的熟练度
  const [wordMasteryLevels, setWordMasteryLevels] = useState<Record<string, number>>({})
  const [currentBatch, setCurrentBatch] = useState(1)
  const [hasMoreWords, setHasMoreWords] = useState(true)

  // 获取单词数据并初始化学习管理器
  useEffect(() => {
    loadWords()
  }, [currentBatch])

  // 加载单词的函数
  const loadWords = async () => {
    setIsLoading(true)
    try {
      // 按批次获取单词
      const data = await getWordsByBatch(currentBatch, maxWordsToLearn, bookId)

      if (data.length === 0) {
        setHasMoreWords(false)
        toast({
          title: "学习完成",
          description: "您已完成所有单词的学习",
        })
        setIsLoading(false)
        return
      }

      // 初始化学习管理器
      const manager = new LearningManager(data)
      setLearningManager(manager)

      // 获取第一个测试
      const firstTest = manager.getCurrentTest()
      setCurrentTest(firstTest)

      // 更新进度
      setProgress(manager.getProgress())

      // 获取所有学习单词的熟练度
      const masteryLevels: Record<string, number> = {}
      for (const word of data) {
        try {
          const level = await getMasteryLevel(word.id)
          masteryLevels[word.id] = level
        } catch (error) {
          console.error(`获取单词 ${word.id} 熟练度失败:`, error)
          masteryLevels[word.id] = 0
        }
      }
      setWordMasteryLevels(masteryLevels)

      // 检查是否有更多批次
      const moreWords = await hasMoreBatches(currentBatch, maxWordsToLearn, bookId)
      setHasMoreWords(moreWords)

      // 重置状态
      setSelectedOption(null)
      setIsCorrect(null)
    } catch (error) {
      console.error("获取单词失败:", error)
      toast({
        title: "加载失败",
        description: "获取学习单词时出现错误",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 在 useEffect 中，当 currentTest 更新时，获取当前单词的测试通过状态
  useEffect(() => {
    if (learningManager && currentTest) {
      const wordStates = learningManager.getWordStates()
      const wordState = wordStates.get(currentTest.wordId)
      if (wordState) {
        setCurrentWordStatus(wordState.testsPassed)
      }
    }
  }, [learningManager, currentTest])

  // 更新熟练度的函数
  const updateWordMastery = async (wordId: string, isCorrect: boolean) => {
    try {
      // 获取当前熟练度
      const currentLevel = wordMasteryLevels[wordId] || 0

      // 根据回答正确与否更新熟练度
      let newLevel = currentLevel
      if (isCorrect) {
        // 答对了，熟练度加1，上限为5
        newLevel = Math.min(5, currentLevel + 1)
      } else {
        // 答错了，熟练度减1，下限为-5
        newLevel = Math.max(-5, currentLevel - 1)
      }

      // 如果熟练度有变化，更新数据库
      if (newLevel !== currentLevel) {
        await updateMasteryLevel(wordId, newLevel)

        // 更新本地状态
        setWordMasteryLevels((prev) => ({
          ...prev,
          [wordId]: newLevel,
        }))

        // 显示提示
        toast({
          title: isCorrect ? "熟练度提升" : "熟练度下降",
          description: `单词熟练度已更新为 ${newLevel}`,
          variant: isCorrect ? "default" : "destructive",
        })
      }
    } catch (error) {
      console.error("更新熟练度失败:", error)
      toast({
        title: "更新失败",
        description: "更新单词熟练度时出现错误",
        variant: "destructive",
      })
    }
  }

  // 修改 handleOptionClick 函数，确保正确记录用户的选择并更新熟练度
  const handleOptionClick = (isCorrect: boolean, index: number) => {
    if (selectedOption !== null || !learningManager || !currentTest) return // 已经选择了选项，不允许再次选择

    setSelectedOption(index)
    setIsCorrect(isCorrect)

    // 更新熟练度
    updateWordMastery(currentTest.wordId, isCorrect)

    // 如果回答正确，立即更新当前单词的测试通过状态
    if (isCorrect) {
      setCurrentWordStatus((prevStatus) => ({
        ...prevStatus,
        [currentTest.testType]: true,
      }))
    }
  }

  // 修改 handleNextWord 函数，确保正确提交答案并获取下一个测试
  const handleNextWord = () => {
    if (!learningManager) return

    // 提交答案
    const moveToNext = learningManager.submitAnswer(isCorrect || false)

    // 重置状态
    setSelectedOption(null)
    setIsCorrect(null)

    // 获取下一个测试
    const nextTest = learningManager.getCurrentTest()
    setCurrentTest(nextTest)

    // 更新进度
    setProgress(learningManager.getProgress())

    // 如果当前批次学习完成，询问是否继续下一批
    if (learningManager.isCompleted()) {
      // 显示完成当前批次的提示
      toast({
        title: "批次完成",
        description: `您已完成第 ${currentBatch} 批单词的学习`,
      })
    }
  }

  // 处理"已掌握"按钮点击 - 直接设置为最高熟练度
  const handleMastered = async () => {
    if (currentTest) {
      try {
        // 更新掌握程度为5（完全掌握）
        await updateMasteryLevel(currentTest.wordId, 5)

        // 更新本地状态
        setWordMasteryLevels((prev) => ({
          ...prev,
          [currentTest.wordId]: 5,
        }))

        toast({
          title: "已标记为掌握",
          description: "单词熟练度已设置为最高级别",
        })
      } catch (error) {
        console.error("更新掌握程度失败:", error)
      }
    }
    handleNextWord()
  }

  // 处理"需要复习"按钮点击 - 设置为较低熟练度
  const handleNeedReview = async () => {
    if (currentTest) {
      try {
        // 更新掌握程度为-3（需要重点复习）
        await updateMasteryLevel(currentTest.wordId, -3)

        // 更新本地状态
        setWordMasteryLevels((prev) => ({
          ...prev,
          [currentTest.wordId]: -3,
        }))

        toast({
          title: "已标记为需要复习",
          description: "单词已添加到重点复习列表",
        })
      } catch (error) {
        console.error("更新掌握程度失败:", error)
      }
    }
    handleNextWord()
  }

  // 处理加载下一批单词
  const handleLoadNextBatch = () => {
    setCurrentBatch(currentBatch + 1)
  }

  // 播放单词发音
  const playPronunciation = () => {
    if (currentTest && currentTest.audioUrl) {
      // 这里可以添加实际的发音逻辑
      console.log(`播放单词 "${currentTest.word}" 的发音: ${currentTest.audioUrl}`)
    }
  }

  // 获取测试类型的中文描述
  const getTestTypeDescription = (testType?: TestType) => {
    if (!testType) return ""

    switch (testType) {
      case TestType.WORD_TO_DEFINITION:
        return "选择单词的正确含义"
      case TestType.DEFINITION_TO_WORD:
        return "根据含义选择正确的单词"
      case TestType.AUDIO_TO_WORD:
        return "听发音选择正确的单词"
      default:
        return ""
    }
  }

  // 获取熟练度显示文本
  const getMasteryLevelText = (wordId: string) => {
    const level = wordMasteryLevels[wordId] || 0

    if (level >= 4) return "精通"
    if (level >= 2) return "熟悉"
    if (level >= 0) return "学习中"
    if (level >= -3) return "需复习"
    return "困难"
  }

  // 获取熟练度显示颜色
  const getMasteryLevelColor = (wordId: string) => {
    const level = wordMasteryLevels[wordId] || 0

    if (level >= 4) return "text-green-600"
    if (level >= 2) return "text-blue-600"
    if (level >= 0) return "text-gray-600"
    if (level >= -3) return "text-orange-600"
    return "text-red-600"
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-800">
        <p>加载中...</p>
      </div>
    )
  }

  // 如果没有更多单词可学习
  if (!hasMoreWords && learningManager?.isCompleted()) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-800">
        <p className="mb-4">恭喜！您已完成所有单词的学习</p>
        <Button onClick={onComplete}>返回</Button>
      </div>
    )
  }

  // 如果当前批次学习完成，显示继续下一批的选项
  if (learningManager?.isCompleted()) {
    return (
      <Card className="bg-white shadow-md">
        <CardContent className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4">批次完成</h2>
          <p className="mb-6 text-gray-600">您已完成第 {currentBatch} 批单词的学习</p>
          <div className="flex justify-center gap-4">
            {hasMoreWords ? (
              <Button onClick={handleLoadNextBatch} className="flex items-center gap-2">
                继续学习下一批
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <p className="text-green-600 mb-4">恭喜！您已完成所有单词的学习</p>
            )}
            <Button variant="outline" onClick={onComplete}>
              返回
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!learningManager || !currentTest) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-800">
        <p className="mb-4">没有可学习的单词</p>
        <Button onClick={onComplete}>返回</Button>
      </div>
    )
  }

  // 计算进度百分比
  const progressPercentage = progress.totalTests > 0 ? (progress.currentTestIndex / progress.totalTests) * 100 : 0

  return (
    <div className="w-full">
      {/* 批次指示器 */}
      <div className="mb-4 text-center">
        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          第 {currentBatch} 批单词
        </span>
      </div>

      {/* 进度指示器 */}
      <div className="w-full mb-8">
        <div className="flex justify-between mb-2 text-gray-800">
          <span>学习进度</span>
          <span>
            {progress.currentTestIndex} / {progress.totalTests} (完成单词: {progress.completedWords}/
            {progress.totalWords})
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2 bg-gray-200" />
      </div>

      {/* 测试类型提示 */}
      <div className="text-center text-gray-800 mb-4">
        <p>{getTestTypeDescription(currentTest.testType)}</p>
      </div>

      {/* 单词卡片 */}
      <div className="bg-white shadow-md rounded-lg p-8 w-full mb-8">
        {/* 根据测试类型显示不同内容 */}
        {currentTest.testType === TestType.WORD_TO_DEFINITION && (
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <h2 className="text-3xl font-bold text-gray-800 mr-3">{currentTest.word}</h2>
              <div className="flex space-x-1">
                <Star
                  className={`h-5 w-5 ${currentWordStatus[TestType.WORD_TO_DEFINITION] ? "text-yellow-400 fill-yellow-400" : "text-gray-500"}`}
                  data-testtype={TestType.WORD_TO_DEFINITION}
                />
                <Star
                  className={`h-5 w-5 ${currentWordStatus[TestType.DEFINITION_TO_WORD] ? "text-yellow-400 fill-yellow-400" : "text-gray-500"}`}
                  data-testtype={TestType.DEFINITION_TO_WORD}
                />
                <Star
                  className={`h-5 w-5 ${currentWordStatus[TestType.AUDIO_TO_WORD] ? "text-yellow-400 fill-yellow-400" : "text-gray-500"}`}
                  data-testtype={TestType.AUDIO_TO_WORD}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* 显示当前单词的熟练度 */}
              <span className={`text-sm font-medium ${getMasteryLevelColor(currentTest.wordId)}`}>
                {getMasteryLevelText(currentTest.wordId)} ({wordMasteryLevels[currentTest.wordId] || 0})
              </span>
              <Button variant="ghost" size="icon" className="rounded-full bg-gray-200" onClick={playPronunciation}>
                <Volume2 className="h-5 w-5 text-gray-800" />
                <span className="sr-only">播放发音</span>
              </Button>
            </div>
          </div>
        )}

        {currentTest.testType === TestType.DEFINITION_TO_WORD && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <h2 className="text-xl font-medium text-gray-800 mr-3">选择下列含义对应的单词:</h2>
                <div className="flex space-x-1">
                  <Star
                    className={`h-5 w-5 ${currentWordStatus[TestType.WORD_TO_DEFINITION] ? "text-yellow-400 fill-yellow-400" : "text-gray-500"}`}
                    data-testtype={TestType.WORD_TO_DEFINITION}
                  />
                  <Star
                    className={`h-5 w-5 ${currentWordStatus[TestType.DEFINITION_TO_WORD] ? "text-yellow-400 fill-yellow-400" : "text-gray-500"}`}
                    data-testtype={TestType.DEFINITION_TO_WORD}
                  />
                  <Star
                    className={`h-5 w-5 ${currentWordStatus[TestType.AUDIO_TO_WORD] ? "text-yellow-400 fill-yellow-400" : "text-gray-500"}`}
                    data-testtype={TestType.AUDIO_TO_WORD}
                  />
                </div>
              </div>
              {/* 显示当前单词的熟练度 */}
              <span className={`text-sm font-medium ${getMasteryLevelColor(currentTest.wordId)}`}>
                {getMasteryLevelText(currentTest.wordId)} ({wordMasteryLevels[currentTest.wordId] || 0})
              </span>
            </div>
            <p className="text-gray-600">{currentTest.definition}</p>
          </div>
        )}

        {currentTest.testType === TestType.AUDIO_TO_WORD && (
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="flex items-center justify-between w-full mb-4">
              <div className="flex items-center">
                <h2 className="text-xl font-medium text-gray-800 mr-3">听发音选择正确的单词</h2>
                <div className="flex space-x-1">
                  <Star
                    className={`h-5 w-5 ${currentWordStatus[TestType.WORD_TO_DEFINITION] ? "text-yellow-400 fill-yellow-400" : "text-gray-500"}`}
                    data-testtype={TestType.WORD_TO_DEFINITION}
                  />
                  <Star
                    className={`h-5 w-5 ${currentWordStatus[TestType.DEFINITION_TO_WORD] ? "text-yellow-400 fill-yellow-400" : "text-gray-500"}`}
                    data-testtype={TestType.DEFINITION_TO_WORD}
                  />
                  <Star
                    className={`h-5 w-5 ${currentWordStatus[TestType.AUDIO_TO_WORD] ? "text-yellow-400 fill-yellow-400" : "text-gray-500"}`}
                    data-testtype={TestType.AUDIO_TO_WORD}
                  />
                </div>
              </div>
              {/* 显示当前单词的熟练度 */}
              <span className={`text-sm font-medium ${getMasteryLevelColor(currentTest.wordId)}`}>
                {getMasteryLevelText(currentTest.wordId)} ({wordMasteryLevels[currentTest.wordId] || 0})
              </span>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full bg-gray-200 hover:bg-gray-300 border-none"
              onClick={playPronunciation}
            >
              <Volume2 className="h-8 w-8 text-gray-800" />
              <span className="sr-only">播放发音</span>
            </Button>
          </div>
        )}

        {/* 示例句子（如果有且是单词选意思类型） */}
        {currentTest.testType === TestType.WORD_TO_DEFINITION && currentTest.example && (
          <div className="text-gray-500 mb-6 text-center italic">"{currentTest.example}"</div>
        )}

        {/* 选项网格 */}
        <div className="grid grid-cols-2 gap-4">
          {currentTest.options.map((option: any, index: number) => (
            <button
              key={index}
              className={`p-4 rounded-md text-center transition-colors ${
                selectedOption === index
                  ? option.isCorrect
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              } ${selectedOption !== null && option.isCorrect ? "ring-2 ring-green-500" : ""}`}
              onClick={() => handleOptionClick(option.isCorrect, index)}
              disabled={selectedOption !== null}
            >
              {option.text}
            </button>
          ))}
        </div>

        {/* 选择后的反馈 */}
        {selectedOption !== null && (
          <div className="mt-4 text-center">
            <p className={isCorrect ? "text-green-500" : "text-red-500"}>{isCorrect ? "回答正确!" : "回答错误!"}</p>
            <Button className="mt-2" onClick={handleNextWord}>
              下一个
            </Button>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="flex gap-4 justify-center">
        <Button className="bg-green-600 hover:bg-green-700 flex items-center gap-2" onClick={handleMastered}>
          <Check className="h-4 w-4" />
          已掌握
        </Button>
        <Button variant="destructive" className="flex items-center gap-2" onClick={handleNeedReview}>
          <X className="h-4 w-4" />
          需要复习
        </Button>
      </div>
    </div>
  )
}

