import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const mockSaveSession = vi.fn()
const mockGetSessions = vi.fn()
const mockGetCardStats = vi.fn()
const mockDeleteRecords = vi.fn()
const mockClearAll = vi.fn()

vi.mock('../../services/supabaseStorage', () => ({
  supabaseStorage: {
    saveSession: (...args: unknown[]) => mockSaveSession(...args),
    getSessions: (...args: unknown[]) => mockGetSessions(...args),
    getCardStats: (...args: unknown[]) => mockGetCardStats(...args),
    deleteRecords: (...args: unknown[]) => mockDeleteRecords(...args),
    clearAll: (...args: unknown[]) => mockClearAll(...args),
  },
}))

import { useHistory } from './useHistory'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useHistory', () => {
  it('loadAll loads sessions and card stats', async () => {
    const mockSessions = [
      {
        id: 's1',
        created_at: '2024-01-01',
        total: 5,
        correct: 3,
        wrong: 1,
        skipped: 1,
        filter_groups: [],
        filter_rows: [],
      },
    ]
    const mockStats = { a: { correct: 1, wrong: 0, skipped: 0 } }
    mockGetSessions.mockResolvedValue(mockSessions)
    mockGetCardStats.mockResolvedValue(mockStats)
    const { result } = renderHook(() => useHistory())
    await act(async () => {
      await result.current.loadAll()
    })
    expect(result.current.records).toEqual(mockSessions)
    expect(result.current.cardStats).toEqual(mockStats)
    expect(result.current.loading).toBe(false)
  })

  it('addRecord saves session and reloads', async () => {
    const mockSessions = [
      {
        id: 's1',
        created_at: '2024-01-01',
        total: 5,
        correct: 3,
        wrong: 1,
        skipped: 1,
        filter_groups: [],
        filter_rows: [],
      },
    ]
    mockGetSessions.mockResolvedValue(mockSessions)
    mockGetCardStats.mockResolvedValue({})
    mockSaveSession.mockResolvedValue(undefined)
    const { result } = renderHook(() => useHistory())
    const card = {
      id: 'a',
      roma: 'a',
      hira: '\u3042',
      kata: '\u30a2',
      word_ja: '',
      word_zh: '',
      group: 'seion' as const,
      row: '\u3042\u884c',
    }
    await act(async () => {
      await result.current.addRecord([card], [], [], {
        groups: new Set(),
        rows: new Set(),
      })
    })
    expect(mockSaveSession).toHaveBeenCalledOnce()
    expect(result.current.records).toEqual(mockSessions)
  })

  it('deleteRecords deletes and reloads', async () => {
    mockGetSessions.mockResolvedValue([])
    mockGetCardStats.mockResolvedValue({})
    mockDeleteRecords.mockResolvedValue(undefined)
    const { result } = renderHook(() => useHistory())
    await act(async () => {
      await result.current.deleteRecords(['s1'])
    })
    expect(mockDeleteRecords).toHaveBeenCalledWith(['s1'])
    expect(mockGetSessions).toHaveBeenCalled()
  })

  it('clearAll clears records and card stats', async () => {
    mockClearAll.mockResolvedValue(undefined)
    const { result } = renderHook(() => useHistory())
    mockGetSessions.mockResolvedValue([{ id: 's1' }] as never)
    mockGetCardStats.mockResolvedValue({ a: { correct: 1, wrong: 0, skipped: 0 } })
    await act(async () => {
      await result.current.loadAll()
    })
    await act(async () => {
      await result.current.clearAll()
    })
    expect(mockClearAll).toHaveBeenCalledOnce()
    expect(result.current.records).toEqual([])
    expect(result.current.cardStats).toEqual({})
  })
})
