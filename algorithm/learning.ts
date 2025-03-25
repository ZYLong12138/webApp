import type { VocabularyWord } from "@/types/vocabulary"

// 测试类型枚举
export enum TestType {
  WORD_TO_DEFINITION = "word_to_definition", // 给单词选意思
  DEFINITION_TO_WORD = "definition_to_word", // 给意思选单词
  AUDIO_TO_WORD = "audio_to_word", // 听发音选单词
}

// 单词学习状态
export interface WordLearningState {
  word: VocabularyWord
  testsPassed: {
    [TestType.WORD_TO_DEFINITION]: boolean
    [TestType.DEFINITION_TO_WORD]: boolean
    [TestType.AUDIO_TO_WORD]: boolean
  }
  correctCount: {
    [TestType.WORD_TO_DEFINITION]: number
    [TestType.DEFINITION_TO_WORD]: number
    [TestType.AUDIO_TO_WORD]: number
  }
  completed: boolean
}

// 测试项
export interface TestItem {
  wordId: string
  testType: TestType
  word: string
  definition: string
  options: Array<{
    text: string
    isCorrect: boolean
  }>
  audioUrl?: string // 用于听发音测试
}

// 学习管理器类
export class LearningManager {
  private words: VocabularyWord[] = []
  private wordStates: Map<string, WordLearningState> = new Map()
  private testQueue: Array<{ wordId: string; testType: TestType }> = []
  private currentTestIndex = 0
  private retestDelay = 5 // 重测延迟题数

  /**
   * 初始化学习管理器
   * @param words 要学习的单词列表
   */
  constructor(words: VocabularyWord[]) {
    this.words = [...words]
    this.initializeWordStates()
    this.initializeTestQueue()
  }

  /**
   * 初始化每个单词的学习状态
   */
  private initializeWordStates(): void {
    this.words.forEach((word) => {
      this.wordStates.set(word.id, {
        word,
        testsPassed: {
          [TestType.WORD_TO_DEFINITION]: false,
          [TestType.DEFINITION_TO_WORD]: false,
          [TestType.AUDIO_TO_WORD]: false,
        },
        correctCount: {
          [TestType.WORD_TO_DEFINITION]: 0,
          [TestType.DEFINITION_TO_WORD]: 0,
          [TestType.AUDIO_TO_WORD]: 0,
        },
        completed: false,
      })
    })
  }

  /**
   * 初始化测试队列
   * 首先按顺序添加所有单词的三种测试类型
   */
  private initializeTestQueue(): void {
    // 首先添加所有"给单词选意思"的测试
    this.words.forEach((word) => {
      this.testQueue.push({ wordId: word.id, testType: TestType.WORD_TO_DEFINITION })
    })

    // 然后添加所有"给意思选单词"的测试
    this.words.forEach((word) => {
      this.testQueue.push({ wordId: word.id, testType: TestType.DEFINITION_TO_WORD })
    })

    // 最后添加所有"听发音选单词"的测试
    this.words.forEach((word) => {
      this.testQueue.push({ wordId: word.id, testType: TestType.AUDIO_TO_WORD })
    })
  }

  /**
   * 获取当前测试项
   * @returns 当前测试项
   */
  public getCurrentTest(): TestItem | null {
    if (this.currentTestIndex >= this.testQueue.length) {
      return null // 所有测试已完成
    }

    const { wordId, testType } = this.testQueue[this.currentTestIndex]
    const word = this.words.find((w) => w.id === wordId)

    if (!word) {
      return null
    }

    // 生成测试项
    return this.generateTestItem(word, testType)
  }

  /**
   * 生成测试项，包括一个正确选项和三个干扰项
   * @param word 当前单词
   * @param testType 测试类型
   * @returns 测试项
   */
  private generateTestItem(word: VocabularyWord, testType: TestType): TestItem {
    // 获取三个不同的干扰项
    const distractors = this.getDistractors(word.id, 3)

    let options: Array<{ text: string; isCorrect: boolean }> = []

    switch (testType) {
      case TestType.WORD_TO_DEFINITION:
        // 给单词选意思
        options = [
          { text: word.definition, isCorrect: true },
          ...distractors.map((d) => ({ text: d.definition, isCorrect: false })),
        ]
        break
      case TestType.DEFINITION_TO_WORD:
        // 给意思选单词
        options = [
          { text: word.word, isCorrect: true },
          ...distractors.map((d) => ({ text: d.word, isCorrect: false })),
        ]
        break
      case TestType.AUDIO_TO_WORD:
        // 听发音选单词
        options = [
          { text: word.word, isCorrect: true },
          ...distractors.map((d) => ({ text: d.word, isCorrect: false })),
        ]
        break
    }

    // 打乱选项顺序
    options = this.shuffleArray(options)

    return {
      wordId: word.id,
      testType,
      word: word.word,
      definition: word.definition,
      options,
      // 如果有音频URL，可以在这里添加
      audioUrl: this.getAudioUrl(word.word),
    }
  }

  /**
   * 获取干扰项
   * @param currentWordId 当前单词ID
   * @param count 需要的干扰项数量
   * @returns 干扰项数组
   */
  private getDistractors(currentWordId: string, count: number): VocabularyWord[] {
    // 过滤掉当前单词
    const otherWords = this.words.filter((w) => w.id !== currentWordId)

    // 如果可用单词不足，则重复使用
    if (otherWords.length < count) {
      const result: VocabularyWord[] = []
      while (result.length < count) {
        const randomIndex = Math.floor(Math.random() * otherWords.length)
        result.push(otherWords[randomIndex])
      }
      return result
    }

    // 随机选择指定数量的单词
    return this.shuffleArray([...otherWords]).slice(0, count)
  }

  /**
   * 打乱数组顺序
   * @param array 要打乱的数组
   * @returns 打乱后的数组
   */
  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  /**
   * 获取单词的音频URL（模拟）
   * @param word 单词
   * @returns 音频URL
   */
  private getAudioUrl(word: string): string {
    // 这里只是模拟，实际应用中应该使用真实的音频URL
    return `https://api.example.com/audio/${encodeURIComponent(word)}.mp3`
  }

  /**
   * 提交答案
   * @param isCorrect 答案是否正确
   * @returns 是否需要进入下一题
   */
  public submitAnswer(isCorrect: boolean): boolean {
    if (this.currentTestIndex >= this.testQueue.length) {
      return false
    }

    const { wordId, testType } = this.testQueue[this.currentTestIndex]
    const wordState = this.wordStates.get(wordId)

    if (!wordState) {
      return false
    }

    if (isCorrect) {
      // 答对了，增加正确计数
      wordState.correctCount[testType]++

      // 如果答对了，直接标记为通过
      wordState.testsPassed[testType] = true
    }

    // 检查是否需要重测
    if (!isCorrect) {
      // 如果答错了，添加到队列后面进行重测
      const insertPosition = Math.min(this.currentTestIndex + this.retestDelay, this.testQueue.length)
      this.testQueue.splice(insertPosition, 0, { wordId, testType })
    }

    // 检查单词是否完成所有测试
    if (
      wordState.testsPassed[TestType.WORD_TO_DEFINITION] &&
      wordState.testsPassed[TestType.DEFINITION_TO_WORD] &&
      wordState.testsPassed[TestType.AUDIO_TO_WORD]
    ) {
      wordState.completed = true
    }

    // 更新状态
    this.wordStates.set(wordId, wordState)

    // 移动到下一题
    this.currentTestIndex++
    return true
  }

  /**
   * 获取学习进度
   * @returns 学习进度信息
   */
  public getProgress(): {
    totalWords: number
    completedWords: number
    currentTestIndex: number
    totalTests: number
  } {
    const completedWords = Array.from(this.wordStates.values()).filter((state) => state.completed).length

    return {
      totalWords: this.words.length,
      completedWords,
      currentTestIndex: this.currentTestIndex,
      totalTests: this.testQueue.length,
    }
  }

  /**
   * 检查学习是否完成
   * @returns 是否完成
   */
  public isCompleted(): boolean {
    return this.currentTestIndex >= this.testQueue.length
  }

  /**
   * 获取所有单词的学习状态
   * @returns 单词学习状态映射
   */
  public getWordStates(): Map<string, WordLearningState> {
    return new Map(this.wordStates)
  }

  /**
   * 重置学习进度
   */
  public reset(): void {
    this.initializeWordStates()
    this.initializeTestQueue()
    this.currentTestIndex = 0
  }
}

/**
 * 使用示例：
 *
 * // 初始化
 * const words = await getVocabularyWords();
 * const learningManager = new LearningManager(words.slice(0, 10)); // 取前10个单词
 *
 * // 获取当前测试
 * const currentTest = learningManager.getCurrentTest();
 *
 * // 提交答案
 * const moveToNext = learningManager.submitAnswer(true); // 答对了
 *
 * // 获取进度
 * const progress = learningManager.getProgress();
 */

