import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('../../services/vocab', () => ({
  fetchWordsByChapter: vi.fn(),
}))

import { useWords } from './useWords'
import { fetchWordsByChapter } from '../../services/vocab'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useWords', () => {
  it('returns empty when chapterId is null', () => {
    const { result } = renderHook(() => useWords(null))
    expect(result.current.loading).toBe(false)
    expect(result.current.words).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('starts loading when chapterId is provided', () => {
    vi.mocked(fetchWordsByChapter).mockResolvedValue([])
    const { result } = renderHook(() => useWords('ch1'))
    expect(result.current.loading).toBe(true)
  })

  it('loads words on mount', async () => {
    const mockWords = [
      {
        id: 'w1',
        chapter_id: 'ch1',
        order_idx: 1,
        kana: '\u3042',
        kanji: null,
        meaning_zh: '',
        pos: null,
        pitch_accent: null,
        example_ja: null,
        example_zh: null,
        notes: null,
        audio_url: null,
        audio_example_url: null,
      },
    ]
    vi.mocked(fetchWordsByChapter).mockResolvedValue(mockWords)
    const { result } = renderHook(() => useWords('ch1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.words).toEqual(mockWords)
    expect(result.current.error).toBeNull()
  })

  it('sets error on fetch failure', async () => {
    vi.mocked(fetchWordsByChapter).mockRejectedValue(new Error('DB error'))
    const { result } = renderHook(() => useWords('ch1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('DB error')
    expect(result.current.words).toEqual([])
  })
})
