import { supabase } from '../lib/supabase'
import type { IStorageService, SessionRecord, SessionAttempt, CardStats } from './storage'
import type { KanaCard } from '../types/kana'
import type { FilterState } from '../hooks/useCards'

export const supabaseStorage: IStorageService = {
  async saveSession(
    correct: KanaCard[],
    wrong: KanaCard[],
    skipped: KanaCard[],
    filter: FilterState,
  ) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: session, error: sessionErr } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        total: correct.length + wrong.length + skipped.length,
        correct: correct.length,
        wrong: wrong.length,
        skipped: skipped.length,
        filter_groups: [...filter.groups],
        filter_rows: [...filter.rows],
      })
      .select('id')
      .single()

    if (sessionErr || !session) throw sessionErr

    const attempts = [
      ...correct.map(c => ({ user_id: user.id, session_id: session.id, card_id: c.id, result: 'correct' as const })),
      ...wrong.map(c => ({ user_id: user.id, session_id: session.id, card_id: c.id, result: 'wrong' as const })),
      ...skipped.map(c => ({ user_id: user.id, session_id: session.id, card_id: c.id, result: 'skipped' as const })),
    ]

    if (attempts.length > 0) {
      const { error: attemptsErr } = await supabase.from('card_attempts').insert(attempts)
      if (attemptsErr) throw attemptsErr
    }
  },

  async getSessionAttempts(sessionId: string): Promise<SessionAttempt[]> {
    const { data, error } = await supabase
      .from('card_attempts')
      .select('card_id, result')
      .eq('session_id', sessionId)

    if (error) throw error
    return (data ?? []) as SessionAttempt[]
  },

  async getSessions(): Promise<SessionRecord[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return (data ?? []) as SessionRecord[]
  },

  async getCardStats(): Promise<CardStats> {
    const { data, error } = await supabase
      .from('card_attempts')
      .select('card_id, result')

    if (error) throw error

    const stats: CardStats = {}
    for (const row of data ?? []) {
      if (!stats[row.card_id]) {
        stats[row.card_id] = { correct: 0, wrong: 0, skipped: 0 }
      }
      stats[row.card_id][row.result as 'correct' | 'wrong' | 'skipped']++
    }
    return stats
  },

  async deleteRecords(ids: string[]) {
    await supabase.from('sessions').delete().in('id', ids)
  },

  async clearAll() {
    await supabase.from('sessions').delete().gte('created_at', '1970-01-01')
  },
}
