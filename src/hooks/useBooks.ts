import { useEffect, useState } from 'react'
import type { Book } from '../types/vocab'
import { fetchBooks } from '../services/vocab'

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchBooks()
      .then((data) => {
        if (active) setBooks(data)
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
  }, [])

  return { books, loading, error }
}
