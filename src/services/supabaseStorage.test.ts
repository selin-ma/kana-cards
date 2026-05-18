import { describe, it, expect, beforeEach } from 'vitest'

// vi.mock is hoisted above imports. Use vi.hoisted to create a mutable
// reference that the mock factory can close over AND test code can mutate.
const { mockSupabase } = vi.hoisted(() => {
  function chainable(overrides?: { data?: unknown; error?: unknown }) {
    const state = overrides ?? { data: [], error: null }
    const b = new Proxy(
      {},
      {
        get(_t, prop: string) {
          if (prop === 'then')
            return (resolve: (v: unknown) => void) => Promise.resolve(resolve(state))
          // All query methods (.select, .eq, .order, .single, .maybeSingle,
          // .limit, .insert, .upsert, .delete, .in, .gte, .lte) return self
          return () => b
        },
      },
    )
    return b as Record<string, unknown>
  }

  const mc = {
    from: vi.fn(() => chainable()),
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null }),
      ),
    },
    /**
     * Override: next call to .from(table) returns a chain that resolves
     * with the given `data` and no error.
     */
    __setMockData(_table: string, data: unknown) {
      mc.from = vi.fn(() => chainable({ data, error: null }))
    },
    /**
     * Override: next call to .from(table) returns a chain that rejects
     * the promise-style resolve by passing an error.
     */
    __setMockError(_table: string, error: unknown) {
      mc.from = vi.fn(() => chainable({ data: null, error }))
    },
    __reset() {
      mc.from = vi.fn(() => chainable())
      mc.auth.getUser = vi.fn(() =>
        Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null }),
      )
    },
  }
  return { mockSupabase: mc }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

// Must import after vi.mock — vitest hoists mock calls but the
// module-level import in lib/supabase.ts only runs once on first import.
import { supabaseStorage } from './supabaseStorage'
import type { KanaCard } from '../types/kana'
import type { FilterState } from '../hooks/useCards'

// ── helpers ──────────────────────────────────────────────────────────

function makeCard(id: string, overrides?: Partial<KanaCard>): KanaCard {
  return {
    id,
    roma: '',
    hira: '',
    kata: '',
    word_ja: '',
    word_zh: '',
    group: 'seion',
    row: 'a',
    ...overrides,
  }
}

function makeFilter(overrides?: Partial<FilterState>): FilterState {
  return {
    groups: new Set<'seion' | 'dakuten' | 'handakuten' | 'youon'>(['seion']),
    rows: new Set<string>(['a']),
    ...overrides,
  }
}

// ── tests ────────────────────────────────────────────────────────────

describe('supabaseStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.__reset()
  })

  // ── saveSession ─────────────────────────────────────────────────

  describe('saveSession', () => {
    it('inserts a session row and card_attempt rows', async () => {
      const correct = [makeCard('c1'), makeCard('c2')]
      const wrong = [makeCard('w1')]
      const skipped: KanaCard[] = []
      const filter = makeFilter()

      mockSupabase.__setMockData('sessions', { id: 'sess-1' })

      await supabaseStorage.saveSession(correct, wrong, skipped, filter)

      // auth lookup fired once
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1)

      // from() called for sessions then card_attempts (attempts.length > 0)
      expect(mockSupabase.from).toHaveBeenCalledTimes(2)
      expect(mockSupabase.from).toHaveBeenNthCalledWith(1, 'sessions')
      expect(mockSupabase.from).toHaveBeenNthCalledWith(2, 'card_attempts')
    })

    it('skips the card_attempts insert when no cards are provided', async () => {
      mockSupabase.__setMockData('sessions', { id: 'sess-2' })

      await supabaseStorage.saveSession([], [], [], makeFilter())

      // only the sessions insert should fire
      expect(mockSupabase.from).toHaveBeenCalledTimes(1)
      expect(mockSupabase.from).toHaveBeenCalledWith('sessions')
    })

    it('throws "Not authenticated" when auth.getUser returns no user', async () => {
      mockSupabase.auth.getUser = vi.fn(() =>
        Promise.resolve({ data: { user: null }, error: null }),
      )

      await expect(supabaseStorage.saveSession([], [], [], makeFilter())).rejects.toThrow(
        'Not authenticated',
      )
    })

    it('throws when the session insert fails', async () => {
      mockSupabase.__setMockError('sessions', new Error('Insert failed'))

      await expect(
        supabaseStorage.saveSession([makeCard('c1')], [], [], makeFilter()),
      ).rejects.toThrow('Insert failed')
    })
  })

  // ── getSessionAttempts ──────────────────────────────────────────

  describe('getSessionAttempts', () => {
    it('returns attempts for a given session', async () => {
      const attempts = [
        { card_id: 'c1', result: 'correct' },
        { card_id: 'c2', result: 'wrong' },
      ]
      mockSupabase.__setMockData('card_attempts', attempts)

      const result = await supabaseStorage.getSessionAttempts('sess-1')

      expect(result).toEqual(attempts)
      expect(mockSupabase.from).toHaveBeenCalledWith('card_attempts')
    })

    it('returns an empty array when the query returns null', async () => {
      mockSupabase.__setMockData('card_attempts', null)

      const result = await supabaseStorage.getSessionAttempts('sess-1')

      expect(result).toEqual([])
    })

    it('throws on a Supabase error', async () => {
      mockSupabase.__setMockError('card_attempts', new Error('Query failed'))

      await expect(supabaseStorage.getSessionAttempts('sess-1')).rejects.toThrow(
        'Query failed',
      )
    })
  })

  // ── getSessions ─────────────────────────────────────────────────

  describe('getSessions', () => {
    it('returns sessions ordered by created_at desc, limited to 100', async () => {
      const sessions = [
        {
          id: 's1',
          created_at: '2025-01-02',
          total: 10,
          correct: 8,
          wrong: 1,
          skipped: 1,
          filter_groups: ['seion'],
          filter_rows: ['a'],
        },
        {
          id: 's2',
          created_at: '2025-01-01',
          total: 5,
          correct: 3,
          wrong: 2,
          skipped: 0,
          filter_groups: ['dakuten'],
          filter_rows: ['ka'],
        },
      ]
      mockSupabase.__setMockData('sessions', sessions)

      const result = await supabaseStorage.getSessions()

      expect(result).toEqual(sessions)
      expect(mockSupabase.from).toHaveBeenCalledWith('sessions')
    })

    it('returns an empty array when no sessions exist', async () => {
      mockSupabase.__setMockData('sessions', null)

      const result = await supabaseStorage.getSessions()

      expect(result).toEqual([])
    })

    it('throws on a Supabase error', async () => {
      mockSupabase.__setMockError('sessions', new Error('Query failed'))

      await expect(supabaseStorage.getSessions()).rejects.toThrow('Query failed')
    })
  })

  // ── getCardStats ────────────────────────────────────────────────

  describe('getCardStats', () => {
    it('aggregates correct / wrong / skipped counts per card', async () => {
      const attempts = [
        { card_id: 'c1', result: 'correct' },
        { card_id: 'c1', result: 'correct' },
        { card_id: 'c1', result: 'wrong' },
        { card_id: 'c2', result: 'wrong' },
        { card_id: 'c2', result: 'skipped' },
        { card_id: 'c3', result: 'correct' },
      ]
      mockSupabase.__setMockData('card_attempts', attempts)

      const result = await supabaseStorage.getCardStats()

      expect(result).toEqual({
        c1: { correct: 2, wrong: 1, skipped: 0 },
        c2: { correct: 0, wrong: 1, skipped: 1 },
        c3: { correct: 1, wrong: 0, skipped: 0 },
      })
    })

    it('returns an empty object when no attempts exist', async () => {
      mockSupabase.__setMockData('card_attempts', null)

      const result = await supabaseStorage.getCardStats()

      expect(result).toEqual({})
    })

    it('throws on a Supabase error', async () => {
      mockSupabase.__setMockError('card_attempts', new Error('Stats error'))

      await expect(supabaseStorage.getCardStats()).rejects.toThrow('Stats error')
    })
  })

  // ── deleteRecords ───────────────────────────────────────────────

  describe('deleteRecords', () => {
    it('deletes sessions by the given ids', async () => {
      mockSupabase.__setMockData('sessions', null)

      await supabaseStorage.deleteRecords(['s1', 's2', 's3'])

      expect(mockSupabase.from).toHaveBeenCalledWith('sessions')
    })

    it('handles an empty ids array gracefully', async () => {
      mockSupabase.__setMockData('sessions', null)

      await supabaseStorage.deleteRecords([])

      expect(mockSupabase.from).toHaveBeenCalledWith('sessions')
    })
  })

  // ── clearAll ────────────────────────────────────────────────────

  describe('clearAll', () => {
    it('deletes all sessions where created_at >= epoch', async () => {
      mockSupabase.__setMockData('sessions', null)

      await supabaseStorage.clearAll()

      expect(mockSupabase.from).toHaveBeenCalledWith('sessions')
    })
  })
})
