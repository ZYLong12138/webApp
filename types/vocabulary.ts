export interface VocabularyWord {
  id: string | number
  word: string
  definition: string
  example: string | null
  pronunciation?: string
  mastery_level: number
  last_reviewed: string | null
  created_at?: string
  vedio?: string
}

export interface NewVocabularyWord {
  word: string
  definition: string
  example?: string | null
  pronunciation?: string
  mastery_level?: number
  vedio?: string
}

export interface VocabularyBook {
  id: string | number
  book_name: string
  description: string
  created_at?: string
}

export interface BookWordMapping {
  id: string
  book_id: string
  word_id: string
  created_at?: string
}


