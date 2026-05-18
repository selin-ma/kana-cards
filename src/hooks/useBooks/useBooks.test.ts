import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('../../services/vocab', () => ({
  fetchBooks: vi.fn(),
}))

import { useBooks } from './useBooks'
import { fetchBooks } from '../../services/vocab'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useBooks', () => {
  it('starts in loading state', () => {
    vi.mocked(fetchBooks).mockResolvedValue([])
    const { result } = renderHook(() => useBooks())
    expect(result.current.loading).toBe(true)
    expect(result.current.books).toEqual([])
  })

  it('loads books on mount', async () => {
    const mockBooks = [
      { id: 'b1', code: 'tb', title: 'Test Book', publisher: null, total_chapters: 5 },
    ]
    vi.mocked(fetchBooks).mockResolvedValue(mockBooks)
    const { result } = renderHook(() => useBooks())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.books).toEqual(mockBooks)
    expect(result.current.error).toBeNull()
  })

  it('sets error on fetch failure', async () => {
    vi.mocked(fetchBooks).mockRejectedValue(new Error('API error'))
    const { result } = renderHook(() => useBooks())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('API error')
    expect(result.current.books).toEqual([])
  })
})
