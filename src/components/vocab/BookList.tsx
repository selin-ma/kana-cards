import type { Book } from '../../types/vocab'

interface Props {
  books: Book[]
  loading: boolean
  error: string | null
  onPick: (book: Book) => void
}

export default function BookList({ books, loading, error, onPick }: Props) {
  if (loading)
    return (
      <p className='text-sm' style={{ color: '#B8C4B8' }}>
        加载中…
      </p>
    )
  if (error)
    return (
      <p className='text-sm' style={{ color: '#C08878' }}>
        {error}
      </p>
    )
  if (books.length === 0)
    return (
      <p className='text-sm' style={{ color: '#B8C4B8' }}>
        还没有教材
      </p>
    )

  return (
    <div className='flex flex-col gap-3 w-full max-w-sm'>
      {books.map((b) => (
        <button
          key={b.id}
          onClick={() => onPick(b)}
          className='flex flex-col items-start gap-1 px-4 py-3 rounded-2xl text-left transition-colors'
          style={{
            background: '#FEFCF8',
            border: '1px solid #E4E8E0',
            boxShadow: '0 2px 8px 0 rgba(80,110,85,0.05)',
          }}
        >
          <span className='text-base font-medium' style={{ color: '#3A4A3C' }}>
            {b.title}
          </span>
          <span className='text-xs' style={{ color: '#A8B4A8' }}>
            {b.publisher ?? '—'} · 共 {b.total_chapters} 课
          </span>
        </button>
      ))}
    </div>
  )
}
