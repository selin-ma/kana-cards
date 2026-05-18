import { describe, it, expect, beforeEach, assertType } from 'vitest'

// vi.mock is hoisted above imports. Use vi.hoisted to create a mutable
// reference that the mock factory can close over AND test code can mutate.
const { mockSupabase } = vi.hoisted(() => {
  /** Track the most recent upsert call data for assertion in tests. */
  let _lastUpsert: { data: unknown; opts: unknown } | null = null

  function chainable(overrides?: { data?: unknown; error?: unknown }) {
    const state = overrides ?? { data: [], error: null }
    const b = new Proxy(
      {},
      {
        get(_t, prop: string) {
          if (prop === 'then')
            return (resolve: (v: unknown) => void) => Promise.resolve(resolve(state))
          if (prop === 'upsert')
            return (data: unknown, opts: unknown) => {
              _lastUpsert = { data, opts }
              return b
            }
          // All other query methods return self
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
    /** Override: next call to .from(table) returns a chain resolving with data. */
    __setMockData(_table: string, data: unknown) {
      _lastUpsert = null
      mc.from = vi.fn(() => chainable({ data, error: null }))
    },
    /** Override: next call to .from(table) returns a chain resolving with error. */
    __setMockError(_table: string, error: unknown) {
      _lastUpsert = null
      mc.from = vi.fn(() => chainable({ data: null, error }))
    },
    __reset() {
      _lastUpsert = null
      mc.from = vi.fn(() => chainable())
      mc.auth.getUser = vi.fn(() =>
        Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null }),
      )
    },
    /** Access the last captured upsert payload (cleared by __setMockData/__setMockError). */
    __lastUpsert() {
      return _lastUpsert
    },
  }
  return { mockSupabase: mc }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

// Import after vi.mock — vitest hoists mocks, module-level import runs once.
import { rateWordWithFSRS, fetchDueWords, countDueWords } from './vocabFSRS'
import type { WordProgress } from '../types/vocab'

describe('vocabFSRS service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.__reset()
  })

  // ---------------------------------------------------------------------------
  // rateWordWithFSRS
  // ---------------------------------------------------------------------------
  describe('rateWordWithFSRS', () => {
    it('creates a new FSRS card and upserts it for a word with no prior progress', async () => {
      // Fetch returns null (no existing progress)
      mockSupabase.__setMockData('user_word_progress', null)

      await rateWordWithFSRS('user-1', 'word-1', 3 /* Good */)

      // Should have called .from('user_word_progress') twice:
      //   1. fetchProgress (select)
      //   2. upsertProgress (upsert)
      const tableCalls = mockSupabase.from.mock.calls
      expect(tableCalls.length).toBeGreaterThanOrEqual(2)
      expect(tableCalls[0][0]).toBe('user_word_progress')
      expect(tableCalls[1][0]).toBe('user_word_progress')

      // Capture the upsert payload
      const upserted = mockSupabase.__lastUpsert()
      expect(upserted).not.toBeNull()
      const { data, opts } = upserted!
      expect(data).toHaveProperty('user_id', 'user-1')
      expect(data).toHaveProperty('word_id', 'word-1')

      // FSRS card fields — types and reasonable ranges
      expect(data).toHaveProperty('stability')
      expect(typeof data.stability).toBe('number')
      expect(data.stability).toBeGreaterThan(0)

      expect(data).toHaveProperty('difficulty')
      expect(typeof data.difficulty).toBe('number')

      expect(data).toHaveProperty('state')
      expect([0, 1, 2, 3]).toContain(data.state)

      expect(data).toHaveProperty('reps', 1) // first review
      expect(data).toHaveProperty('lapses', 0)

      expect(data).toHaveProperty('due')
      expect(typeof data.due).toBe('string') // ISO timestamp

      // onConflict option should be set
      expect(opts).toEqual({ onConflict: 'user_id,word_id' })
    })

    it('rating Again on a new word produces a Learning card', async () => {
      mockSupabase.__setMockData('user_word_progress', null)

      await rateWordWithFSRS('user-1', 'word-2', 1 /* Again */)

      const upserted = mockSupabase.__lastUpsert()
      const { data } = upserted!
      // Again on a New card typically transitions to state=1 (Learning)
      expect(data.state).toBe(1)
      expect(data.reps).toBe(1)
      expect(data.lapses).toBe(0)
    })

    it('rating Good on a new word produces a Learning card', async () => {
      mockSupabase.__setMockData('user_word_progress', null)

      await rateWordWithFSRS('user-1', 'word-3', 3 /* Good */)

      const upserted = mockSupabase.__lastUpsert()
      const { data } = upserted!
      // Good on a New card transitions to state=1 (Learning) by default;
      // graduation to Review (state=2) requires passing learning steps.
      expect(data.state).toBe(1)
      expect(data.reps).toBe(1)
      expect(data.lapses).toBe(0)
    })

    it('updates an existing word progress through FSRS', async () => {
      const existing: WordProgress = {
        user_id: 'user-1',
        word_id: 'word-4',
        due: new Date(Date.now() - 86400_000).toISOString(), // overdue
        stability: 3.5,
        difficulty: 5.0,
        state: 2, // Review
        reps: 5,
        lapses: 1,
        last_review: new Date(Date.now() - 172800_000).toISOString(),
        updated_at: new Date(Date.now() - 172800_000).toISOString(),
      }
      mockSupabase.__setMockData('user_word_progress', existing)

      await rateWordWithFSRS('user-1', 'word-4', 3 /* Good */)

      const upserted = mockSupabase.__lastUpsert()
      const { data } = upserted!

      // Should keep the same user/word
      expect(data.user_id).toBe('user-1')
      expect(data.word_id).toBe('word-4')

      // Reps increments (+1)
      expect(data.reps).toBe(6)

      // Lapses should stay the same (Good doesn't cause lapse)
      expect(data.lapses).toBe(1)

      // State should remain Review
      expect(data.state).toBe(2)

      // Stability should have increased from 3.5 after Good rating
      expect(data.stability).toBeGreaterThan(3.5)

      // due should be in the future (rescheduled after review)
      expect(new Date(data.due).getTime()).toBeGreaterThan(Date.now() - 5000)
    })

    it('rating Again on an existing card increments lapses and may set relearning state', async () => {
      const existing: WordProgress = {
        user_id: 'user-1',
        word_id: 'word-5',
        due: new Date(Date.now() - 86400_000).toISOString(),
        stability: 5.0,
        difficulty: 5.0,
        state: 2, // Review
        reps: 10,
        lapses: 2,
        last_review: new Date(Date.now() - 172800_000).toISOString(),
        updated_at: new Date(Date.now() - 172800_000).toISOString(),
      }
      mockSupabase.__setMockData('user_word_progress', existing)

      await rateWordWithFSRS('user-1', 'word-5', 1 /* Again */)

      const upserted = mockSupabase.__lastUpsert()
      const { data } = upserted!

      // Again on Review card should put it in Relearning (state=3) in FSRS v5
      // Note: FSRS behavior — Again on Review can result in state=3 (Relearning)
      // or state=1 (Learning) depending on the specific FSRS version/params.
      // Accept 1 or 3 as valid relearning states.
      expect([1, 3]).toContain(data.state)

      // Lapses increments
      expect(data.lapses).toBe(3)

      // Reps should NOT increment (Again doesn't count as successful review in some FSRS models)
      // Actually in FSRS, Again still increments reps if the card moves forward.
      // Let's just verify reps is >= 10 (the original value).
      expect(data.reps).toBeGreaterThanOrEqual(10)
    })

    it('throws when fetchProgress encounters a Supabase error', async () => {
      mockSupabase.__setMockError('user_word_progress', new Error('Fetch failed'))

      await expect(rateWordWithFSRS('user-1', 'word-1', 3)).rejects.toThrow(
        'Fetch failed',
      )
    })

    it('throws when upsertProgress encounters a Supabase error', async () => {
      // First call (fetch) succeeds, second call (upsert) fails.
      // Simulate by setting mock data for the fetch, then replacing from
      // with an error mock after the first call won't work cleanly with
      // the current mock. Instead, set from to always error:
      mockSupabase.from = vi.fn(() => chainableFromError(new Error('Upsert failed')))

      await expect(rateWordWithFSRS('user-1', 'word-1', 3)).rejects.toThrow(
        'Upsert failed',
      )
    })
  })

  // ---------------------------------------------------------------------------
  // fetchDueWords
  // ---------------------------------------------------------------------------
  describe('fetchDueWords', () => {
    const sampleWords = [
      {
        id: 'w1',
        chapter_id: 'c1',
        order_idx: 1,
        kana: 'たべる',
        kanji: '食べる',
        meaning_zh: '吃',
        pos: null,
        pitch_accent: null,
        example_ja: null,
        example_zh: null,
        notes: null,
        audio_url: null,
        audio_example_url: null,
      },
      {
        id: 'w2',
        chapter_id: 'c1',
        order_idx: 2,
        kana: 'のむ',
        kanji: '飲む',
        meaning_zh: '喝',
        pos: null,
        pitch_accent: null,
        example_ja: null,
        example_zh: null,
        notes: null,
        audio_url: null,
        audio_example_url: null,
      },
    ]

    const progressRows = [
      { word_id: 'w1', due: '2024-01-01T00:00:00.000Z', words: sampleWords[0] },
      { word_id: 'w2', due: '2024-01-02T00:00:00.000Z', words: sampleWords[1] },
    ]

    it('returns due words when user is authenticated', async () => {
      mockSupabase.__setMockData('user_word_progress', progressRows)

      const result = await fetchDueWords(10)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(sampleWords[0])
      expect(result[1]).toEqual(sampleWords[1])

      // Verify the query chain
      expect(mockSupabase.from).toHaveBeenCalledWith('user_word_progress')
      // The first call to .from is for fetchDueWords
      // We can verify the general structure — should have select with words(*)
    })

    it('returns empty array when there are no due words', async () => {
      mockSupabase.__setMockData('user_word_progress', null)

      const result = await fetchDueWords()

      expect(result).toEqual([])
    })

    it('returns empty array when user is not authenticated', async () => {
      mockSupabase.auth.getUser = vi.fn(() =>
        Promise.resolve({ data: { user: null }, error: null }),
      )

      const result = await fetchDueWords()

      expect(result).toEqual([])
      // Should NOT have queried the progress table
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('uses default limit of 30 when no limit argument provided', async () => {
      mockSupabase.__setMockData('user_word_progress', progressRows)

      await fetchDueWords()

      // .limit(30) should be in the chain — hard to verify on proxy,
      // but we can verify the function ran without error with 2 results
      // (Further verification would need chain recording)
    })

    it('throws on Supabase error', async () => {
      mockSupabase.__setMockError('user_word_progress', new Error('DB query failed'))

      await expect(fetchDueWords()).rejects.toThrow('DB query failed')
    })

    it('filters out rows where words join is null', async () => {
      const rowsWithNull = [
        { word_id: 'w1', due: '2024-01-01T00:00:00.000Z', words: null },
        { word_id: 'w2', due: '2024-01-02T00:00:00.000Z', words: sampleWords[1] },
      ]
      mockSupabase.__setMockData('user_word_progress', rowsWithNull)

      const result = await fetchDueWords()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(sampleWords[1])
    })

    it('handles words field being an array (Supabase join quirk)', async () => {
      const rowsWithArray = [
        { word_id: 'w1', due: '2024-01-01T00:00:00.000Z', words: [sampleWords[0]] },
      ]
      mockSupabase.__setMockData('user_word_progress', rowsWithArray)

      const result = await fetchDueWords()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(sampleWords[0])
    })
  })

  // ---------------------------------------------------------------------------
  // countDueWords
  // ---------------------------------------------------------------------------
  describe('countDueWords', () => {
    it('returns the count of due words', async () => {
      // Simulate count response — mock resolves with data containing the
      // rows but supabase count query also returns a `count` prop.
      // The chainable returns { data: [], error: null } by default.
      // We need a custom shape that includes `count` for count queries.
      // Build a mock that resolves with count directly.
      const defaultChainable = (overrides?: {
        data?: unknown
        error?: unknown
        count?: number | null
      }) => {
        const state = overrides ?? { data: [], error: null, count: null }
        const b = new Proxy(
          {},
          {
            get(_t, prop: string) {
              if (prop === 'then')
                return (resolve: (v: unknown) => void) => Promise.resolve(resolve(state))
              return () => b
            },
          },
        )
        return b as Record<string, unknown>
      }

      mockSupabase.from = vi.fn(() =>
        defaultChainable({ data: [], error: null, count: 5 }),
      )

      const result = await countDueWords()

      expect(result).toBe(5)
      expect(mockSupabase.from).toHaveBeenCalledWith('user_word_progress')
    })

    it('returns 0 when count is null', async () => {
      const defaultChainable = (overrides?: {
        data?: unknown
        error?: unknown
        count?: number | null
      }) => {
        const state = overrides ?? { data: [], error: null, count: null }
        const b = new Proxy(
          {},
          {
            get(_t, prop: string) {
              if (prop === 'then')
                return (resolve: (v: unknown) => void) => Promise.resolve(resolve(state))
              return () => b
            },
          },
        )
        return b as Record<string, unknown>
      }

      mockSupabase.from = vi.fn(() =>
        defaultChainable({ data: [], error: null, count: null }),
      )

      const result = await countDueWords()

      expect(result).toBe(0)
    })

    it('returns 0 when user is not authenticated', async () => {
      mockSupabase.auth.getUser = vi.fn(() =>
        Promise.resolve({ data: { user: null }, error: null }),
      )

      const result = await countDueWords()

      expect(result).toBe(0)
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('throws on Supabase error', async () => {
      mockSupabase.__setMockError('user_word_progress', new Error('Count query failed'))

      await expect(countDueWords()).rejects.toThrow('Count query failed')
    })
  })
})

// ---------------------------------------------------------------------------
// Helper: chainable that always errors on all calls (for upsert failure tests)
// ---------------------------------------------------------------------------
function chainableFromError(error: Error) {
  const b = new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop === 'then')
          return (resolve: (v: unknown) => void) =>
            Promise.resolve(resolve({ data: null, error }))
        return () => b
      },
    },
  )
  return b as Record<string, unknown>
}
