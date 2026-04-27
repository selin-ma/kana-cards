import { useState, useCallback } from 'react'
import type { KanaCard } from '../types/kana'
import type { FilterState } from './useCards'
import { supabaseStorage } from '../services/supabaseStorage'
import type { SessionRecord, CardStats } from '../services/storage'

export type { SessionRecord, CardStats }

export function useHistory() {
  const [records, setRecords] = useState<SessionRecord[]>([])
  const [cardStats, setCardStats] = useState<CardStats>({})
  const [loading, setLoading] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [sessions, stats] = await Promise.all([
        supabaseStorage.getSessions(),
        supabaseStorage.getCardStats(),
      ])
      setRecords(sessions)
      setCardStats(stats)
    } catch (e) {
      console.error('Failed to load history', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const addRecord = useCallback(async (
    correct: KanaCard[],
    wrong: KanaCard[],
    skipped: KanaCard[],
    filter: FilterState,
  ) => {
    try {
      await supabaseStorage.saveSession(correct, wrong, skipped, filter)
      await loadAll()
    } catch (e) {
      console.error('Failed to save session', e)
    }
  }, [loadAll])

  const deleteRecords = useCallback(async (ids: string[]) => {
    try {
      await supabaseStorage.deleteRecords(ids)
      await loadAll()
    } catch (e) {
      console.error('Failed to delete records', e)
    }
  }, [loadAll])

  const clearAll = useCallback(async () => {
    try {
      await supabaseStorage.clearAll()
      setRecords([])
      setCardStats({})
    } catch (e) {
      console.error('Failed to clear history', e)
    }
  }, [])

  return { records, cardStats, loading, loadAll, addRecord, deleteRecords, clearAll }
}
