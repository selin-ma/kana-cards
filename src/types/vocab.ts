export interface Book {
  id: string
  code: string
  title: string
  publisher: string | null
  total_chapters: number
}

export interface Chapter {
  id: string
  book_id: string
  order_idx: number
  title: string
  word_count: number
}

export interface Word {
  id: string
  chapter_id: string
  order_idx: number
  kana: string
  kanji: string | null
  meaning_zh: string
  pos: string[] | null
  pitch_accent: number | null
  example_ja: string | null
  example_zh: string | null
  notes: string | null
  audio_url: string | null
  audio_example_url: string | null
}

// FSRS card state (matches ts-fsrs State enum numerically)
export type WordState = 0 | 1 | 2 | 3 // New / Learning / Review / Relearning

export interface WordProgress {
  user_id: string
  word_id: string
  due: string // ISO timestamp
  stability: number
  difficulty: number
  state: WordState
  reps: number
  lapses: number
  last_review: string | null
  updated_at: string
}

// FSRS rating
export const RATING = {
  Again: 1,
  Hard: 2,
  Good: 3,
  Easy: 4,
} as const
export type Rating = (typeof RATING)[keyof typeof RATING]
