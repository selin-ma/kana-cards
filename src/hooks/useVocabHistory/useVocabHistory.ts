import { useCallback, useEffect, useState } from 'react'
import type { VocabSessionWithMeta } from '../../services/vocabProgress'
import { deleteVocabSessions, fetchVocabHistory } from '../../services/vocabProgress'

export function useVocabHistory(enabled: boolean) {
  const [records, setRecords] = useState<VocabSessionWithMeta[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchVocabHistory()
      setRecords(rows)
    } catch (e) {
      setError(String((e as Error)?.message ?? e))
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteRecords = useCallback(
    async (ids: string[]) => {
      try {
        await deleteVocabSessions(ids)
        await loadAll()
      } catch (e) {
        setError(String((e as Error)?.message ?? e))
      }
    },
    [loadAll],
  )

  useEffect(() => {
    if (enabled) void loadAll()
  }, [enabled, loadAll])

  return { records, loading, error, loadAll, deleteRecords }
}
