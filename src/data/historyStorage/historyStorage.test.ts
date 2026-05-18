import { describe, it, expect, beforeEach } from 'vitest'
import { loadHistory, saveRecord, clearHistory } from './historyStorage'
import type { SessionRecord } from './historyStorage'

const makeRecord = (id: string): SessionRecord => ({
  id,
  date: '2026-01-01T00:00:00.000Z',
  total: 10,
  correct: 7,
  wrong: 2,
  skipped: 1,
  groups: ['seion'],
  rows: [],
})

describe('historyStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty array when no history exists', () => {
    expect(loadHistory()).toEqual([])
  })

  it('parses valid JSON from localStorage', () => {
    const record = makeRecord('1')
    localStorage.setItem('kana-history', JSON.stringify([record]))
    expect(loadHistory()).toEqual([record])
  })

  it('returns empty array on corrupted JSON', () => {
    localStorage.setItem('kana-history', 'not-json{{{')
    expect(loadHistory()).toEqual([])
  })

  it('prepends new records (newest first)', () => {
    saveRecord(makeRecord('1'))
    saveRecord(makeRecord('2'))
    const history = loadHistory()
    expect(history[0].id).toBe('2')
    expect(history[1].id).toBe('1')
  })

  it('enforces MAX_RECORDS = 100', () => {
    for (let i = 0; i < 110; i++) {
      saveRecord(makeRecord(String(i)))
    }
    expect(loadHistory()).toHaveLength(100)
  })

  it('removes history key on clearHistory', () => {
    saveRecord(makeRecord('1'))
    clearHistory()
    expect(localStorage.getItem('kana-history')).toBeNull()
  })

  it('persists data across save/load cycles', () => {
    const r1 = makeRecord('1')
    const r2 = makeRecord('2')
    saveRecord(r1)
    saveRecord(r2)
    const loaded = loadHistory()
    expect(loaded).toEqual([r2, r1])
    // Re-load from same store
    expect(loadHistory()).toEqual(loaded)
  })
})
