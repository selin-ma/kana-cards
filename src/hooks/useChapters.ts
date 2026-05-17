import { useEffect, useState } from 'react'
import type { Chapter } from '../types/vocab'
import { fetchChapters } from '../services/vocab'

export function useChapters(bookId: string | null) {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!bookId) {
      setChapters([])
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    setError(null)
    fetchChapters(bookId)
      .then((data) => {
        if (active) setChapters(data)
      })
      .catch((e) => {
        if (active) setError(String(e?.message ?? e))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [bookId])

  return { chapters, loading, error }
}
