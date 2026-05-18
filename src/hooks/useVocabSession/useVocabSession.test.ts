import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVocabSession } from './useVocabSession'
import type { Word } from '../../types/vocab'

function makeWord(id: string): Word {
  return {
    id,
    chapter_id: 'ch1',
    order_idx: 1,
    kana: id,
    kanji: null,
    meaning_zh: '',
    pos: null,
    pitch_accent: null,
    example_ja: null,
    example_zh: null,
    notes: null,
    audio_url: null,
    audio_example_url: null,
  }
}

describe('useVocabSession', () => {
  it('initial state is idle', () => {
    const { result } = renderHook(() => useVocabSession())
    expect(result.current.state.status).toBe('idle')
    expect(result.current.state.queue).toEqual([])
    expect(result.current.state.currentIndex).toBe(0)
    expect(result.current.currentWord).toBeNull()
  })

  it('start populates queue and transitions to playing', () => {
    const { result } = renderHook(() => useVocabSession())
    const words = [makeWord('a'), makeWord('b')]
    act(() => result.current.start(words))
    expect(result.current.state.status).toBe('playing')
    expect(result.current.state.queue).toEqual(words)
    expect(result.current.currentWord).toEqual(words[0])
  })

  it('rate(3) marks Good and advances index', () => {
    const { result } = renderHook(() => useVocabSession())
    const words = [makeWord('a'), makeWord('b')]
    act(() => result.current.start(words))
    act(() => result.current.rate(3))
    expect(result.current.state.answers['a']).toBe(3)
    expect(result.current.state.currentIndex).toBe(1)
    expect(result.current.counts.good).toBe(1)
  })

  it('last rate transitions to finished', () => {
    const { result } = renderHook(() => useVocabSession())
    const words = [makeWord('a')]
    act(() => result.current.start(words))
    act(() => result.current.rate(3))
    expect(result.current.state.status).toBe('finished')
  })

  it('skip adds to skipped', () => {
    const { result } = renderHook(() => useVocabSession())
    const words = [makeWord('a'), makeWord('b')]
    act(() => result.current.start(words))
    act(() => result.current.skip())
    expect(result.current.state.answers['a']).toBe('skipped')
    expect(result.current.counts.skipped).toBe(1)
  })

  it('resume past queue transitions to finished', () => {
    const { result } = renderHook(() => useVocabSession())
    const words = [makeWord('a')]
    act(() => result.current.resume(words, 1, {}))
    expect(result.current.state.status).toBe('finished')
  })

  it('resume empty queue transitions to idle', () => {
    const { result } = renderHook(() => useVocabSession())
    act(() => result.current.resume([], 1, {}))
    expect(result.current.state.status).toBe('idle')
  })

  it('counts computed correctly across ratings', () => {
    const { result } = renderHook(() => useVocabSession())
    const words = [
      makeWord('a'),
      makeWord('b'),
      makeWord('c'),
      makeWord('d'),
      makeWord('e'),
    ]
    act(() => result.current.start(words))
    act(() => result.current.rate(1)) // Again
    act(() => result.current.rate(2)) // Hard
    act(() => result.current.rate(3)) // Good
    act(() => result.current.rate(4)) // Easy
    act(() => result.current.skip()) // skipped
    expect(result.current.counts).toEqual({
      again: 1,
      hard: 1,
      good: 1,
      easy: 1,
      skipped: 1,
    })
  })

  it('goBack at start is no-op', () => {
    const { result } = renderHook(() => useVocabSession())
    const words = [makeWord('a'), makeWord('b')]
    act(() => result.current.start(words))
    act(() => result.current.goBack())
    expect(result.current.state.currentIndex).toBe(0)
  })

  it('goNext at end is no-op', () => {
    const { result } = renderHook(() => useVocabSession())
    const words = [makeWord('a')]
    act(() => result.current.start(words))
    act(() => result.current.goNext())
    expect(result.current.state.currentIndex).toBe(0)
  })

  it('restart resets state', () => {
    const { result } = renderHook(() => useVocabSession())
    const words = [makeWord('a'), makeWord('b')]
    act(() => result.current.start(words))
    act(() => result.current.rate(3))
    act(() => result.current.restart(words))
    expect(result.current.state.currentIndex).toBe(0)
    expect(result.current.state.answers).toEqual({})
    expect(result.current.state.status).toBe('playing')
  })

  it('exit returns to idle', () => {
    const { result } = renderHook(() => useVocabSession())
    const words = [makeWord('a')]
    act(() => result.current.start(words))
    act(() => result.current.exit())
    expect(result.current.state.status).toBe('idle')
    expect(result.current.state.queue).toEqual([])
  })

  it('rate is no-op when not playing', () => {
    const { result } = renderHook(() => useVocabSession())
    act(() => result.current.rate(3))
    expect(result.current.state.status).toBe('idle')
  })

  it('skip is no-op when not playing', () => {
    const { result } = renderHook(() => useVocabSession())
    act(() => result.current.skip())
    expect(result.current.state.status).toBe('idle')
  })
})
