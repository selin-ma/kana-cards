import type { Rating } from '../types/vocab'

// In-session answer: an FSRS rating, or 'skipped' (does not influence FSRS).
export type VocabAnswer = Rating | 'skipped'

export interface VocabSessionDraft {
  bookId: string
  chapterId: string
  queueIds: string[] // word UUIDs in the practice order
  currentIndex: number
  answers: Record<string, VocabAnswer>
  startedAt: string // ISO timestamp
}

const KEY_PREFIX = 'kana-jump:vocab-draft:'

function draftKey(userId: string) {
  return `${KEY_PREFIX}${userId}`
}

export function saveVocabDraft(userId: string, draft: VocabSessionDraft): void {
  try {
    localStorage.setItem(draftKey(userId), JSON.stringify(draft))
  } catch {}
}

export function loadVocabDraft(userId: string): VocabSessionDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(userId))
    return raw ? (JSON.parse(raw) as VocabSessionDraft) : null
  } catch {
    return null
  }
}

export function clearVocabDraft(userId: string): void {
  try {
    localStorage.removeItem(draftKey(userId))
  } catch {}
}
