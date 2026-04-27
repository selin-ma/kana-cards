import { useState, useEffect, useMemo, useCallback } from 'react'
import type { KanaCard, KanaData } from '../types/kana'
import { sortKana, ROW_ORDER } from '../utils/kanaOrder'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export interface FilterState {
  groups: Set<KanaCard['group']>
  rows: Set<string>
}

export function useCards(filter: FilterState) {
  const [allCards, setAllCards] = useState<KanaCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/kana_cards.json')
      .then((r) => r.json())
      .then((data: KanaData) => {
        setAllCards(sortKana(data.cards))
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load kana data')
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    let cards = allCards
    if (filter.groups.size > 0) {
      cards = cards.filter((c) => filter.groups.has(c.group))
    }
    if (filter.rows.size > 0) {
      cards = cards.filter((c) => filter.rows.has(c.row))
    }
    return cards // already sorted since allCards is sorted
  }, [allCards, filter])

  const availableRows = useMemo(() => {
    const base = filter.groups.size > 0
      ? allCards.filter((c) => filter.groups.has(c.group))
      : allCards
    const rowSet = [...new Set(base.map((c) => c.row))]
    return rowSet.sort((a, b) => {
      const ra = ROW_ORDER.indexOf(a)
      const rb = ROW_ORDER.indexOf(b)
      return (ra === -1 ? 999 : ra) - (rb === -1 ? 999 : rb)
    })
  }, [allCards, filter.groups])

  const getSorted = useCallback(
    (cards?: KanaCard[]) => sortKana(cards ?? filtered),
    [filtered],
  )

  const getShuffled = useCallback(
    (cards?: KanaCard[]) => shuffle(cards ?? filtered),
    [filtered],
  )

  return { loading, error, filtered, availableRows, allCards, getSorted, getShuffled }
}
