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
import {
  saveVocabSessionBatch,
  fetchVocabHistory,
  deleteVocabSessions,
} from './vocabProgress'

describe('vocabProgress service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.__reset()
  })

  describe('saveVocabSessionBatch', () => {
    const validInput = {
      book_id: 'book-1',
      chapter_id: 'chapter-1',
      mode: 'new_chapter' as const,
      total: 5,
      counts: { again: 1, hard: 1, good: 2, easy: 1, skipped: 0 },
      attempts: [
        { word_id: 'w1', rating: 3 as const }, // Good
        { word_id: 'w2', rating: 1 as const }, // Again
      ],
    }

    it('creates a session and attempts, returns the session id', async () => {
      mockSupabase.__setMockData('vocab_sessions', { id: 'session-123' })

      const result = await saveVocabSessionBatch(validInput)

      expect(result).toBe('session-123')
      expect(mockSupabase.from).toHaveBeenCalledWith('vocab_sessions')
      expect(mockSupabase.from).toHaveBeenCalledWith('vocab_attempts')
    })

    it('skips vocab_attempts insert when attempts array is empty', async () => {
      mockSupabase.__setMockData('vocab_sessions', { id: 'session-456' })

      const input = { ...validInput, attempts: [] }
      const result = await saveVocabSessionBatch(input)

      expect(result).toBe('session-456')
      expect(mockSupabase.from).toHaveBeenCalledWith('vocab_sessions')
      expect(mockSupabase.from).not.toHaveBeenCalledWith('vocab_attempts')
    })

    it('throws when user is not authenticated', async () => {
      mockSupabase.auth.getUser = vi.fn(() =>
        Promise.resolve({ data: { user: null }, error: null }),
      )

      await expect(saveVocabSessionBatch(validInput)).rejects.toThrow('not authenticated')
    })

    it('throws on Supabase error during session insert', async () => {
      mockSupabase.__setMockError('vocab_sessions', new Error('insert failed'))

      await expect(saveVocabSessionBatch(validInput)).rejects.toThrow('insert failed')
    })
  })

  describe('fetchVocabHistory', () => {
    it('returns sessions with book and chapter titles mapped', async () => {
      const rows = [
        {
          id: 's1',
          user_id: 'test-user-id',
          book_id: 'b1',
          chapter_id: 'c1',
          mode: 'new_chapter',
          total: 5,
          again_count: 1,
          hard_count: 0,
          good_count: 3,
          easy_count: 1,
          skipped_count: 0,
          created_at: '2025-01-01T00:00:00Z',
          books: { title: 'N5' },
          chapters: { title: '第1课' },
        },
        {
          id: 's2',
          user_id: 'test-user-id',
          book_id: null,
          chapter_id: null,
          mode: 'due_review',
          total: 10,
          again_count: 2,
          hard_count: 2,
          good_count: 5,
          easy_count: 1,
          skipped_count: 0,
          created_at: '2025-01-02T00:00:00Z',
          books: null,
          chapters: null,
        },
      ]

      mockSupabase.__setMockData('vocab_sessions', rows)

      const result = await fetchVocabHistory()

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        id: 's1',
        book_title: 'N5',
        chapter_title: '第1课',
      })
      expect(result[0].book_id).toBe('b1')
      expect(result[1]).toMatchObject({
        id: 's2',
        book_title: null,
        chapter_title: null,
      })
      expect(mockSupabase.from).toHaveBeenCalledWith('vocab_sessions')
    })

    it('handles array-form join results (Supabase type quirk)', async () => {
      const row = {
        id: 's1',
        user_id: 'test-user-id',
        book_id: 'b1',
        chapter_id: 'c1',
        mode: 'new_chapter',
        total: 3,
        again_count: 0,
        hard_count: 0,
        good_count: 3,
        easy_count: 0,
        skipped_count: 0,
        created_at: '2025-01-01T00:00:00Z',
        books: [{ title: 'N5' }],
        chapters: [{ title: '第1课' }],
      }

      mockSupabase.__setMockData('vocab_sessions', [row])

      const result = await fetchVocabHistory()

      expect(result[0].book_title).toBe('N5')
      expect(result[0].chapter_title).toBe('第1课')
    })

    it('returns empty array when no data', async () => {
      mockSupabase.__setMockData('vocab_sessions', null)

      const result = await fetchVocabHistory()
      expect(result).toEqual([])
    })

    it('throws on Supabase error', async () => {
      mockSupabase.__setMockError('vocab_sessions', new Error('DB error'))

      await expect(fetchVocabHistory()).rejects.toThrow('DB error')
    })
  })

  describe('deleteVocabSessions', () => {
    it('deletes sessions by the given IDs', async () => {
      mockSupabase.__setMockData('vocab_sessions', null)

      await deleteVocabSessions(['s1', 's2'])

      expect(mockSupabase.from).toHaveBeenCalledWith('vocab_sessions')
    })

    it('is a no-op when ids array is empty (returns early)', async () => {
      await deleteVocabSessions([])

      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('throws on Supabase error', async () => {
      mockSupabase.__setMockError('vocab_sessions', new Error('delete failed'))

      await expect(deleteVocabSessions(['s1'])).rejects.toThrow('delete failed')
    })
  })
})
