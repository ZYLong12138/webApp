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
  id: string
  book_name: string
  description: string
}

export interface BookWordMapping {
  book_id: string
  word_id: number
}


// 单词表数据结构
export interface VocabularyWord {
  id: number;           // int8 类型
  words: string;        // text 类型
  pronunciation: string; // text 类型
  MainMeaning: string;  // text 类型
  translation: string;  // text 类型
}

// 新增单词时的数据结构（不包含 id，因为 id 由数据库自动生成）
export interface NewVocabularyWord {
  words: string;
  pronunciation: string;
  mainMeaning: string;
  translation: string;
}

