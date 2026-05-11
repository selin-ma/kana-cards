import { useEffect, useState } from 'react'
import type { Word } from '../types/vocab'
import { fetchWordsByChapter } from '../services/vocab'

export function useWords(chapterId: string | null) {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!chapterId) {
      setWords([])
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    setError(null)
    fetchWordsByChapter(chapterId)
      .then((data) => { if (active) setWords(data) })
      .catch((e) => { if (active) setError(String(e?.message ?? e)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [chapterId])

  return { words, loading, error }
}
