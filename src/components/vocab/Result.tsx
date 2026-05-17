interface Props {
  counts: {
    again: number
    hard: number
    good: number
    easy: number
    skipped: number
  }
  total: number
  onRestart: () => void
  onBack: () => void
}

export default function VocabResult({ counts, total, onRestart, onBack }: Props) {
  const known = counts.good + counts.easy
  const rate = total > 0 ? Math.round((known / total) * 100) : 0

  return (
    <div className='flex flex-col items-center gap-6 w-full max-w-sm'>
      <h2 className='text-xl font-medium tracking-wide' style={{ color: '#3A4A3C' }}>
        本轮结束
      </h2>

      <div
        className='flex flex-col items-center gap-1 px-8 py-6 rounded-2xl'
        style={{ background: '#FEFCF8', border: '1px solid #E4E8E0' }}
      >
        <span className='text-4xl font-light' style={{ color: '#7A9E82' }}>
          {rate}%
        </span>
        <span className='text-xs' style={{ color: '#A8B4A8' }}>
          掌握度（记住 + 简单 / 总数）
        </span>
      </div>

      <div className='grid grid-cols-5 gap-2 text-center text-xs'>
        <div className='flex flex-col gap-1'>
          <span style={{ color: '#AA6868' }}>{counts.again}</span>
          <span style={{ color: '#B8C4B8' }}>没记住</span>
        </div>
        <div className='flex flex-col gap-1'>
          <span style={{ color: '#A89060' }}>{counts.hard}</span>
          <span style={{ color: '#B8C4B8' }}>有点难</span>
        </div>
        <div className='flex flex-col gap-1'>
          <span style={{ color: '#4A7A50' }}>{counts.good}</span>
          <span style={{ color: '#B8C4B8' }}>记住</span>
        </div>
        <div className='flex flex-col gap-1'>
          <span style={{ color: '#5A7A9A' }}>{counts.easy}</span>
          <span style={{ color: '#B8C4B8' }}>简单</span>
        </div>
        <div className='flex flex-col gap-1'>
          <span style={{ color: '#B8C4B8' }}>{counts.skipped}</span>
          <span style={{ color: '#B8C4B8' }}>跳过</span>
        </div>
      </div>

      <div className='flex gap-3'>
        <button
          onClick={onBack}
          className='px-5 py-2 rounded-xl text-sm font-medium'
          style={{
            background: '#F5F2EC',
            color: '#7A9E82',
            border: '1px solid #DDE8DD',
          }}
        >
          返回
        </button>
        <button
          onClick={onRestart}
          className='px-5 py-2 rounded-xl text-sm font-medium'
          style={{ background: '#7A9E82', color: '#F8FCF8' }}
        >
          再来一遍
        </button>
      </div>
    </div>
  )
}
