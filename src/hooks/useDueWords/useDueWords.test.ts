import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

vi.mock('../../services/vocabFSRS', () => ({
  countDueWords: vi.fn(),
  fetchDueWords: vi.fn(),
}))

import { useDueWords } from './useDueWords'
import { countDueWords, fetchDueWords } from '../../services/vocabFSRS'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useDueWords', () => {
  it('does not fetch when disabled', () => {
    const { result } = renderHook(() => useDueWords(false))
    expect(result.current.count).toBe(0)
    expect(result.current.loading).toBe(false)
    expect(countDueWords).not.toHaveBeenCalled()
  })

  it('loads count when enabled', async () => {
    vi.mocked(countDueWords).mockResolvedValue(5)
    const { result } = renderHook(() => useDueWords(true))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.count).toBe(5)
  })

  it('refresh manually reloads count', async () => {
    vi.mocked(countDueWords).mockResolvedValue(3)
    const { result } = renderHook(() => useDueWords(false))
    expect(result.current.count).toBe(0)
    vi.mocked(countDueWords).mockResolvedValue(7)
    await act(() => result.current.refresh())
    expect(result.current.count).toBe(7)
  })

  it('fetch returns words from service', async () => {
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
    vi.mocked(fetchDueWords).mockResolvedValue(mockWords)
    const { result } = renderHook(() => useDueWords(false))
    const words = await result.current.fetch(10)
    expect(words).toEqual(mockWords)
    expect(fetchDueWords).toHaveBeenCalledWith(10)
  })

  it('handles count error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(countDueWords).mockRejectedValue(new Error('fail'))
    const { result } = renderHook(() => useDueWords(true))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.count).toBe(0)
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
