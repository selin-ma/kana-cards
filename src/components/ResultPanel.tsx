import type { KanaCard } from '../types/kana'

interface Props {
  correct: KanaCard[]
  wrong: KanaCard[]
  skipped: KanaCard[]
  onRestart: () => void
  onRetryWrong: () => void
  onRetrySkipped: () => void
  onBackToFilter: () => void
}

export default function ResultPanel({ correct, wrong, skipped, onRestart, onRetryWrong, onRetrySkipped, onBackToFilter }: Props) {
  const total = correct.length + wrong.length + skipped.length
  const pct = total > 0 ? Math.round((correct.length / total) * 100) : 0
  const pctColor = pct >= 80 ? '#7AAA7A' : pct >= 50 ? '#9AAA7A' : '#C08878'

  return (
    <div className="flex flex-col items-center gap-7 text-center w-full max-w-sm">
      <h2 className="text-lg font-medium" style={{ color: '#6A9070' }}>本轮结束</h2>

      <div className="flex gap-10">
        <div>
          <p className="text-3xl font-light" style={{ color: '#7AAA7A' }}>{correct.length}</p>
          <p className="text-xs mt-1" style={{ color: '#B8C4B8' }}>记住了</p>
        </div>
        <div>
          <p className="text-3xl font-light" style={{ color: '#C08878' }}>{wrong.length}</p>
          <p className="text-xs mt-1" style={{ color: '#B8C4B8' }}>没记住</p>
        </div>
        {skipped.length > 0 && (
          <div>
            <p className="text-3xl font-light" style={{ color: '#B8C4B8' }}>{skipped.length}</p>
            <p className="text-xs mt-1" style={{ color: '#B8C4B8' }}>已跳过</p>
          </div>
        )}
        <div>
          <p className="text-3xl font-light" style={{ color: pctColor }}>{pct}%</p>
          <p className="text-xs mt-1" style={{ color: '#B8C4B8' }}>正确率</p>
        </div>
      </div>

      {wrong.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-w-xs justify-center">
          {wrong.map((c) => (
            <span
              key={c.id}
              className="px-2 py-0.5 rounded text-xs"
              style={{ background: '#F5EDEC', color: '#AA6868' }}
            >
              {c.roma}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-center">
        {wrong.length > 0 && (
          <button
            onClick={onRetryWrong}
            className="px-4 py-2 rounded-xl text-xs font-medium transition-colors"
            style={{ background: '#F5EDEC', color: '#AA6868' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#EADAD8')}
            onMouseLeave={e => (e.currentTarget.style.background = '#F5EDEC')}
          >
            练错题 ({wrong.length})
          </button>
        )}
        {skipped.length > 0 && (
          <button
            onClick={onRetrySkipped}
            className="px-4 py-2 rounded-xl text-xs font-medium transition-colors"
            style={{ background: '#E4EAE4', color: '#607060' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#D8E4D8')}
            onMouseLeave={e => (e.currentTarget.style.background = '#E4EAE4')}
          >
            练跳过 ({skipped.length})
          </button>
        )}
        <button
          onClick={onRestart}
          className="px-4 py-2 rounded-xl text-xs font-medium transition-colors"
          style={{ background: '#7A9E82', color: '#F8FCF8' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#628070')}
          onMouseLeave={e => (e.currentTarget.style.background = '#7A9E82')}
        >
          重新开始
        </button>
        <button
          onClick={onBackToFilter}
          className="px-4 py-2 rounded-xl text-xs font-medium transition-colors"
          style={{ background: '#E4EAE4', color: '#607060' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#D8E4D8')}
          onMouseLeave={e => (e.currentTarget.style.background = '#E4EAE4')}
        >
          结束本轮
        </button>
      </div>
    </div>
  )
}
