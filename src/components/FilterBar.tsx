import type { KanaCard } from '../types/kana'
import type { FilterState } from '../hooks/useCards'

const GROUP_LABELS: Record<KanaCard['group'], string> = {
  seion: '清音',
  dakuten: '浊音',
  handakuten: '半浊音',
  youon: '拗音',
}

const ALL_GROUPS = Object.keys(GROUP_LABELS) as KanaCard['group'][]

interface Props {
  filter: FilterState
  availableRows: string[]
  onChange: (filter: FilterState) => void
}

export default function FilterBar({ filter, availableRows, onChange }: Props) {
  function toggleGroup(g: KanaCard['group']) {
    const next = new Set(filter.groups)
    next.has(g) ? next.delete(g) : next.add(g)
    onChange({ groups: next, rows: new Set() })
  }

  function toggleRow(row: string) {
    const next = new Set(filter.rows)
    next.has(row) ? next.delete(row) : next.add(row)
    onChange({ ...filter, rows: next })
  }

  function clearAll() {
    onChange({ groups: new Set(), rows: new Set() })
  }

  const hasFilter = filter.groups.size > 0 || filter.rows.size > 0

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs mr-1" style={{ color: '#B8C4B8' }}>分组</span>
        {ALL_GROUPS.map((g) => {
          const active = filter.groups.has(g)
          return (
            <button
              key={g}
              onClick={() => toggleGroup(g)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
              style={active
                ? { background: '#7A9E82', color: '#F8FCF8' }
                : { background: '#E4EAE4', color: '#607060' }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#D8E4D8' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = '#E4EAE4' }}
            >
              {GROUP_LABELS[g]}
            </button>
          )
        })}
        {hasFilter && (
          <button
            onClick={clearAll}
            className="px-2 py-1 rounded-full text-xs transition-colors"
            style={{ color: '#C0CAC0' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#7A9E82')}
            onMouseLeave={e => (e.currentTarget.style.color = '#C0CAC0')}
          >
            清除
          </button>
        )}
      </div>

      {availableRows.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs mr-1" style={{ color: '#B8C4B8' }}>行</span>
          {availableRows.map((row) => {
            const active = filter.rows.has(row)
            return (
              <button
                key={row}
                onClick={() => toggleRow(row)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                style={active
                  ? { background: '#7A9E82', color: '#F8FCF8' }
                  : { background: '#E4EAE4', color: '#607060' }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#D8E4D8' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = '#E4EAE4' }}
              >
                {row}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
