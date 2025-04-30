export interface VocabularyWord {
  id: string | number
  word: string
  definition: string
  example: string | null
  pronunciation?: string
  mastery_level: number
  last_reviewed: string | null
  created_at?: string
  has_mastery_data?: boolean
  notes?: string // 用户添加的笔记
  is_favorite?: boolean // 是否收藏
}

export interface NewVocabularyWord {
  word: string
  definition: string
  example?: string | null
  pronunciation?: string
}

export interface VocabularyBook {
  id: string
  book_name: string
  description: string
}

export interface BookWordMapping {
  book_id: string
  word_id: number
}

export interface UserVocabularyWord {
  id: string | number
  user_id: string
  word_id: string | number
  notes?: string
  is_favorite: boolean
  created_at: string
  updated_at: string
}
