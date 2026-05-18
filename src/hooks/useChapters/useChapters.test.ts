import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('../../services/vocab', () => ({
  fetchChapters: vi.fn(),
}))

import { useChapters } from './useChapters'
import { fetchChapters } from '../../services/vocab'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useChapters', () => {
  it('returns empty when bookId is null', () => {
    const { result } = renderHook(() => useChapters(null))
    expect(result.current.loading).toBe(false)
    expect(result.current.chapters).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('starts loading when bookId is provided', () => {
    vi.mocked(fetchChapters).mockResolvedValue([])
    const { result } = renderHook(() => useChapters('b1'))
    expect(result.current.loading).toBe(true)
  })

  it('loads chapters on mount', async () => {
    const mockChapters = [
      { id: 'ch1', book_id: 'b1', order_idx: 1, title: 'Lesson 1', word_count: 10 },
    ]
    vi.mocked(fetchChapters).mockResolvedValue(mockChapters)
    const { result } = renderHook(() => useChapters('b1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.chapters).toEqual(mockChapters)
    expect(result.current.error).toBeNull()
  })

  it('sets error on fetch failure', async () => {
    vi.mocked(fetchChapters).mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useChapters('b1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Network error')
    expect(result.current.chapters).toEqual([])
  })
})
