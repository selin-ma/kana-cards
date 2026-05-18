import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

vi.mock('../../services/vocabProgress', () => ({
  fetchVocabHistory: vi.fn(),
  deleteVocabSessions: vi.fn(),
}))

import { useVocabHistory } from './useVocabHistory'
import { fetchVocabHistory, deleteVocabSessions } from '../../services/vocabProgress'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useVocabHistory', () => {
  it('does not fetch when disabled', () => {
    const { result } = renderHook(() => useVocabHistory(false))
    expect(result.current.records).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(fetchVocabHistory).not.toHaveBeenCalled()
  })

  it('loads records when enabled', async () => {
    const mockRecords = [
      {
        id: 's1',
        created_at: '2024-01-01',
        total: 5,
        correct: 3,
        wrong: 1,
        skipped: 1,
        book_title: null,
        chapter_title: null,
      },
    ]
    vi.mocked(fetchVocabHistory).mockResolvedValue(mockRecords as never)
    const { result } = renderHook(() => useVocabHistory(true))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.records).toEqual(mockRecords)
    expect(result.current.error).toBeNull()
  })

  it('sets error on fetch failure', async () => {
    vi.mocked(fetchVocabHistory).mockRejectedValue(new Error('Query failed'))
    const { result } = renderHook(() => useVocabHistory(true))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Query failed')
    expect(result.current.records).toEqual([])
  })

  it('deleteRecords calls service and reloads', async () => {
    const mockRecords = [
      {
        id: 's1',
        created_at: '2024-01-01',
        total: 5,
        correct: 3,
        wrong: 1,
        skipped: 1,
        book_title: null,
        chapter_title: null,
      },
    ]
    vi.mocked(fetchVocabHistory).mockResolvedValue(mockRecords as never)
    vi.mocked(deleteVocabSessions).mockResolvedValue(undefined)
    const { result } = renderHook(() => useVocabHistory(true))
    await waitFor(() => expect(result.current.loading).toBe(false))
    vi.mocked(fetchVocabHistory).mockResolvedValue([] as never)
    await act(async () => {
      await result.current.deleteRecords(['s1'])
    })
    expect(deleteVocabSessions).toHaveBeenCalledWith(['s1'])
    expect(result.current.records).toEqual([])
  })

  it('deleteRecords sets error on failure', async () => {
    vi.mocked(fetchVocabHistory).mockResolvedValue([] as never)
    vi.mocked(deleteVocabSessions).mockRejectedValue(new Error('Delete failed'))
    const { result } = renderHook(() => useVocabHistory(true))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.deleteRecords(['s1'])
    })
    expect(result.current.error).toBe('Delete failed')
  })
})
