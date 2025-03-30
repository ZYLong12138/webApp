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

