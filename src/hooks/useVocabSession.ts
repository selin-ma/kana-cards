import { useState, useCallback } from 'react'
import type { Word, Rating } from '../types/vocab'
import type { VocabAnswer } from '../utils/vocabSessionDraft'

type Status = 'idle' | 'playing' | 'finished'

interface VocabSessionState {
  status: Status
  queue: Word[]
  currentIndex: number
  answers: Record<string, VocabAnswer>
}

const INITIAL: VocabSessionState = {
  status: 'idle',
  queue: [],
  currentIndex: 0,
  answers: {},
}

export function useVocabSession() {
  const [state, setState] = useState<VocabSessionState>(INITIAL)

  const start = useCallback((words: Word[]) => {
    setState({ status: 'playing', queue: words, currentIndex: 0, answers: {} })
  }, [])

  // Restore from a persisted draft (called after queue ids are resolved
  // back to Word objects). If the index is past the queue, jump to
  // finished so the UI shows results instead of getting stuck.
  const resume = useCallback(
    (
      queue: Word[],
      currentIndex: number,
      answers: Record<string, VocabAnswer>,
    ) => {
      if (queue.length === 0) {
        setState(INITIAL)
        return
      }
      const status: Status =
        currentIndex >= queue.length ? 'finished' : 'playing'
      setState({ status, queue, currentIndex, answers })
    },
    [],
  )

  const rate = useCallback((rating: Rating) => {
    setState((s) => {
      if (s.status !== 'playing') return s
      const word = s.queue[s.currentIndex]
      if (!word) return s
      const answers: Record<string, VocabAnswer> = {
        ...s.answers,
        [word.id]: rating,
      }
      const next = s.currentIndex + 1
      if (next >= s.queue.length) {
        return { ...s, answers, currentIndex: next, status: 'finished' }
      }
      return { ...s, answers, currentIndex: next }
    })
  }, [])

  const skip = useCallback(() => {
    setState((s) => {
      if (s.status !== 'playing') return s
      const word = s.queue[s.currentIndex]
      if (!word) return s
      const answers: Record<string, VocabAnswer> = {
        ...s.answers,
        [word.id]: 'skipped',
      }
      const next = s.currentIndex + 1
      if (next >= s.queue.length) {
        return { ...s, answers, currentIndex: next, status: 'finished' }
      }
      return { ...s, answers, currentIndex: next }
    })
  }, [])

  const goBack = useCallback(() => {
    setState((s) =>
      s.currentIndex === 0 ? s : { ...s, currentIndex: s.currentIndex - 1 },
    )
  }, [])

  const goNext = useCallback(() => {
    setState((s) =>
      s.currentIndex >= s.queue.length - 1
        ? s
        : { ...s, currentIndex: s.currentIndex + 1 },
    )
  }, [])

  const restart = useCallback((words: Word[]) => {
    setState({ status: 'playing', queue: words, currentIndex: 0, answers: {} })
  }, [])

  const exit = useCallback(() => setState(INITIAL), [])

  const currentWord = state.queue[state.currentIndex] ?? null
  const remaining = Math.max(0, state.queue.length - state.currentIndex)
  const counts = Object.values(state.answers).reduce(
    (acc, r) => {
      if (r === 1) acc.again++
      else if (r === 2) acc.hard++
      else if (r === 3) acc.good++
      else if (r === 4) acc.easy++
      else if (r === 'skipped') acc.skipped++
      return acc
    },
    { again: 0, hard: 0, good: 0, easy: 0, skipped: 0 },
  )

  return {
    state,
    currentWord,
    remaining,
    counts,
    start,
    resume,
    rate,
    skip,
    goBack,
    goNext,
    restart,
    exit,
  }
}
