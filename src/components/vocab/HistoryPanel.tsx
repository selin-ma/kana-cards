import { useState } from 'react'
import type { VocabSessionWithMeta } from '../../services/vocabProgress'

interface Props {
  records: VocabSessionWithMeta[]
  loading: boolean
  error: string | null
  onBack: () => void
  onDelete: (ids: string[]) => void
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function VocabHistoryPanel({
  records,
  loading,
  error,
  onBack,
  onDelete,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDelete = () => {
    if (selected.size === 0) return
    onDelete([...selected])
    setSelected(new Set())
  }

  return (
    <div className='flex flex-col gap-4 w-full max-w-sm'>
      <div className='flex items-center justify-between'>
        <button
          onClick={onBack}
          className='text-xs transition-colors'
          style={{ color: '#7A9E82' }}
        >
          ← 返回
        </button>
        <span className='text-sm font-medium' style={{ color: '#3A4A3C' }}>
          练习记录
        </span>
        {selected.size > 0 ? (
          <button
            onClick={handleDelete}
            className='text-xs transition-colors'
            style={{ color: '#C08878' }}
          >
            删除 ({selected.size})
          </button>
        ) : (
          <span className='text-xs' style={{ color: 'transparent' }}>
            —
          </span>
        )}
      </div>

      {loading && (
        <p className='text-sm' style={{ color: '#B8C4B8' }}>
          加载中…
        </p>
      )}
      {error && (
        <p className='text-sm' style={{ color: '#C08878' }}>
          {error}
        </p>
      )}
      {!loading && !error && records.length === 0 && (
        <p className='text-sm text-center py-8' style={{ color: '#B8C4B8' }}>
          还没有练习记录
        </p>
      )}

      <div className='flex flex-col gap-2'>
        {records.map((r) => {
          const answered = r.again_count + r.hard_count + r.good_count + r.easy_count
          const incomplete = answered + r.skipped_count < r.total
          const knownRate =
            r.total > 0 ? Math.round(((r.good_count + r.easy_count) / r.total) * 100) : 0
          const isSelected = selected.has(r.id)
          return (
            <div
              key={r.id}
              onClick={() => toggle(r.id)}
              className='flex flex-col gap-1.5 px-4 py-3 rounded-2xl cursor-pointer transition-colors'
              style={{
                background: isSelected ? '#EEF4EE' : '#FEFCF8',
                border: isSelected ? '1px solid #7A9E82' : '1px solid #E4E8E0',
              }}
            >
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium' style={{ color: '#3A4A3C' }}>
                  {r.mode === 'due_review' ? '算法推荐复习' : (r.chapter_title ?? '—')}
                </span>
                <span className='text-xs' style={{ color: '#A8B4A8' }}>
                  {formatTime(r.created_at)}
                </span>
              </div>
              <div className='flex items-center justify-between text-xs'>
                <span style={{ color: '#8A9A8A' }}>
                  {r.mode === 'due_review' ? '算法推荐复习' : (r.book_title ?? '—')}
                  {incomplete && (
                    <span
                      className='ml-2 px-1.5 py-0.5 rounded text-[10px]'
                      style={{
                        background: '#F5F0E4',
                        color: '#A89060',
                      }}
                    >
                      未完成
                    </span>
                  )}
                </span>
                <span style={{ color: '#7A9E82' }}>{knownRate}%</span>
              </div>
              <div className='flex items-center gap-2 text-[11px] pt-0.5'>
                <span style={{ color: '#AA6868' }}>✗{r.again_count}</span>
                <span style={{ color: '#A89060' }}>~{r.hard_count}</span>
                <span style={{ color: '#4A7A50' }}>✓{r.good_count}</span>
                <span style={{ color: '#5A7A9A' }}>★{r.easy_count}</span>
                <span style={{ color: '#B8C4B8' }}>⏭{r.skipped_count}</span>
                <span className='ml-auto' style={{ color: '#A8B4A8' }}>
                  {answered + r.skipped_count}/{r.total}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
