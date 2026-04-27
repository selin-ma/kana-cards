import { useEffect, useRef } from "react";
import { useCards } from "./hooks/useCards";
import { useSession } from "./hooks/useSession";
import { useHistory } from "./hooks/useHistory";
import { useAuth } from "./hooks/useAuth";
import { useState } from "react";
import FilterBar from "./components/FilterBar";
import CardStack from "./components/CardStack";
import ResultPanel from "./components/ResultPanel";
import HistoryPanel from "./components/HistoryPanel";
import ErrorDashboard from "./components/ErrorDashboard";
import AuthGate from "./components/AuthGate";
import BrowsePanel from "./components/BrowsePanel";
import type { FilterState } from "./hooks/useCards";

const EMPTY_FILTER: FilterState = { groups: new Set(), rows: new Set() };

export default function App() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [appMode, setAppMode] = useState<'practice' | 'browse' | 'stats'>('practice');
  const {
    loading: cardsLoading,
    error,
    filtered,
    availableRows,
    allCards,
    getSorted,
    getShuffled,
  } = useCards(filter);
  const [isRandom, setIsRandom] = useState(false);
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
    restart,
    backToFilter,
  } = useSession();
  const { records, cardStats, loadAll, addRecord, deleteRecords, clearAll } = useHistory();

  const savedRef = useRef(false);

  // Load history once user logs in
  useEffect(() => {
    if (user) loadAll();
  }, [user, loadAll]);

  // Save session when finished
  useEffect(() => {
    if (state.status === "finished" && !savedRef.current) {
      savedRef.current = true;
      addRecord(correct, wrong, skipped, filter);
    }
    if (state.status !== "finished") {
      savedRef.current = false;
    }
  }, [state.status, correct, wrong, skipped, filter, addRecord]);

  // Auth loading screen
  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#F5F2EC" }}
      >
        <span className="text-sm" style={{ color: "#B8C4B8" }}>
          加载中…
        </span>
      </div>
    );
  }

  // Not logged in → show auth form
  if (!user) {
    return <AuthGate onSignIn={signIn} onSignUp={signUp} />;
  }

  if (cardsLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#F5F2EC" }}
      >
        <span className="text-sm" style={{ color: "#B8C4B8" }}>
          加载中…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#F5F2EC" }}
      >
        <span className="text-sm" style={{ color: "#C08878" }}>
          {error}
        </span>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "#F5F2EC" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-lg mb-8">
        <h1
          className="text-2xl font-semibold tracking-widest"
          style={{ color: "#6A9070" }}
        >
          假名记忆
        </h1>
        {state.status === "idle" && (
          <button
            onClick={signOut}
            className="text-xs transition-colors"
            style={{ color: "#C0CAC0" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#C08878")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#C0CAC0")}
          >
            退出登录
          </button>
        )}
      </div>

      {/* Idle: mode tabs + content */}
      {state.status === "idle" && (
        <div className="flex flex-col items-center gap-7 w-full max-w-lg">
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-2xl" style={{ background: '#E8EEE8' }}>
            {(['practice', 'browse', 'stats'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setAppMode(mode)}
                className="px-5 py-1.5 rounded-xl text-sm font-medium transition-colors"
                style={appMode === mode
                  ? { background: '#FEFCF8', color: '#3A4A3C', boxShadow: '0 1px 4px rgba(80,110,85,0.10)' }
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

          {appMode === 'practice' && (
            <>
              <div className="flex items-center gap-3">
                <p className="text-sm" style={{ color: "#A8B4A8" }}>
                  已选&ensp;
                  <span className="font-medium" style={{ color: "#6A9070" }}>
                    {filtered.length}
                  </span>
                  &ensp;张卡片
                </p>
                <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #D8E4D8' }}>
                  {(['顺序', '随机'] as const).map(mode => {
                    const active = mode === '随机' ? isRandom : !isRandom
                    return (
                      <button
                        key={mode}
                        onClick={() => setIsRandom(mode === '随机')}
                        className="px-3 py-1 text-xs font-medium transition-colors"
                        style={active
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
                onClick={() => start(isRandom ? getShuffled() : getSorted())}
                className="px-8 py-2.5 rounded-2xl text-sm font-medium tracking-wide transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: "#7A9E82", color: "#F8FCF8" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#628070")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#7A9E82")}
              >
                开始练习
              </button>

            </>
          )}

          {appMode === 'browse' && (
            <BrowsePanel cards={filtered.length > 0 ? filtered : allCards} />
          )}

          {appMode === 'stats' && (
            <div className="flex flex-col gap-7 w-full">
              <ErrorDashboard
                cardStats={cardStats}
                allCards={allCards}
                onPractice={(cards) => { setAppMode('practice'); start(isRandom ? getShuffled(cards) : getSorted(cards)) }}
              />
              <HistoryPanel records={records} allCards={allCards} onDelete={deleteRecords} />
            </div>
          )}
        </div>
      )}

      {/* Playing */}
      {state.status === "playing" && currentCard && (
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
          onChangeFilter={backToFilter}
        />
      )}

      {/* Finished */}
      {state.status === "finished" && (
        <ResultPanel
          correct={correct}
          wrong={wrong}
          skipped={skipped}
          onRestart={() => restart(isRandom ? getShuffled() : getSorted())}
          onRetryWrong={() => restart(isRandom ? getShuffled(wrong) : getSorted(wrong))}
          onRetrySkipped={() => restart(isRandom ? getShuffled(skipped) : getSorted(skipped))}
          onBackToFilter={backToFilter}
        />
      )}
    </div>
  );
}
