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
import { fetchBooks, fetchChapters, fetchWordsByChapter } from './vocab'

describe('vocab service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.__reset()
  })

  describe('fetchBooks', () => {
    it('returns books from Supabase', async () => {
      const books = [
        { id: '1', code: 'n5', title: 'N5', publisher: 'Pub', total_chapters: 10 },
        { id: '2', code: 'n4', title: 'N4', publisher: 'Pub', total_chapters: 8 },
      ]
      mockSupabase.__setMockData('books', books)

      const result = await fetchBooks()
      expect(result).toEqual(books)
      expect(mockSupabase.from).toHaveBeenCalledWith('books')
    })

    it('returns empty array when no data', async () => {
      mockSupabase.__setMockData('books', null)

      const result = await fetchBooks()
      expect(result).toEqual([])
    })

    it('throws on Supabase error', async () => {
      mockSupabase.__setMockError('books', new Error('DB error'))

      await expect(fetchBooks()).rejects.toThrow('DB error')
    })
  })

  describe('fetchChapters', () => {
    it('filters by bookId', async () => {
      const chapters = [
        { id: 'c1', book_id: 'b1', order_idx: 1, title: '第1课', word_count: 15 },
      ]
      mockSupabase.__setMockData('chapters', chapters)

      const result = await fetchChapters('b1')
      expect(result).toEqual(chapters)
      expect(mockSupabase.from).toHaveBeenCalledWith('chapters')
    })

    it('returns empty array when no chapters', async () => {
      mockSupabase.__setMockData('chapters', null)

      const result = await fetchChapters('b1')
      expect(result).toEqual([])
    })
  })

  describe('fetchWordsByChapter', () => {
    it('filters by chapterId', async () => {
      const words = [
        {
          id: 'w1',
          chapter_id: 'c1',
          order_idx: 1,
          kana: 'たべる',
          kanji: '食べる',
          meaning_zh: '吃',
        },
      ]
      mockSupabase.__setMockData('words', words)

      const result = await fetchWordsByChapter('c1')
      expect(result).toEqual(words)
      expect(mockSupabase.from).toHaveBeenCalledWith('words')
    })

    it('returns empty array when no words', async () => {
      mockSupabase.__setMockData('words', null)

      const result = await fetchWordsByChapter('c1')
      expect(result).toEqual([])
    })
  })
})
