/**
 * Abstract storage interface — swap this implementation for WX Cloud
 * or any other backend without touching hooks or components.
 */

import type { KanaCard } from '../types/kana'
import type { FilterState } from '../hooks/useCards'

export interface SessionRecord {
  id: string
  created_at: string
  total: number
  correct: number
  wrong: number
  skipped: number
  filter_groups: string[]
  filter_rows: string[]
}

export type CardStats = Record<
  string,
  { correct: number; wrong: number; skipped: number }
>

export interface SessionAttempt {
  card_id: string
  result: 'correct' | 'wrong' | 'skipped'
}

export interface IStorageService {
  saveSession(
    correct: KanaCard[],
    wrong: KanaCard[],
    skipped: KanaCard[],
    filter: FilterState,
  ): Promise<void>

  getSessions(): Promise<SessionRecord[]>

  getSessionAttempts(sessionId: string): Promise<SessionAttempt[]>

  getCardStats(): Promise<CardStats>

  deleteRecords(ids: string[]): Promise<void>

  clearAll(): Promise<void>
}
