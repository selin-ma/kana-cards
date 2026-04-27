import { useState, useMemo } from 'react'
import type { KanaCard } from '../types/kana'
import KanaDetailModal from './KanaDetailModal'

interface Props {
  cards: KanaCard[]
}

export default function BrowsePanel({ cards }: Props) {
  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState<KanaCard | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cards
    return cards.filter(c =>
      c.roma.includes(q) ||
      c.hira.includes(query) ||
      c.kata.includes(query)
    )
  }, [cards, query])

  const byRow = useMemo(() => {
    const map = new Map<string, KanaCard[]>()
    for (const c of filtered) {
      if (!map.has(c.row)) map.set(c.row, [])
      map.get(c.row)!.push(c)
    }
    return map
  }, [filtered])

  return (
    <>
      <div className="flex flex-col gap-5 w-full max-w-lg">
        {/* Search */}
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="搜索罗马音或假名…"
          className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-colors"
          style={{ background: '#FEFCF8', border: '1px solid #D8E4D8', color: '#3A4A3C' }}
          onFocus={e => (e.currentTarget.style.borderColor = '#7A9E82')}
          onBlur={e => (e.currentTarget.style.borderColor = '#D8E4D8')}
        />

        {filtered.length === 0 && (
          <p className="text-xs text-center" style={{ color: '#C0CAC0' }}>没有匹配的假名</p>
        )}

        {/* Grid grouped by row */}
        <div className="flex flex-col gap-5">
          {[...byRow.entries()].map(([row, rowCards]) => (
            <div key={row}>
              <p className="text-xs mb-2" style={{ color: '#A8B4A8' }}>{row}</p>
              <div className="flex flex-wrap gap-2">
                {rowCards.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setDetail(c)}
                    className="flex flex-col items-center px-3 py-2 rounded-xl gap-0.5 transition-colors"
                    style={{ background: '#FEFCF8', border: '1px solid #E4EAE4', minWidth: '52px' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#EEF4EF')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#FEFCF8')}
                  >
                    <div className="flex gap-1.5 items-baseline">
                      <span className="text-base font-light" style={{ color: '#5A8870' }}>{c.hira}</span>
                      <span className="text-sm font-light" style={{ color: '#7A7A9A' }}>{c.kata}</span>
                    </div>
                    <span className="text-xs" style={{ color: '#B8C4B8' }}>{c.roma}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {detail && <KanaDetailModal card={detail} onClose={() => setDetail(null)} />}
    </>
  )
}
