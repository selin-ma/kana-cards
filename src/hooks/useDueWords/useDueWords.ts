import { useCallback, useEffect, useState } from 'react'
import { countDueWords, fetchDueWords } from '../../services/vocabFSRS'
import type { Word } from '../../types/vocab'

// Loads the user's count of words whose FSRS `due` is now-or-past.
// `enabled` controls whether the count is fetched (avoid hitting the
// API on pages where it would be unused). `fetch` is a manual trigger
// that pulls the actual Word objects when starting a due-review session.
export function useDueWords(enabled: boolean) {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const c = await countDueWords()
      setCount(c)
    } catch (e) {
      console.error('useDueWords count failed', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetch = useCallback(async (limit = 20): Promise<Word[]> => {
    return await fetchDueWords(limit)
  }, [])

  useEffect(() => {
    if (enabled) void refresh()
  }, [enabled, refresh])

  return { count, loading, refresh, fetch }
}
