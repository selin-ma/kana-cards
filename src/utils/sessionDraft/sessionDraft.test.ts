import { describe, it, expect, beforeEach } from 'vitest'
import { saveDraft, loadDraft, clearDraft } from './sessionDraft'
import type { SessionDraft } from './sessionDraft'

const USER_A = 'user-a'
const USER_B = 'user-b'

const draftA: SessionDraft = {
  queueIds: ['a', 'i', 'u'],
  currentIndex: 1,
  answers: { a: true, i: false },
  filterGroups: ['seion'],
  filterRows: [],
  startedAt: '2026-01-01T00:00:00.000Z',
}

describe('sessionDraft', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and loads a draft round-trip', () => {
    saveDraft(USER_A, draftA)
    const loaded = loadDraft(USER_A)
    expect(loaded).toEqual(draftA)
  })

  it('returns null when no draft exists for user', () => {
    expect(loadDraft(USER_A)).toBeNull()
  })

  it('returns null on corrupted JSON', () => {
    localStorage.setItem('kana-jump:draft:user-a', 'not-json{')
    expect(loadDraft(USER_A)).toBeNull()
  })

  it('removes the key on clearDraft', () => {
    saveDraft(USER_A, draftA)
    clearDraft(USER_A)
    expect(localStorage.getItem('kana-jump:draft:user-a')).toBeNull()
  })

  it('isolates drafts by userId', () => {
    saveDraft(USER_A, draftA)
    expect(loadDraft(USER_B)).toBeNull()
  })
})
