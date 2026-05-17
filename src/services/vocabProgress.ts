import { supabase } from '../lib/supabase'
import type { Rating } from '../types/vocab'

export type VocabSessionMode = 'new_chapter' | 'due_review' | 'mixed'

export interface VocabSessionRecord {
  id: string
  user_id: string
  book_id: string | null
  chapter_id: string | null
  mode: VocabSessionMode
  total: number
  again_count: number
  hard_count: number
  good_count: number
  easy_count: number
  skipped_count: number
  created_at: string
}

export interface VocabSessionWithMeta extends VocabSessionRecord {
  book_title: string | null
  chapter_title: string | null
}

interface BatchInput {
  // Both nullable: due_review sessions span chapters and may span books,
  // so the session row has no single book/chapter to point at.
  book_id: string | null
  chapter_id: string | null
  mode: VocabSessionMode
  total: number
  counts: {
    again: number
    hard: number
    good: number
    easy: number
    skipped: number
  }
  attempts: Array<{ word_id: string; rating: Rating }>
}

// Persist one finished/exited practice session: one vocab_sessions row +
// N vocab_attempts rows. The RLS policies on these tables enforce that
// rows are tied to auth.uid(), so user_id is filled by the policy +
// default; we don't need to pass it explicitly here (the policy's
// with_check on auth.uid() = user_id requires user_id to be present,
// so include it via auth.getUser if you hit RLS errors).
export async function saveVocabSessionBatch(input: BatchInput): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('not authenticated')

  const { data: sessionRow, error: sErr } = await supabase
    .from('vocab_sessions')
    .insert({
      user_id: user.id,
      book_id: input.book_id,
      chapter_id: input.chapter_id,
      mode: input.mode,
      total: input.total,
      again_count: input.counts.again,
      hard_count: input.counts.hard,
      good_count: input.counts.good,
      easy_count: input.counts.easy,
      skipped_count: input.counts.skipped,
    })
    .select('id')
    .single()
  if (sErr) throw sErr
  const sessionId = (sessionRow as { id: string }).id

  if (input.attempts.length > 0) {
    const rows = input.attempts.map((a) => ({
      user_id: user.id,
      session_id: sessionId,
      word_id: a.word_id,
      rating: a.rating,
    }))
    const { error: aErr } = await supabase.from('vocab_attempts').insert(rows)
    if (aErr) throw aErr
  }

  return sessionId
}

export async function fetchVocabHistory(limit = 50): Promise<VocabSessionWithMeta[]> {
  const { data, error } = await supabase
    .from('vocab_sessions')
    .select(
      'id, user_id, book_id, chapter_id, mode, total, again_count, hard_count, good_count, easy_count, skipped_count, created_at, books(title), chapters(title)',
    )
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  // Supabase nested-select on to-one relations: runtime is a single
  // object (or null), but TS sometimes infers it as an array. Cast
  // through unknown to bypass the over-strict inference.
  type Row = VocabSessionRecord & {
    books: { title: string } | { title: string }[] | null
    chapters: { title: string } | { title: string }[] | null
  }
  const pickTitle = (v: Row['books'] | Row['chapters']): string | null => {
    if (!v) return null
    if (Array.isArray(v)) return v[0]?.title ?? null
    return v.title
  }
  return (data ?? []).map((r) => {
    const row = r as unknown as Row
    return {
      ...row,
      book_title: pickTitle(row.books),
      chapter_title: pickTitle(row.chapters),
    } as VocabSessionWithMeta
  })
}

export async function deleteVocabSessions(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase.from('vocab_sessions').delete().in('id', ids)
  if (error) throw error
}
