"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
// 在 import 部分添加 Star 图标
import { Volume2, Check, X, Star } from "lucide-react"
// 导入学习管理器和相关类型
import { LearningManager, TestType } from "../algorithm/learning"
import { getVocabularyWords, updateMasteryLevel } from "../services/vocabulary-service"

interface WordLearningCardProps {
  onComplete: () => void // 学习完成后的回调
  maxWordsToLearn?: number // 最大学习单词数量，默认为5
  bookId?: string // 可选的词书ID，用于过滤单词
}

export function WordLearningCard({ onComplete, maxWordsToLearn = 5, bookId }: WordLearningCardProps) {
  const [learningManager, setLearningManager] = useState<LearningManager | null>(null)
  const [currentTest, setCurrentTest] = useState<any>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState({ totalWords: 0, completedWords: 0, currentTestIndex: 0, totalTests: 0 })
  // 在 WordLearningCard 组件中添加一个新的状态来跟踪当前单词的测试通过状态
  const [currentWordStatus, setCurrentWordStatus] = useState<{
    [TestType.WORD_TO_DEFINITION]: boolean
    [TestType.DEFINITION_TO_WORD]: boolean
    [TestType.AUDIO_TO_WORD]: boolean
  }>({
    [TestType.WORD_TO_DEFINITION]: false,
    [TestType.DEFINITION_TO_WORD]: false,
    [TestType.AUDIO_TO_WORD]: false,
  })

  // 获取单词数据并初始化学习管理器
  useEffect(() => {
    const fetchWords = async () => {
      setIsLoading(true)
      try {
        const data = await getVocabularyWords()
        // 如果提供了bookId，可以在这里过滤单词
        // const filteredData = bookId ? data.filter(word => word.book_id === bookId) : data;

        // 随机打乱单词顺序并限制数量
        const shuffled = [...data].sort(() => Math.random() - 0.5)
        const learningWords = shuffled.slice(0, Math.min(maxWordsToLearn, data.length))

        // 初始化学习管理器
        const manager = new LearningManager(learningWords)
        setLearningManager(manager)

        // 获取第一个测试
        const firstTest = manager.getCurrentTest()
        setCurrentTest(firstTest)

        // 更新进度
        setProgress(manager.getProgress())
      } catch (error) {
        console.error("获取单词失败:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWords()
  }, [maxWordsToLearn, bookId])

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

  // 修改 handleOptionClick 函数，确保正确记录用户的选择并实时点亮星星
  const handleOptionClick = (isCorrect: boolean, index: number) => {
    if (selectedOption !== null || !learningManager) return // 已经选择了选项，不允许再次选择

    setSelectedOption(index)
    setIsCorrect(isCorrect)

    // 如果回答正确，立即更新当前单词的测试通过状态
    if (isCorrect && currentTest) {
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

    // 如果学习完成，调用完成回调
    if (learningManager.isCompleted()) {
      onComplete()
    }
  }

  // 处理"已掌握"按钮点击
  const handleMastered = async () => {
    if (currentTest) {
      try {
        // 更新掌握程度为3（熟悉）
        await updateMasteryLevel(currentTest.wordId, 3)
      } catch (error) {
        console.error("更新掌握程度失败:", error)
      }
    }
    handleNextWord()
  }

  // 处理"需要复习"按钮点击
  const handleNeedReview = async () => {
    if (currentTest) {
      try {
        // 更新掌握程度为1（有印象）
        await updateMasteryLevel(currentTest.wordId, 1)
      } catch (error) {
        console.error("更新掌握程度失败:", error)
      }
    }
    handleNextWord()
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

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center text-white">
        <p>加载中...</p>
      </div>
    )
  }

  if (!learningManager || !currentTest) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center text-white">
        <p className="mb-4">没有可学习的单词</p>
        <Button onClick={onComplete}>返回</Button>
      </div>
    )
  }

  // 计算进度百分比
  const progressPercentage = progress.totalTests > 0 ? (progress.currentTestIndex / progress.totalTests) * 100 : 0

  return (
    <div className="w-full">
      {/* 进度指示器 */}
      <div className="w-full mb-8">
        <div className="flex justify-between mb-2 text-white">
          <span>学习进度</span>
          <span>
            {progress.currentTestIndex} / {progress.totalTests} (完成单词: {progress.completedWords}/
            {progress.totalWords})
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2 bg-slate-700" />
      </div>

      {/* 测试类型提示 */}
      <div className="text-center text-white mb-4">
        <p>{getTestTypeDescription(currentTest.testType)}</p>
      </div>

      {/* 单词卡片 */}
      <div className="bg-slate-800 rounded-lg p-8 w-full mb-8">
        {/* 根据测试类型显示不同内容 */}
        {currentTest.testType === TestType.WORD_TO_DEFINITION && (
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <h2 className="text-3xl font-bold text-white mr-3">{currentTest.word}</h2>
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
            <Button variant="ghost" size="icon" className="rounded-full bg-slate-700" onClick={playPronunciation}>
              <Volume2 className="h-5 w-5 text-white" />
              <span className="sr-only">播放发音</span>
            </Button>
          </div>
        )}

        {currentTest.testType === TestType.DEFINITION_TO_WORD && (
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <h2 className="text-xl font-medium text-white mr-3">选择下列含义对应的单词:</h2>
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
            <p className="text-slate-300">{currentTest.definition}</p>
          </div>
        )}

        {currentTest.testType === TestType.AUDIO_TO_WORD && (
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-medium text-white mr-3">听发音选择正确的单词</h2>
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
            <Button
              variant="outline"
              size="lg"
              className="rounded-full bg-slate-700 hover:bg-slate-600 border-none"
              onClick={playPronunciation}
            >
              <Volume2 className="h-8 w-8 text-white" />
              <span className="sr-only">播放发音</span>
            </Button>
          </div>
        )}

        {/* 示例句子（如果有且是单词选意思类型） */}
        {currentTest.testType === TestType.WORD_TO_DEFINITION && currentTest.example && (
          <div className="text-slate-400 mb-6 text-center italic">"{currentTest.example}"</div>
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
                  : "bg-slate-700 hover:bg-slate-600 text-white"
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

