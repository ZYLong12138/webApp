export interface VocabularyWord {
  id: string
  word: string
  definition: string
  example: string
  mastery_level: number
  last_reviewed: string | null
  created_at: string
}

export interface NewVocabularyWord {
  word: string
  definition: string
  example: string
}

