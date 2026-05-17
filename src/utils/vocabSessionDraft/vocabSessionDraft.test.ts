import { describe, it, expect, beforeEach } from 'vitest'
import { saveVocabDraft, loadVocabDraft, clearVocabDraft } from './vocabSessionDraft'
import type { VocabSessionDraft, VocabAnswer } from './vocabSessionDraft'

const USER_A = 'user-a'

const draft: VocabSessionDraft = {
  bookId: 'book-1',
  chapterId: 'ch-1',
  queueIds: ['w1', 'w2', 'w3'],
  currentIndex: 0,
  answers: { w1: 3, w2: 'skipped' },
  startedAt: '2026-01-01T00:00:00.000Z',
}

describe('vocabSessionDraft', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and loads a draft round-trip', () => {
    saveVocabDraft(USER_A, draft)
    expect(loadVocabDraft(USER_A)).toEqual(draft)
  })

  it('uses different key prefix than kana sessionDraft', () => {
    saveVocabDraft(USER_A, draft)
    // kana draft should not find vocab draft
    expect(localStorage.getItem('kana-jump:draft:user-a')).toBeNull()
    expect(localStorage.getItem('kana-jump:vocab-draft:user-a')).not.toBeNull()
  })

  it('returns null on missing draft', () => {
    expect(loadVocabDraft(USER_A)).toBeNull()
  })

  it('returns null on corrupted JSON', () => {
    localStorage.setItem('kana-jump:vocab-draft:user-a', 'bad{json')
    expect(loadVocabDraft(USER_A)).toBeNull()
  })

  it('clears the draft', () => {
    saveVocabDraft(USER_A, draft)
    clearVocabDraft(USER_A)
    expect(loadVocabDraft(USER_A)).toBeNull()
  })

  it('preserves VocabAnswer values (Rating | "skipped")', () => {
    // VocabAnswer = Rating (1-4) | 'skipped'
    const answers: VocabAnswer[] = [1, 2, 3, 4, 'skipped']
    expect(answers).toHaveLength(5)
    // Verify they survive JSON round-trip
    const stored = JSON.stringify(answers)
    const parsed = JSON.parse(stored) as VocabAnswer[]
    expect(parsed).toEqual([1, 2, 3, 4, 'skipped'])
  })
})
