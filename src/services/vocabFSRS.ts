import {
  FSRS,
  createEmptyCard,
  generatorParameters,
  type Card,
  type Grade,
} from 'ts-fsrs'
import { supabase } from '../lib/supabase'
import type { Rating, Word, WordProgress, WordState } from '../types/vocab'

// FSRS algorithm instance with default parameters. Default retention
// target = 0.9 (90% recall probability at scheduled review). Tunable later.
const fsrs = new FSRS(generatorParameters())

function rowToCard(p: WordProgress | null): Card {
  if (!p) return createEmptyCard()
  return {
    due: new Date(p.due),
    stability: p.stability,
    difficulty: p.difficulty,
    elapsed_days: 0, // recomputed by fsrs.next() from due/last_review
    scheduled_days: 0,
    learning_steps: 0,
    reps: p.reps,
    lapses: p.lapses,
    state: p.state,
    last_review: p.last_review ? new Date(p.last_review) : undefined,
  }
}

async function fetchProgress(
  userId: string,
  wordId: string,
): Promise<WordProgress | null> {
  const { data, error } = await supabase
    .from('user_word_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('word_id', wordId)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as WordProgress | null
}

async function upsertProgress(userId: string, wordId: string, card: Card): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await supabase.from('user_word_progress').upsert(
    {
      user_id: userId,
      word_id: wordId,
      due: card.due.toISOString(),
      stability: card.stability,
      difficulty: card.difficulty,
      state: card.state as WordState,
      reps: card.reps,
      lapses: card.lapses,
      last_review: card.last_review ? card.last_review.toISOString() : now,
      updated_at: now,
    },
    { onConflict: 'user_id,word_id' },
  )
  if (error) throw error
}

// Run FSRS for one user-rating event and persist the resulting card.
// Fire-and-forget from caller; errors are surfaced via the returned
// promise (caller should at least .catch(console.error)).
export async function rateWordWithFSRS(
  userId: string,
  wordId: string,
  rating: Rating,
): Promise<void> {
  const current = await fetchProgress(userId, wordId)
  const card = rowToCard(current)
  const { card: next } = fsrs.next(card, new Date(), rating as Grade)
  await upsertProgress(userId, wordId, next)
}

// Fetch words whose `due` time is in the past or now, across all chapters.
// Joins `words` to return full Word objects ordered by oldest-due-first.
export async function fetchDueWords(limit = 30): Promise<Word[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('user_word_progress')
    .select('word_id, due, words(*)')
    .eq('user_id', user.id)
    .lte('due', new Date().toISOString())
    .order('due', { ascending: true })
    .limit(limit)
  if (error) throw error
  type Row = { word_id: string; due: string; words: Word | Word[] | null }
  const rows = (data ?? []) as unknown as Row[]
  return rows
    .map((r) => (Array.isArray(r.words) ? r.words[0] : r.words))
    .filter((w): w is Word => !!w)
}

export async function countDueWords(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 0
  const { count, error } = await supabase
    .from('user_word_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('due', new Date().toISOString())
  if (error) throw error
  return count ?? 0
}
