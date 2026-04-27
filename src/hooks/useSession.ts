import { useState, useCallback } from 'react'
import type { KanaCard } from '../types/kana'

export type SessionStatus = 'idle' | 'playing' | 'finished'
export type CardAnswer = boolean | 'skipped'

export interface SessionState {
  status: SessionStatus
  queue: KanaCard[]
  currentIndex: number
  answers: Record<string, CardAnswer>
}

export function useSession() {
  const [state, setState] = useState<SessionState>({
    status: 'idle',
    queue: [],
    currentIndex: 0,
    answers: {},
  })

  const start = useCallback((cards: KanaCard[]) => {
    setState({ status: 'playing', queue: cards, currentIndex: 0, answers: {} })
  }, [])

  const answer = useCallback((remembered: boolean) => {
    setState((prev) => {
      const card = prev.queue[prev.currentIndex]
      if (!card) return prev
      const answers = { ...prev.answers, [card.id]: remembered }
      const nextIndex = prev.currentIndex + 1
      return {
        ...prev,
        answers,
        currentIndex: nextIndex,
        status: nextIndex >= prev.queue.length ? 'finished' : 'playing',
      }
    })
  }, [])

  const skip = useCallback(() => {
    setState((prev) => {
      const card = prev.queue[prev.currentIndex]
      if (!card) return prev
      const answers = { ...prev.answers, [card.id]: 'skipped' as const }
      const nextIndex = prev.currentIndex + 1
      return {
        ...prev,
        answers,
        currentIndex: nextIndex,
        status: nextIndex >= prev.queue.length ? 'finished' : 'playing',
      }
    })
  }, [])

  const goBack = useCallback(() => {
    setState((prev) => {
      if (prev.currentIndex <= 0) return prev
      return { ...prev, currentIndex: prev.currentIndex - 1 }
    })
  }, [])

  const goNext = useCallback(() => {
    setState((prev) => {
      if (prev.currentIndex >= prev.queue.length - 1) return prev
      return { ...prev, currentIndex: prev.currentIndex + 1 }
    })
  }, [])

  const restart = useCallback((cards: KanaCard[]) => {
    setState({ status: 'playing', queue: cards, currentIndex: 0, answers: {} })
  }, [])

  const backToFilter = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'idle' }))
  }, [])

  const currentCard = state.queue[state.currentIndex] ?? null
  const remaining = Math.max(0, state.queue.length - state.currentIndex)

  const correct = state.queue.filter((c) => state.answers[c.id] === true)
  const wrong = state.queue.filter((c) => state.answers[c.id] === false)
  const skipped = state.queue.filter((c) => state.answers[c.id] === 'skipped')

  return {
    state,
    currentCard,
    remaining,
    correct,
    wrong,
    skipped,
    start,
    answer,
    skip,
    goBack,
    goNext,
    restart,
    backToFilter,
  }
}
