/**
 * Session history — persisted to localStorage as JSON.
 *
 * Schema (array of SessionRecord):
 * [
 *   {
 *     "id": "1714204800000",
 *     "date": "2026-04-27T10:00:00.000Z",
 *     "total": 46,
 *     "correct": 38,
 *     "wrong": 6,
 *     "skipped": 2,
 *     "groups": ["seion"],
 *     "rows": ["か行", "さ行"]
 *   },
 *   ...
 * ]
 */

export interface SessionRecord {
  id: string
  date: string
  total: number
  correct: number
  wrong: number
  skipped: number
  groups: string[]
  rows: string[]
}

const KEY = 'kana-history'
const MAX_RECORDS = 100

export function loadHistory(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw) as SessionRecord[]
  } catch {
    return []
  }
}

export function saveRecord(record: SessionRecord): void {
  const existing = loadHistory()
  const next = [record, ...existing].slice(0, MAX_RECORDS)
  localStorage.setItem(KEY, JSON.stringify(next))
}

export function clearHistory(): void {
  localStorage.removeItem(KEY)
}
