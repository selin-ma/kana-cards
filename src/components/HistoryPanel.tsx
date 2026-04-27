import { useState } from 'react'
import type { SessionRecord } from '../hooks/useHistory'
import type { SessionAttempt } from '../services/storage'
import type { KanaCard } from '../types/kana'
import { supabaseStorage } from '../services/supabaseStorage'
import KanaDetailModal from './KanaDetailModal'

interface Props {
  records: SessionRecord[]
  allCards: KanaCard[]
  onDelete: (ids: string[]) => Promise<void>
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const GROUP_LABELS: Record<string, string> = {
  seion: '清音', dakuten: '浊音', handakuten: '半浊音', youon: '拗音',
}

function MiniCard({ attempt, card, onClickCard }: { attempt: SessionAttempt; card: KanaCard | undefined; onClickCard: (c: KanaCard) => void }) {
  const bgMap = { correct: '#EAF2EA', wrong: '#F5EDEC', skipped: '#F0F4F0' }
  const hiColor = { correct: '#5A8870', wrong: '#5A8870', skipped: '#8A9A8A' }
  const kaColor = { correct: '#7A7A9A', wrong: '#7A7A9A', skipped: '#A8A8C0' }
  const romaColor = { correct: '#7AAA7A', wrong: '#C08878', skipped: '#B8C4B8' }

  return (
    <button
      onClick={() => card && onClickCard(card)}
      className="px-2 py-1.5 rounded-lg flex flex-col items-center gap-0.5 transition-opacity"
      style={{ background: bgMap[attempt.result], minWidth: '3.2rem' }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.72')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >
      <div className="flex gap-1 items-baseline">
        <span className="text-base font-light" style={{ color: hiColor[attempt.result] }}>{card?.hira ?? '?'}</span>
        <span className="text-sm font-light" style={{ color: kaColor[attempt.result] }}>{card?.kata ?? ''}</span>
      </div>
      <span style={{ color: romaColor[attempt.result], fontSize: '10px' }}>{attempt.card_id}</span>
    </button>
  )
}

export default function HistoryPanel({ records, allCards, onDelete }: Props) {
  const [selected, setSelected] = useState<SessionRecord | null>(null)
  const [attempts, setAttempts] = useState<SessionAttempt[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [cardDetail, setCardDetail] = useState<KanaCard | null>(null)

  const [managing, setManaging] = useState(false)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const cardMap = Object.fromEntries(allCards.map(c => [c.id, c]))

  async function openDetail(r: SessionRecord) {
    if (managing) return
    setSelected(r)
    setLoadingDetail(true)
    try {
      const data = await supabaseStorage.getSessionAttempts(r.id)
      setAttempts(data)
    } finally {
      setLoadingDetail(false)
    }
  }

  function toggleCheck(id: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (checked.size === records.length) {
      setChecked(new Set())
    } else {
      setChecked(new Set(records.map(r => r.id)))
    }
  }

  async function handleDelete() {
    setDeleting(true)
    await onDelete([...checked])
    setDeleting(false)
    setConfirmDelete(false)
    setManaging(false)
    setChecked(new Set())
  }

  if (records.length === 0) {
    return <p className="text-xs" style={{ color: '#C0CAC0' }}>暂无历史记录</p>
  }

  const correct = attempts.filter(a => a.result === 'correct')
  const wrong = attempts.filter(a => a.result === 'wrong')
  const skipped = attempts.filter(a => a.result === 'skipped')

  return (
    <>
      <div className="w-full">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium" style={{ color: '#A8B4A8' }}>历史记录</span>
          <div className="flex items-center gap-3">
            {managing && (
              <>
                <button
                  onClick={toggleAll}
                  className="text-xs transition-colors"
                  style={{ color: '#A8B4A8' }}
                >
                  {checked.size === records.length ? '取消全选' : '全选'}
                </button>
                {checked.size > 0 && (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-xs transition-colors"
                    style={{ color: '#C08878' }}
                  >
                    删除 ({checked.size})
                  </button>
                )}
                <button
                  onClick={() => { setManaging(false); setChecked(new Set()) }}
                  className="text-xs transition-colors"
                  style={{ color: '#C0CAC0' }}
                >
                  取消
                </button>
              </>
            )}
            {!managing && (
              <button
                onClick={() => setManaging(true)}
                className="text-xs transition-colors"
                style={{ color: '#C0CAC0' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#7A9E82')}
                onMouseLeave={e => (e.currentTarget.style.color = '#C0CAC0')}
              >
                管理
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {records.map((r) => {
            const pct = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0
            const pctColor = pct >= 80 ? '#7AAA7A' : pct >= 50 ? '#9AAA7A' : '#C08878'
            const isChecked = checked.has(r.id)

            return (
              <div
                key={r.id}
                className="flex items-center gap-2"
              >
                {managing && (
                  <button
                    onClick={() => toggleCheck(r.id)}
                    className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      border: `1.5px solid ${isChecked ? '#7A9E82' : '#C8D4C8'}`,
                      background: isChecked ? '#7A9E82' : 'transparent',
                    }}
                  >
                    {isChecked && <span style={{ color: '#fff', fontSize: '10px', lineHeight: 1 }}>✓</span>}
                  </button>
                )}
                <button
                  onClick={() => openDetail(r)}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl flex-1 text-left transition-colors"
                  style={{ background: isChecked ? '#F0F6F0' : '#FEFCF8', border: `1px solid ${isChecked ? '#C8DEC8' : '#E4EAE4'}` }}
                  onMouseEnter={e => { if (!managing) e.currentTarget.style.background = '#F4F8F4' }}
                  onMouseLeave={e => { if (!managing) e.currentTarget.style.background = isChecked ? '#F0F6F0' : '#FEFCF8' }}
                >
                  <span className="text-xs w-20 shrink-0" style={{ color: '#C0CAC0' }}>
                    {formatDate(r.created_at)}
                  </span>
                  <div className="flex gap-3 text-xs">
                    <span style={{ color: '#7AAA7A' }}>✓ {r.correct}</span>
                    <span style={{ color: '#C08878' }}>✗ {r.wrong}</span>
                    {r.skipped > 0 && <span style={{ color: '#B8C4B8' }}>↷ {r.skipped}</span>}
                    <span style={{ color: '#B8C4B8' }}>{r.total} 张</span>
                  </div>
                  <span className="text-xs font-medium w-10 text-right" style={{ color: pctColor }}>
                    {pct}%
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ background: 'rgba(58,74,60,0.18)' }}
        >
          <div
            className="rounded-2xl p-6 flex flex-col gap-4 w-full max-w-xs"
            style={{ background: '#FEFCF8', border: '1px solid #D8E4D8', boxShadow: '0 8px 32px rgba(80,110,85,0.12)' }}
          >
            <p className="text-sm font-medium text-center" style={{ color: '#3A4A3C' }}>
              确认删除 {checked.size} 条记录？
            </p>
            <p className="text-xs text-center" style={{ color: '#B8C4B8' }}>此操作不可撤销</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 rounded-xl text-sm transition-colors"
                style={{ background: '#F0F4F0', color: '#607060' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#E4EAE4')}
                onMouseLeave={e => (e.currentTarget.style.background = '#F0F4F0')}
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
                style={{ background: '#F5EDEC', color: '#AA6868' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EADAD8')}
                onMouseLeave={e => (e.currentTarget.style.background = '#F5EDEC')}
              >
                {deleting ? '删除中…' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session detail modal */}
      {selected && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ background: 'rgba(58,74,60,0.18)' }}
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto"
            style={{ background: '#FEFCF8', border: '1px solid #D8E4D8', boxShadow: '0 8px 32px rgba(80,110,85,0.12)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: '#3A4A3C' }}>{formatDate(selected.created_at)}</p>
                <p className="text-xs mt-0.5" style={{ color: '#B8C4B8' }}>
                  {[
                    ...(selected.filter_groups ?? []).map(g => GROUP_LABELS[g] ?? g),
                    ...(selected.filter_rows ?? []),
                  ].join(' · ') || '全部'}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="text-lg leading-none" style={{ color: '#C0CAC0' }}>×</button>
            </div>

            {loadingDetail ? (
              <p className="text-xs text-center" style={{ color: '#C0CAC0' }}>加载中…</p>
            ) : (
              <div className="flex flex-col gap-3">
                {wrong.length > 0 && (
                  <div>
                    <p className="text-xs mb-1.5" style={{ color: '#C08878' }}>没记住 ({wrong.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {wrong.map(a => <MiniCard key={a.card_id} attempt={a} card={cardMap[a.card_id]} onClickCard={setCardDetail} />)}
                    </div>
                  </div>
                )}
                {correct.length > 0 && (
                  <div>
                    <p className="text-xs mb-1.5" style={{ color: '#7AAA7A' }}>记住了 ({correct.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {correct.map(a => <MiniCard key={a.card_id} attempt={a} card={cardMap[a.card_id]} onClickCard={setCardDetail} />)}
                    </div>
                  </div>
                )}
                {skipped.length > 0 && (
                  <div>
                    <p className="text-xs mb-1.5" style={{ color: '#B8C4B8' }}>已跳过 ({skipped.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {skipped.map(a => <MiniCard key={a.card_id} attempt={a} card={cardMap[a.card_id]} onClickCard={setCardDetail} />)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {cardDetail && <KanaDetailModal card={cardDetail} onClose={() => setCardDetail(null)} />}
    </>
  )
}
