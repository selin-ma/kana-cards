import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCards } from './useCards'
import type { KanaCard, KanaData } from '../../types/kana'

const mockCards: KanaCard[] = [
  {
    id: 'a',
    roma: 'a',
    hira: 'あ',
    kata: 'ア',
    word_ja: '',
    word_zh: '',
    group: 'seion',
    row: 'あ行',
  },
  {
    id: 'ka',
    roma: 'ka',
    hira: 'か',
    kata: 'カ',
    word_ja: '',
    word_zh: '',
    group: 'seion',
    row: 'か行',
  },
  {
    id: 'ga',
    roma: 'ga',
    hira: 'が',
    kata: 'ガ',
    word_ja: '',
    word_zh: '',
    group: 'dakuten',
    row: 'か行',
  },
  {
    id: 'kya',
    roma: 'kya',
    hira: 'きゃ',
    kata: 'キャ',
    word_ja: '',
    word_zh: '',
    group: 'youon',
    row: 'か行',
  },
]

const mockData: KanaData = {
  meta: { version: '1', total: 4, groups: {} as KanaData['meta']['groups'] },
  cards: mockCards,
}

beforeEach(() => {
  vi.restoreAllMocks()
  globalThis.fetch = vi.fn(() =>
    Promise.resolve(new Response(JSON.stringify(mockData))),
  ) as unknown as typeof fetch
})

describe('useCards', () => {
  it('starts in loading state', () => {
    const { result } = renderHook(() => useCards({ groups: new Set(), rows: new Set() }))
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('loads cards on mount', async () => {
    const { result } = renderHook(() => useCards({ groups: new Set(), rows: new Set() }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.allCards.length).toBe(4)
  })

  it('sets error on fetch failure', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('Network error')))
    const { result } = renderHook(() => useCards({ groups: new Set(), rows: new Set() }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Failed to load kana data')
  })

  it('filters by group', async () => {
    const { result } = renderHook(() =>
      useCards({ groups: new Set(['dakuten' as const]), rows: new Set() }),
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.filtered).toHaveLength(1)
    expect(result.current.filtered[0].id).toBe('ga')
  })

  it('filters by row', async () => {
    const { result } = renderHook(() =>
      useCards({ groups: new Set(), rows: new Set(['あ行']) }),
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.filtered).toHaveLength(1)
    expect(result.current.filtered[0].id).toBe('a')
  })

  it('combines group and row filters', async () => {
    const { result } = renderHook(() =>
      useCards({
        groups: new Set(['seion' as const]),
        rows: new Set(['か行']),
      }),
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.filtered).toHaveLength(1)
    expect(result.current.filtered[0].id).toBe('ka')
  })

  it('availableRows reflects group filter', async () => {
    const { result } = renderHook(() =>
      useCards({ groups: new Set(['youon' as const]), rows: new Set() }),
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.availableRows).toEqual(['か行'])
  })

  it('availableRows is sorted by ROW_ORDER', async () => {
    const { result } = renderHook(() => useCards({ groups: new Set(), rows: new Set() }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.availableRows).toEqual(['あ行', 'か行'])
  })

  it('getSorted returns cards in kana order', async () => {
    const { result } = renderHook(() => useCards({ groups: new Set(), rows: new Set() }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    const sorted = result.current.getSorted()
    expect(sorted[0].id).toBe('a')
  })

  it('getShuffled returns cards in different order', async () => {
    const { result } = renderHook(() => useCards({ groups: new Set(), rows: new Set() }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    const shuffled = result.current.getShuffled()
    expect(shuffled).toHaveLength(4)
    const ids = shuffled.map((c) => c.id)
    expect(ids.sort()).toEqual(['a', 'ga', 'ka', 'kya'])
  })
})
