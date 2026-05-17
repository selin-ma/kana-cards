import { useEffect, useRef, useCallback } from 'react'
import { useCards } from './hooks/useCards'
import { useSession } from './hooks/useSession'
import { useHistory } from './hooks/useHistory'
import { useAuth } from './hooks/useAuth'
import { useState } from 'react'
import FilterBar from './components/FilterBar'
import CardStack from './components/CardStack'
import ResultPanel from './components/ResultPanel'
import HistoryPanel from './components/HistoryPanel'
import ErrorDashboard from './components/ErrorDashboard'
import AuthGate from './components/AuthGate'
import BrowsePanel from './components/BrowsePanel'
import { version } from '../package.json'
import VocabApp from './components/VocabApp'
import type { FilterState } from './hooks/useCards'
import { saveDraft, loadDraft, clearDraft } from './utils/sessionDraft/sessionDraft'
import type { SessionDraft } from './utils/sessionDraft/sessionDraft'

const EMPTY_FILTER: FilterState = { groups: new Set(), rows: new Set() }

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
  draft: SessionDraft
  onResume: () => void
  onDiscard: () => void
}) {
  const answered = Object.keys(draft.answers).length
  const total = draft.queueIds.length

  return (
    <div
      className='w-full rounded-2xl p-4 flex flex-col gap-3'
      style={{ background: '#EEF4EE', border: '1px solid #C8DCC8' }}
    >
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium' style={{ color: '#3A4A3C' }}>
          上次练习未完成
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
        / {total} 张
      </p>
      <div className='flex gap-2'>
        <button
          onClick={onResume}
          className='px-4 py-1.5 rounded-xl text-xs font-medium transition-colors'
          style={{ background: '#7A9E82', color: '#F8FCF8' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#628070')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#7A9E82')}
        >
          继续上次
        </button>
        <button
          onClick={onDiscard}
          className='px-4 py-1.5 rounded-xl text-xs font-medium transition-colors'
          style={{ background: '#E8EEE8', color: '#8A9A8A' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#C08878')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#8A9A8A')}
        >
          放弃
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth()
  const [moduleTab, setModuleTab] = useState<'kana' | 'vocab'>('kana')
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER)
  const [appMode, setAppMode] = useState<'practice' | 'browse' | 'stats'>('practice')
  const {
    loading: cardsLoading,
    error,
    filtered,
    availableRows,
    allCards,
    getSorted,
    getShuffled,
  } = useCards(filter)
  const [isRandom, setIsRandom] = useState(false)
  const {
    state,
    currentCard,
    remaining,
    correct,
    wrong,
    skipped,
    start,
    answer,
    skip,
    goBack,
    goNext,
    resume,
    restart,
    backToFilter,
  } = useSession()
  const { records, cardStats, loadAll, addRecord, deleteRecords } = useHistory()

  const savedRef = useRef(false)
  const sessionStartRef = useRef<string | null>(null)
  const [pendingDraft, setPendingDraft] = useState<SessionDraft | null>(null)

  // Load history once user logs in
  useEffect(() => {
    if (user) loadAll()
  }, [user, loadAll])

  // Load saved draft once cards are available
  useEffect(() => {
    if (!user || allCards.length === 0 || pendingDraft !== null) return
    const saved = loadDraft(user.id)
    const answeredCount = Object.keys(saved?.answers ?? {}).length
    if (saved && answeredCount > 0 && saved.currentIndex < saved.queueIds.length) {
      setPendingDraft(saved)
    }
  }, [user, allCards])

  // Auto-save draft on every card change during playing
  useEffect(() => {
    if (state.status === 'playing' && user) {
      if (!sessionStartRef.current) {
        sessionStartRef.current = new Date().toISOString()
      }
      saveDraft(user.id, {
        queueIds: state.queue.map((c) => c.id),
        currentIndex: state.currentIndex,
        answers: state.answers,
        filterGroups: [...filter.groups],
        filterRows: [...filter.rows],
        startedAt: sessionStartRef.current,
      })
    } else if (state.status === 'idle') {
      sessionStartRef.current = null
    }
  }, [state.status, state.currentIndex, state.answers, filter, user])

  // Save session when finished, then clear draft
  useEffect(() => {
    if (state.status === 'finished' && !savedRef.current) {
      savedRef.current = true
      addRecord(correct, wrong, skipped, filter)
      if (user) clearDraft(user.id)
    }
    if (state.status !== 'finished') {
      savedRef.current = false
    }
  }, [state.status, correct, wrong, skipped, filter, addRecord, user])

  // Intentional exit mid-session: save partial record then clear draft
  const handleBackToFilter = useCallback(async () => {
    const answeredCount = correct.length + wrong.length + skipped.length
    if (answeredCount > 0) {
      const unanswered = state.queue.filter((c) => state.answers[c.id] === undefined)
      await addRecord(correct, wrong, [...skipped, ...unanswered], filter)
    }
    if (user) clearDraft(user.id)
    setPendingDraft(null)
    backToFilter()
  }, [
    correct,
    wrong,
    skipped,
    state.queue,
    state.answers,
    filter,
    addRecord,
    user,
    backToFilter,
  ])

  // Resume a saved draft
  const handleResumeDraft = useCallback(() => {
    if (!pendingDraft) return
    const queue = pendingDraft.queueIds
      .map((id) => allCards.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => c !== undefined)
    resume(queue, pendingDraft.currentIndex, pendingDraft.answers)
    setPendingDraft(null)
  }, [pendingDraft, allCards, resume])

  const handleDiscardDraft = useCallback(() => {
    if (user) clearDraft(user.id)
    setPendingDraft(null)
  }, [user])

  // Auth loading screen
  if (authLoading) {
    return (
      <div
        className='min-h-screen flex items-center justify-center'
        style={{ background: '#F5F2EC' }}
      >
        <span className='text-sm' style={{ color: '#B8C4B8' }}>
          加载中…
        </span>
      </div>
    )
  }

  // Not logged in → show auth form
  if (!user) {
    return <AuthGate onSignIn={signIn} onSignUp={signUp} />
  }

  const kanaIdle = state.status === 'idle'
  const showSignOut = moduleTab === 'vocab' || (moduleTab === 'kana' && kanaIdle)

  return (
    <div
      className='min-h-screen flex flex-col items-center px-4 py-12'
      style={{ background: '#F5F2EC' }}
    >
      {/* Header */}
      <div className='flex items-center justify-between w-full max-w-lg mb-6'>
        <h1
          className='text-2xl font-semibold tracking-widest'
          style={{ color: '#6A9070' }}
        >
          Kana Jump!
        </h1>
        {showSignOut && (
          <button
            onClick={signOut}
            className='text-xs transition-colors'
            style={{ color: '#C0CAC0' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#C08878')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#C0CAC0')}
          >
            退出登录
          </button>
        )}
      </div>

      {/* Module switcher: only when not mid-kana-session */}
      {(moduleTab === 'vocab' || kanaIdle) && (
        <div
          className='flex gap-1 p-1 rounded-2xl mb-7'
          style={{ background: '#E0E8E0' }}
        >
          {(['kana', 'vocab'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModuleTab(m)}
              className='px-6 py-1.5 rounded-xl text-sm font-medium transition-colors'
              style={
                moduleTab === m
                  ? {
                      background: '#FEFCF8',
                      color: '#3A4A3C',
                      boxShadow: '0 1px 4px rgba(80,110,85,0.10)',
                    }
                  : { background: 'transparent', color: '#8A9A8A' }
              }
            >
              {m === 'kana' ? '假名' : '单词'}
            </button>
          ))}
        </div>
      )}

      {/* ===== Vocab module ===== */}
      {moduleTab === 'vocab' && (
        <div className='flex flex-col items-center w-full'>
          <VocabApp />
        </div>
      )}

      {/* ===== Kana module ===== */}
      {moduleTab === 'kana' && cardsLoading && (
        <span className='text-sm' style={{ color: '#B8C4B8' }}>
          加载中…
        </span>
      )}

      {moduleTab === 'kana' && !cardsLoading && error && (
        <span className='text-sm' style={{ color: '#C08878' }}>
          {error}
        </span>
      )}

      {moduleTab === 'kana' && !cardsLoading && !error && (
        <>
          {/* Idle: mode tabs + content */}
          {state.status === 'idle' && (
            <div className='flex flex-col items-center gap-7 w-full max-w-lg'>
              {/* Tabs */}
              <div
                className='flex gap-1 p-1 rounded-2xl'
                style={{ background: '#E8EEE8' }}
              >
                {(['practice', 'browse', 'stats'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setAppMode(mode)}
                    className='px-5 py-1.5 rounded-xl text-sm font-medium transition-colors'
                    style={
                      appMode === mode
                        ? {
                            background: '#FEFCF8',
                            color: '#3A4A3C',
                            boxShadow: '0 1px 4px rgba(80,110,85,0.10)',
                          }
                        : { background: 'transparent', color: '#8A9A8A' }
                    }
                  >
                    {mode === 'practice' ? '练习' : mode === 'browse' ? '浏览' : '统计'}
                  </button>
                ))}
              </div>

              {(appMode === 'practice' || appMode === 'browse') && (
                <FilterBar
                  filter={filter}
                  availableRows={availableRows}
                  onChange={setFilter}
                />
              )}

              {appMode === 'practice' && pendingDraft && (
                <ResumeDraftCard
                  draft={pendingDraft}
                  onResume={handleResumeDraft}
                  onDiscard={handleDiscardDraft}
                />
              )}

              {appMode === 'practice' && (
                <>
                  <div className='flex items-center gap-3'>
                    <p className='text-sm' style={{ color: '#A8B4A8' }}>
                      已选&ensp;
                      <span className='font-medium' style={{ color: '#6A9070' }}>
                        {filtered.length}
                      </span>
                      &ensp;张卡片
                    </p>
                    <div
                      className='flex rounded-xl overflow-hidden'
                      style={{ border: '1px solid #D8E4D8' }}
                    >
                      {(['顺序', '随机'] as const).map((mode) => {
                        const active = mode === '随机' ? isRandom : !isRandom
                        return (
                          <button
                            key={mode}
                            onClick={() => setIsRandom(mode === '随机')}
                            className='px-3 py-1 text-xs font-medium transition-colors'
                            style={
                              active
                                ? { background: '#7A9E82', color: '#F8FCF8' }
                                : { background: '#FEFCF8', color: '#A8B4A8' }
                            }
                          >
                            {mode}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <button
                    disabled={filtered.length === 0}
                    onClick={() => {
                      if (user) clearDraft(user.id)
                      setPendingDraft(null)
                      start(isRandom ? getShuffled() : getSorted())
                    }}
                    className='px-8 py-2.5 rounded-2xl text-sm font-medium tracking-wide transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
                    style={{ background: '#7A9E82', color: '#F8FCF8' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#628070')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#7A9E82')}
                  >
                    开始练习
                  </button>
                </>
              )}

              {appMode === 'browse' && (
                <BrowsePanel cards={filtered.length > 0 ? filtered : allCards} />
              )}

              {appMode === 'stats' && (
                <div className='flex flex-col gap-7 w-full'>
                  <ErrorDashboard
                    cardStats={cardStats}
                    allCards={allCards}
                    onPractice={(cards) => {
                      setAppMode('practice')
                      start(isRandom ? getShuffled(cards) : getSorted(cards))
                    }}
                  />
                  <HistoryPanel
                    records={records}
                    allCards={allCards}
                    onDelete={deleteRecords}
                  />
                </div>
              )}
            </div>
          )}

          {/* Playing */}
          {state.status === 'playing' && currentCard && (
            <CardStack
              card={currentCard}
              answered={state.answers[currentCard.id]}
              currentIndex={state.currentIndex}
              total={state.queue.length}
              correct={correct.length}
              wrong={wrong.length}
              skipped={skipped.length}
              remaining={remaining}
              onAnswer={answer}
              onSkip={skip}
              onGoBack={goBack}
              onGoNext={goNext}
              onChangeFilter={handleBackToFilter}
            />
          )}

          {/* Finished */}
          {state.status === 'finished' && (
            <ResultPanel
              correct={correct}
              wrong={wrong}
              skipped={skipped}
              onRestart={() => restart(isRandom ? getShuffled() : getSorted())}
              onRetryWrong={() =>
                restart(isRandom ? getShuffled(wrong) : getSorted(wrong))
              }
              onRetrySkipped={() =>
                restart(isRandom ? getShuffled(skipped) : getSorted(skipped))
              }
              onBackToFilter={backToFilter}
            />
          )}
        </>
      )}
      <footer className='mt-auto text-center text-xs pt-12' style={{ color: '#C0CAC0' }}>
        v{version}
      </footer>
    </div>
  )
}
