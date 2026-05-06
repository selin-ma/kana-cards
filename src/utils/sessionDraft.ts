import type { CardAnswer } from '../hooks/useSession'

export interface SessionDraft {
  queueIds: string[]
  currentIndex: number
  answers: Record<string, CardAnswer>
  filterGroups: string[]
  filterRows: string[]
  startedAt: string
}

function draftKey(userId: string) {
  return `kana-jump:draft:${userId}`
}

export function saveDraft(userId: string, draft: SessionDraft): void {
  try {
    localStorage.setItem(draftKey(userId), JSON.stringify(draft))
  } catch {}
}

export function loadDraft(userId: string): SessionDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(userId))
    return raw ? (JSON.parse(raw) as SessionDraft) : null
  } catch {
    return null
  }
}

export function clearDraft(userId: string): void {
  try {
    localStorage.removeItem(draftKey(userId))
  } catch {}
}
