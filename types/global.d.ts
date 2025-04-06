import type { VocabularyWord } from './vocabulary'

declare global {
  // 全局词汇数据变量
  var globalVocabularyWord: VocabularyWord
  // 全局用户信息
  var globalUserId: string
  var globalUserName: string
}

// 初始化默认值
global.globalVocabularyWord = {
  id: 0,
  word: '',
  definition: '',
  example: null,
  mastery_level: 0,
  last_reviewed: null
}

global.globalUserId = ''
global.globalUserName = ''

export {} 