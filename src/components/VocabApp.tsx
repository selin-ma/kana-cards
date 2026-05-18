import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useBooks } from '../hooks/useBooks'
import { useChapters } from '../hooks/useChapters'
import { useWords } from '../hooks/useWords'
import { useVocabHistory } from '../hooks/useVocabHistory'
import { useVocabSession } from '../hooks/useVocabSession'
import { saveVocabSessionBatch } from '../services/vocabProgress'
import type { VocabSessionMode } from '../services/vocabProgress'
import { rateWordWithFSRS } from '../services/vocabFSRS'
import { useDueWords } from '../hooks/useDueWords'
import type { Rating, Word } from '../types/vocab'
import {
  clearVocabDraft,
  loadVocabDraft,
  saveVocabDraft,
} from '../utils/vocabSessionDraft/vocabSessionDraft'
import type { VocabSessionDraft } from '../utils/vocabSessionDraft/vocabSessionDraft'
import BookList from './vocab/BookList'
import ChapterList from './vocab/ChapterList'
import VocabCardStack from './vocab/CardStack'
import VocabHistoryPanel from './vocab/HistoryPanel'
import VocabResult from './vocab/Result'

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} 小时前`
  return `${Math.floor(hrs / 24)} 天前`
}

function ResumeDraftCard({
  draft,
  onResume,
  onDiscard,
}: {
  draft: VocabSessionDraft
  onResume: () => void
  onDiscard: () => void
}) {
  const answered = Object.keys(draft.answers).length
  const total = draft.queueIds.length
  return (
    <div
      className='w-full max-w-sm rounded-2xl p-4 flex flex-col gap-3'
      style={{ background: '#EEF4EE', border: '1px solid #C8DCC8' }}
    >
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium' style={{ color: '#3A4A3C' }}>
          上次单词练习未完成
        </span>
        <span className='text-xs' style={{ color: '#8A9A8A' }}>
          {formatRelativeTime(draft.startedAt)}
        </span>
      </div>
      <p className='text-xs' style={{ color: '#6A8070' }}>
        已完成{' '}
        <span className='font-semibold' style={{ color: '#4A7058' }}>
          {answered}
        </span>{' '}
        / {total} 词
      </p>
      <div className='flex gap-2'>
        <button
          onClick={onResume}
          className='px-4 py-1.5 rounded-xl text-xs font-medium transition-colors'
          style={{ background: '#7A9E82', color: '#F8FCF8' }}
        >
          继续上次
        </button>
        <button
          onClick={onDiscard}
          className='px-4 py-1.5 rounded-xl text-xs font-medium transition-colors'
          style={{ background: '#E8EEE8', color: '#8A9A8A' }}
        >
          放弃
        </button>
      </div>
    </div>
  )
}

export default function VocabApp() {
  const { user } = useAuth()
  const [bookId, setBookId] = useState<string | null>(null)
  const [chapterId, setChapterId] = useState<string | null>(null)
  const [draft, setDraft] = useState<VocabSessionDraft | null>(null)
  const [pendingResume, setPendingResume] = useState(false)
  const [viewMode, setViewMode] = useState<'practice' | 'history'>('practice')

  const { books, loading: booksLoading, error: booksError } = useBooks()
  const { chapters, loading: chaptersLoading, error: chaptersError } = useChapters(bookId)
  const { words, loading: wordsLoading, error: wordsError } = useWords(chapterId)
  const history = useVocabHistory(viewMode === 'history')

  const book = useMemo(() => books.find((b) => b.id === bookId) ?? null, [books, bookId])
  const chapter = useMemo(
    () => chapters.find((c) => c.id === chapterId) ?? null,
    [chapters, chapterId],
  )

  const session = useVocabSession()
  const startedAtRef = useRef<string | null>(null)
  const resumedRef = useRef(false)
  const persistedRef = useRef(false)
  // Track which mode this practice session belongs to so persistSession
  // writes the correct value into vocab_sessions.mode.
  const sessionModeRef = useRef<VocabSessionMode>('new_chapter')

  // Chapter-ready picker state: how many words to practice + order.
  // Defaults are conservative (10 sequential) — better learning rhythm
  // than dumping all 50 cards at once.
  const [pickCount, setPickCount] = useState<number | 'all'>(10)
  const [pickOrder, setPickOrder] = useState<'sequential' | 'random'>('sequential')

  // Fetch the due-review count whenever we land on the book picker.
  const dueGateActive =
    viewMode === 'practice' && !pendingResume && session.state.status === 'idle'
  const due = useDueWords(dueGateActive)

  // Persist current session (one INSERT to vocab_sessions + batch insert
  // to vocab_attempts). Captures state synchronously so concurrent
  // session.exit() does not race the closure.
  // For due_review mode, bookId/chapterId may be null (cross-chapter).
  const persistSession = useCallback(async () => {
    if (!user) return
    const queue = session.state.queue
    const answers = session.state.answers
    const counts = session.counts
    if (queue.length === 0) return
    if (Object.keys(answers).length === 0 && counts.skipped === 0) return

    const attempts: Array<{ word_id: string; rating: Rating }> = []
    for (const [wordId, ans] of Object.entries(answers)) {
      if (ans !== 'skipped') {
        attempts.push({ word_id: wordId, rating: ans as Rating })
      }
    }

    try {
      await saveVocabSessionBatch({
        book_id: bookId,
        chapter_id: chapterId,
        mode: sessionModeRef.current,
        total: queue.length,
        counts,
        attempts,
      })
    } catch (e) {
      console.error('save vocab session failed', e)
    }
  }, [
    user,
    bookId,
    chapterId,
    session.state.queue,
    session.state.answers,
    session.counts,
  ])

  // 1. Load draft once user is known
  useEffect(() => {
    if (!user) {
      setDraft(null)
      return
    }
    const saved = loadVocabDraft(user.id)
    const answered = Object.keys(saved?.answers ?? {}).length
    if (saved && answered > 0 && saved.currentIndex <= saved.queueIds.length) {
      setDraft(saved)
    }
  }, [user])

  // 2. Hydrate session from draft once the chapter's words have loaded
  useEffect(() => {
    if (!pendingResume || !draft || !user) return
    if (chapterId !== draft.chapterId) return
    if (words.length === 0) return
    if (resumedRef.current) return

    const queue = draft.queueIds
      .map((id) => words.find((w) => w.id === id))
      .filter((w): w is Word => !!w)

    if (queue.length === 0) {
      clearVocabDraft(user.id)
      setDraft(null)
      setPendingResume(false)
      return
    }

    resumedRef.current = true
    startedAtRef.current = draft.startedAt
    session.resume(queue, draft.currentIndex, draft.answers)
    setPendingResume(false)
    setDraft(null)
  }, [pendingResume, draft, chapterId, words, user, session])

  // 3. Auto-save draft on every change while playing
  useEffect(() => {
    if (!user) return
    if (session.state.status === 'idle') {
      startedAtRef.current = null
      return
    }
    if (session.state.status !== 'playing') return
    if (!bookId || !chapterId) return
    if (!startedAtRef.current) {
      startedAtRef.current = new Date().toISOString()
    }
    saveVocabDraft(user.id, {
      bookId,
      chapterId,
      queueIds: session.state.queue.map((w) => w.id),
      currentIndex: session.state.currentIndex,
      answers: session.state.answers,
      startedAt: startedAtRef.current,
    })
  }, [
    user,
    bookId,
    chapterId,
    session.state.status,
    session.state.currentIndex,
    session.state.answers,
    session.state.queue,
  ])

  // 4. Persist + clear draft when session ends naturally (finished)
  useEffect(() => {
    if (session.state.status === 'playing') {
      persistedRef.current = false
      return
    }
    if (session.state.status === 'finished' && !persistedRef.current) {
      persistedRef.current = true
      void persistSession()
      if (user) clearVocabDraft(user.id)
    }
  }, [session.state.status, persistSession, user])

  const handleResumeDraft = useCallback(() => {
    if (!draft) return
    resumedRef.current = false
    setBookId(draft.bookId)
    setChapterId(draft.chapterId)
    setPendingResume(true)
  }, [draft])

  const handleDiscardDraft = useCallback(() => {
    if (user) clearVocabDraft(user.id)
    setDraft(null)
    setPendingResume(false)
  }, [user])

  // Rate persists FSRS state asynchronously. Audio playback is driven by
  // Card.tsx on flip, not on advance.
  const handleRate = useCallback(
    (rating: Rating) => {
      const current = session.state.queue[session.state.currentIndex]
      session.rate(rating)
      if (user && current) {
        rateWordWithFSRS(user.id, current.id, rating).catch((e) =>
          console.error('FSRS write failed', e),
        )
      }
    },
    [user, session],
  )

  const handleStart = useCallback(() => {
    if (user) clearVocabDraft(user.id)
    setDraft(null)
    persistedRef.current = false
    startedAtRef.current = new Date().toISOString()
    sessionModeRef.current = 'new_chapter'

    let queue: Word[] = words
    if (pickOrder === 'random') {
      queue = [...words]
      for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[queue[i], queue[j]] = [queue[j], queue[i]]
      }
    }
    if (typeof pickCount === 'number') {
      queue = queue.slice(0, pickCount)
    }
    session.start(queue)
  }, [user, words, session, pickCount, pickOrder])

  // Pull words whose FSRS `due` has passed, across all chapters, and
  // start a cross-chapter review session. Resets book/chapter state so
  // persistSession writes book_id=null/chapter_id=null.
  const handleStartDueReview = useCallback(async () => {
    if (!user) return
    const dueWords = await due.fetch(20)
    if (dueWords.length === 0) return
    clearVocabDraft(user.id)
    setDraft(null)
    setBookId(null)
    setChapterId(null)
    persistedRef.current = false
    startedAtRef.current = new Date().toISOString()
    sessionModeRef.current = 'due_review'
    session.start(dueWords)
  }, [user, due, session])

  // Mid-session exit: persist what's been answered, then reset.
  const handleExit = useCallback(() => {
    if (!persistedRef.current) {
      persistedRef.current = true
      void persistSession()
    }
    if (user) clearVocabDraft(user.id)
    setDraft(null)
    startedAtRef.current = null
    session.exit()
  }, [persistSession, user, session])

  const handleRestart = useCallback(() => {
    if (user) clearVocabDraft(user.id)
    persistedRef.current = false
    startedAtRef.current = new Date().toISOString()
    session.restart(words)
  }, [user, words, session])

  // ---------- RENDER ----------

  if (session.state.status === 'playing' && session.currentWord) {
    return (
      <VocabCardStack
        word={session.currentWord}
        answered={session.state.answers[session.currentWord.id]}
        currentIndex={session.state.currentIndex}
        total={session.state.queue.length}
        counts={session.counts}
        onRate={handleRate}
        onSkip={session.skip}
        onGoBack={session.goBack}
        onGoNext={session.goNext}
        onExit={handleExit}
      />
    )
  }

  if (session.state.status === 'finished') {
    return (
      <VocabResult
        counts={session.counts}
        total={session.state.queue.length}
        onRestart={handleRestart}
        onBack={handleExit}
      />
    )
  }

  if (pendingResume) {
    return (
      <p className='text-sm' style={{ color: '#B8C4B8' }}>
        正在恢复上次练习…
      </p>
    )
  }

  // History view (entered from book picker)
  if (viewMode === 'history') {
    return (
      <VocabHistoryPanel
        records={history.records}
        loading={history.loading}
        error={history.error}
        onBack={() => setViewMode('practice')}
        onDelete={history.deleteRecords}
      />
    )
  }

  // Book picker (with optional resume card + due-review entry)
  if (!book) {
    return (
      <div className='flex flex-col items-center gap-4 w-full'>
        {draft && (
          <ResumeDraftCard
            draft={draft}
            onResume={handleResumeDraft}
            onDiscard={handleDiscardDraft}
          />
        )}
        {due.count > 0 && (
          <div
            className='w-full max-w-sm rounded-2xl p-4 flex items-center justify-between gap-3'
            style={{
              background: 'linear-gradient(135deg, #EEF4EF 0%, #D8E4D8 100%)',
              border: '1px solid #B8C8B8',
              boxShadow: '0 2px 12px 0 rgba(80,110,85,0.10)',
            }}
          >
            <div className='flex flex-col gap-0.5'>
              <span className='text-sm font-medium' style={{ color: '#3A4A3C' }}>
                今日待复习
              </span>
              <span className='text-xs' style={{ color: '#6A8070' }}>
                FSRS 算法挑选的&nbsp;
                <span className='font-semibold' style={{ color: '#4A7058' }}>
                  {due.count}
                </span>
                &nbsp;张
              </span>
            </div>
            <button
              onClick={handleStartDueReview}
              className='px-4 py-2 rounded-xl text-sm font-medium tracking-wide transition-colors'
              style={{ background: '#7A9E82', color: '#F8FCF8' }}
            >
              开始复习
            </button>
          </div>
        )}
        <div className='w-full max-w-sm flex justify-end'>
          <button
            onClick={() => setViewMode('history')}
            className='text-xs transition-colors'
            style={{ color: '#7A9E82' }}
          >
            查看历史 →
          </button>
        </div>
        <BookList
          books={books}
          loading={booksLoading}
          error={booksError}
          onPick={(b) => setBookId(b.id)}
        />
      </div>
    )
  }

  // Chapter picker
  if (!chapter) {
    return (
      <ChapterList
        chapters={chapters}
        loading={chaptersLoading}
        error={chaptersError}
        bookTitle={book.title}
        onBack={() => setBookId(null)}
        onPick={(c) => setChapterId(c.id)}
      />
    )
  }

  // Ready to play
  if (wordsLoading) {
    return (
      <p className='text-sm' style={{ color: '#B8C4B8' }}>
        加载词条中…
      </p>
    )
  }
  if (wordsError) {
    return (
      <p className='text-sm' style={{ color: '#C08878' }}>
        {wordsError}
      </p>
    )
  }

  // Resolve effective queue length after pickCount filtering, for display.
  const effectiveCount =
    pickCount === 'all' ? words.length : Math.min(pickCount, words.length)

  return (
    <div className='flex flex-col items-center gap-5 w-full max-w-sm'>
      <div className='flex items-center justify-between w-full'>
        <button
          onClick={() => setChapterId(null)}
          className='text-xs'
          style={{ color: '#7A9E82' }}
        >
          ← 章节列表
        </button>
        <span className='text-sm font-medium' style={{ color: '#3A4A3C' }}>
          {chapter.title}
        </span>
      </div>
      <p className='text-sm' style={{ color: '#A8B4A8' }}>
        本课共&nbsp;
        <span className='font-medium' style={{ color: '#6A9070' }}>
          {words.length}
        </span>
        &nbsp;个词条
      </p>

      {/* Count picker */}
      <div className='flex flex-col items-center gap-1.5'>
        <span className='text-[11px]' style={{ color: '#A8B4A8' }}>
          数量
        </span>
        <div className='flex gap-1 p-1 rounded-xl' style={{ background: '#E8EEE8' }}>
          {([10, 20, 'all'] as const).map((c) => {
            const active = c === pickCount
            const label = c === 'all' ? '全部' : `${c} 张`
            return (
              <button
                key={String(c)}
                onClick={() => setPickCount(c)}
                className='px-4 py-1 rounded-lg text-xs font-medium transition-colors'
                style={
                  active
                    ? {
                        background: '#FEFCF8',
                        color: '#3A4A3C',
                        boxShadow: '0 1px 4px rgba(80,110,85,0.10)',
                      }
                    : { background: 'transparent', color: '#8A9A8A' }
                }
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Order picker */}
      <div className='flex flex-col items-center gap-1.5'>
        <span className='text-[11px]' style={{ color: '#A8B4A8' }}>
          顺序
        </span>
        <div className='flex gap-1 p-1 rounded-xl' style={{ background: '#E8EEE8' }}>
          {(['sequential', 'random'] as const).map((o) => {
            const active = o === pickOrder
            const label = o === 'sequential' ? '顺序' : '随机'
            return (
              <button
                key={o}
                onClick={() => setPickOrder(o)}
                className='px-4 py-1 rounded-lg text-xs font-medium transition-colors'
                style={
                  active
                    ? {
                        background: '#FEFCF8',
                        color: '#3A4A3C',
                        boxShadow: '0 1px 4px rgba(80,110,85,0.10)',
                      }
                    : { background: 'transparent', color: '#8A9A8A' }
                }
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <button
        disabled={words.length === 0}
        onClick={handleStart}
        className='px-8 py-2.5 rounded-2xl text-sm font-medium tracking-wide transition-colors disabled:opacity-30'
        style={{ background: '#7A9E82', color: '#F8FCF8' }}
      >
        开始练习 ({effectiveCount} 张)
      </button>
    </div>
  )
}
