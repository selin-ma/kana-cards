import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSession } from './useSession'
import type { KanaCard } from '../../types/kana'

function makeCard(id: string): KanaCard {
  return {
    id,
    roma: id,
    hira: '',
    kata: '',
    word_ja: '',
    word_zh: '',
    group: 'seion',
    row: 'あ行',
  }
}

describe('useSession', () => {
  it('initial state is idle with empty queue', () => {
    const { result } = renderHook(() => useSession())
    expect(result.current.state.status).toBe('idle')
    expect(result.current.state.queue).toEqual([])
    expect(result.current.state.currentIndex).toBe(0)
    expect(result.current.state.answers).toEqual({})
    expect(result.current.currentCard).toBeNull()
    expect(result.current.remaining).toBe(0)
  })

  it('start populates queue and transitions to playing', () => {
    const { result } = renderHook(() => useSession())
    const cards = [makeCard('a'), makeCard('i')]
    act(() => result.current.start(cards))
    expect(result.current.state.status).toBe('playing')
    expect(result.current.state.queue).toEqual(cards)
    expect(result.current.state.currentIndex).toBe(0)
    expect(result.current.currentCard).toEqual(cards[0])
  })

  it('answer(true) records correct and advances index', () => {
    const { result } = renderHook(() => useSession())
    const cards = [makeCard('a'), makeCard('i')]
    act(() => result.current.start(cards))
    act(() => result.current.answer(true))
    expect(result.current.state.answers['a']).toBe(true)
    expect(result.current.state.currentIndex).toBe(1)
  })

  it('answer(false) records wrong and advances index', () => {
    const { result } = renderHook(() => useSession())
    const cards = [makeCard('a'), makeCard('i')]
    act(() => result.current.start(cards))
    act(() => result.current.answer(false))
    expect(result.current.state.answers['a']).toBe(false)
    expect(result.current.state.currentIndex).toBe(1)
  })

  it('last answer transitions to finished', () => {
    const { result } = renderHook(() => useSession())
    const cards = [makeCard('a')]
    act(() => result.current.start(cards))
    act(() => result.current.answer(true))
    expect(result.current.state.status).toBe('finished')
  })

  it('skip adds to skipped and advances', () => {
    const { result } = renderHook(() => useSession())
    const cards = [makeCard('a'), makeCard('i')]
    act(() => result.current.start(cards))
    act(() => result.current.skip())
    expect(result.current.state.answers['a']).toBe('skipped')
    expect(result.current.state.currentIndex).toBe(1)
  })

  it('goBack decrements index', () => {
    const { result } = renderHook(() => useSession())
    const cards = [makeCard('a'), makeCard('i')]
    act(() => result.current.start(cards))
    act(() => result.current.answer(true))
    expect(result.current.state.currentIndex).toBe(1)
    act(() => result.current.goBack())
    expect(result.current.state.currentIndex).toBe(0)
  })

  it('goBack at start is no-op', () => {
    const { result } = renderHook(() => useSession())
    const cards = [makeCard('a'), makeCard('i')]
    act(() => result.current.start(cards))
    act(() => result.current.goBack())
    expect(result.current.state.currentIndex).toBe(0)
  })

  it('goNext increments index', () => {
    const { result } = renderHook(() => useSession())
    const cards = [makeCard('a'), makeCard('i')]
    act(() => result.current.start(cards))
    act(() => result.current.goNext())
    expect(result.current.state.currentIndex).toBe(1)
  })

  it('goNext at end is no-op', () => {
    const { result } = renderHook(() => useSession())
    const cards = [makeCard('a')]
    act(() => result.current.start(cards))
    act(() => result.current.goNext())
    expect(result.current.state.currentIndex).toBe(0)
  })

  it('resume restores full state', () => {
    const { result } = renderHook(() => useSession())
    const cards = [makeCard('a'), makeCard('i')]
    act(() => result.current.resume(cards, 1, { a: true }))
    expect(result.current.state.status).toBe('playing')
    expect(result.current.state.queue).toEqual(cards)
    expect(result.current.state.currentIndex).toBe(1)
    expect(result.current.state.answers).toEqual({ a: true })
  })

  it('restart resets to fresh play', () => {
    const { result } = renderHook(() => useSession())
    const cards = [makeCard('a'), makeCard('i')]
    act(() => result.current.start(cards))
    act(() => result.current.answer(true))
    act(() => result.current.restart(cards))
    expect(result.current.state.currentIndex).toBe(0)
    expect(result.current.state.answers).toEqual({})
    expect(result.current.state.status).toBe('playing')
  })

  it('backToFilter returns to idle', () => {
    const { result } = renderHook(() => useSession())
    const cards = [makeCard('a')]
    act(() => result.current.start(cards))
    act(() => result.current.backToFilter())
    expect(result.current.state.status).toBe('idle')
  })

  it('computes correct/wrong/skipped from answers', () => {
    const { result } = renderHook(() => useSession())
    const cards = [makeCard('a'), makeCard('i'), makeCard('u')]
    act(() => result.current.start(cards))
    act(() => result.current.answer(true))
    act(() => result.current.answer(false))
    act(() => result.current.skip())
    expect(result.current.correct).toEqual([cards[0]])
    expect(result.current.wrong).toEqual([cards[1]])
    expect(result.current.skipped).toEqual([cards[2]])
  })

  it('remaining decreases as index advances', () => {
    const { result } = renderHook(() => useSession())
    const cards = [makeCard('a'), makeCard('i'), makeCard('u')]
    act(() => result.current.start(cards))
    expect(result.current.remaining).toBe(3)
    act(() => result.current.answer(true))
    expect(result.current.remaining).toBe(2)
    act(() => result.current.answer(true))
    expect(result.current.remaining).toBe(1)
  })
})
