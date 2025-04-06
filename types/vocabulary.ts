export interface VocabularyWord {
  id: string | number
  word: string
  definition: string
  example: string | null
  pronunciation?: string
  mastery_level: number
  last_reviewed: string | null
  created_at?: string
}

export interface NewVocabularyWord {
  word: string
  definition: string
  example?: string | null
  pronunciation?: string
}

export interface VocabularyBook {
  id: string | number
  book_name: string
  description: string
}

export interface BookWordMapping {
  book_id: string | number
  word_id: number | number
}


