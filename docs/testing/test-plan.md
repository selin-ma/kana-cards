# Test Plan — Kana Jump

> **Framework:** Vitest 4.x (`npm run test` for watch mode, `npm run test:run` for CI)
> **Environment:** jsdom (for hooks/components), node (for pure logic)
> **Setup:** `src/test/setup.ts` — imports `@testing-library/jest-dom/vitest`
> **Config:** `vite.config.ts` — `test.globals: true`, `test.css: false`

## Coverage Target

- **Tier 1 (Pure Logic):** ≥ 95% line coverage
- **Tier 2 (Services):** ≥ 85% line coverage (mocked Supabase)
- **Tier 3-4 (Hooks + Components):** ≥ 70% line coverage (integration-focused)

---

## Tier 1 — Pure Logic (Zero Dependencies)

_These are pure functions with no external deps. Fastest to write, highest ROI._

### 1.1 `src/utils/kanaOrder.ts`

| Test                                     | Description                   |
| ---------------------------------------- | ----------------------------- |
| `sortKana` sorts by ROW_ORDER then vowel | あ行 before か行, a→i→u→e→o   |
| `sortKana` handles unknown rows          | Unlisted rows sort to the end |
| `vowelRank` returns correct rank         | a=0, i=1, u=2, e=3, o=4       |
| `vowelRank` handles special case         | 'n' → 5                       |

### 1.2 `src/utils/furigana.ts`

| Test                                | Description                                          |
| ----------------------------------- | ---------------------------------------------------- |
| `getFurigana` same kana/kanji       | kana === kanji → no reading                          |
| `getFurigana` simple kanji          | 食べる → [{text: "食", reading:"た"}, {text:"べる"}] |
| `getFurigana` multiple kanji blocks | 日本語 → correct alignments                          |
| `getFurigana` no kanji              | kana only → [{text: "ひらがな"}]                     |
| `getFurigana` empty kanji           | kanji = "" → [{text: ""}]                            |
| `getFurigana` ambiguous alignment   | Edge: kanji share same kana chars                    |
| `isKanji` char boundary             | 0x4E00–0x9FFF only                                   |

### 1.3 `src/data/historyStorage.ts`

| Test                                   | Description                    |
| -------------------------------------- | ------------------------------ |
| `loadHistory` returns empty            | No localStorage key → []       |
| `loadHistory` parses valid JSON        | Returns parsed SessionRecord[] |
| `loadHistory` handles corrupted JSON   | Parse error → []               |
| `saveRecord` prepends new record       | Newest first                   |
| `saveRecord` enforces MAX_RECORDS      | Truncates to 100               |
| `clearHistory` removes key             | localStorage key gone          |
| `saveRecord` persists across load/save | Round-trip consistency         |

### 1.4 `src/utils/sessionDraft.ts`

| Test                                 | Description                             |
| ------------------------------------ | --------------------------------------- |
| `saveDraft` / `loadDraft` round-trip | Stores under `kana-jump:draft:{userId}` |
| `loadDraft` returns null on missing  | No key → null                           |
| `loadDraft` handles corrupted JSON   | Catch → null                            |
| `clearDraft` removes key             | Key removed                             |
| Key isolation by userId              | User A's draft doesn't affect User B    |

### 1.5 `src/utils/vocabSessionDraft.ts`

| Test                                    | Description                         |
| --------------------------------------- | ----------------------------------- | --------- |
| Same structure as sessionDraft          | Key prefix `kana-jump:vocab-draft:` |
| VocabAnswer type correctness            | Rating                              | 'skipped' |
| QueueIds > VocabSessionDraft round-trip | Full object persists correctly      |

### 1.6 `src/utils/speak.ts`

| Test                                 | Description                        |
| ------------------------------------ | ---------------------------------- |
| `playWord` with audioUrl             | Creates Audio element, plays URL   |
| `playWord` fallback on error         | Audio error → speakJa() called     |
| `playWord` fallback on null audioUrl | No URL → speakJa() called          |
| `speakJa` guards server-side         | No window.speechSynthesis → return |
| `playWord` cancels previous          | Previous audio paused/cancelled    |

---

## Tier 2 — Service Layer (Supabase Mock Needed)

_Require mocking `src/lib/supabase.ts`. Use `vi.mock()` at module level._

### Mock Strategy

```ts
// src/test/__mocks__/supabase.ts
import { vi } from 'vitest'

export const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
    insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) })),
    upsert: vi.fn(() => Promise.resolve({ error: null })),
    delete: vi.fn(() => ({ in: vi.fn(() => Promise.resolve({ error: null })) })),
  })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } } })),
    getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
}
```

### 2.1 `src/services/vocab.ts`

| Test                                       | Description                  |
| ------------------------------------------ | ---------------------------- |
| `fetchBooks` returns books                 | Mock select → Book[]         |
| `fetchBooks` throws on error               | Mock error → throw           |
| `fetchChapters` filters by bookId          | .eq('book_id', id) called    |
| `fetchChapters` orders by order_idx        | .order('order_idx') called   |
| `fetchWordsByChapter` filters by chapterId | .eq('chapter_id', id) called |

### 2.2 `src/services/vocabFSRS.ts`

| Test                                  | Description                                    |
| ------------------------------------- | ---------------------------------------------- |
| `rateWordWithFSRS` new word           | No existing progress → creates card from empty |
| `rateWordWithFSRS` existing word      | Loads progress → applies FSRS → upserts        |
| `rateWordWithFSRS` each rating        | Rating 1-4 produce different stability/due     |
| `rateWordWithFSRS` propagates error   | Supabase error → throw                         |
| `fetchDueWords` returns joined Word[] | Nested words(\*) parsed correctly              |
| `fetchDueWords` unauthenticated       | No user → []                                   |
| `fetchDueWords` empty progress        | No due words → []                              |
| `fetchDueWords` orders by due ASC     | .order('due', { ascending: true })             |
| `fetchDueWords` limits results        | .limit(30) default                             |
| `countDueWords` returns count         | Count query returns number                     |
| `countDueWords` unauthenticated       | No user → 0                                    |
| `rowToCard` null progress             | Returns empty card                             |
| `rowToCard` full progress             | Date fields parsed correctly                   |

### 2.3 `src/services/vocabProgress.ts`

| Test                                     | Description                            |
| ---------------------------------------- | -------------------------------------- |
| `saveVocabSessionBatch` creates session  | Inserts session row                    |
| `saveVocabSessionBatch` creates attempts | Inserts N vocab_attempts rows          |
| `saveVocabSessionBatch` no attempts      | Empty array → only session created     |
| `saveVocabSessionBatch` unauthenticated  | No user → throws                       |
| `fetchVocabHistory` returns history      | Nested books/chapters titles extracted |
| `fetchVocabHistory` missing relations    | Null book/chapter → null title         |
| `deleteVocabSessions` deletes by ids     | .in('id', ids) called                  |
| `deleteVocabSessions` empty ids          | No-op, no query                        |

### 2.4 `src/services/supabaseStorage.ts`

| Test                                     | Description                                |
| ---------------------------------------- | ------------------------------------------ |
| `saveSession` inserts session + attempts | Session row + correct/wrong/skipped rows   |
| `saveSession` unauthenticated            | No user → throws                           |
| `getSessions` returns ordered list       | .order('created_at', { ascending: false }) |
| `getCardStats` aggregates correctly      | Multiple attempts per card → summed counts |
| `getCardStats` no data                   | Empty [] → {}                              |
| `deleteRecords` filters by ids           | .in('id', ids)                             |
| `clearAll` deletes everything            | .gte('created_at', '1970-01-01')           |

### 2.5 `src/lib/supabase.ts`

| Test                         | Description           |
| ---------------------------- | --------------------- |
| `isSupabaseConfigured` true  | Both env vars present |
| `isSupabaseConfigured` false | Missing URL or key    |

---

## Tier 3 — Hooks (jsdom + @testing-library/react)

_Requires `renderHook` from `@testing-library/react`. Mock Supabase for hooks that use it._

### 3.1 `src/hooks/useSession.ts`

| Test                                 | Description                             |
| ------------------------------------ | --------------------------------------- |
| Initial state                        | status: 'idle', queue: [], etc.         |
| `start` sets playing                 | Queue populated, index 0                |
| `answer(true)` marks correct         | correct[] includes card, index advances |
| `answer(false)` marks wrong          | wrong[] includes card                   |
| Last answer → finished               | status flips to 'finished'              |
| `skip` adds to skipped               | skipped[] includes card                 |
| `goBack` decrements index            | currentIndex -1                         |
| `goBack` at start                    | No-op when index = 0                    |
| `goNext` increments index            | currentIndex +1                         |
| `goNext` at end                      | No-op when at last card                 |
| `resume` restores state              | Queue + index + answers restored        |
| `restart` resets playing             | Fresh queue, index 0, empty answers     |
| `backToFilter` → idle                | status: 'idle'                          |
| `correct` `wrong` `skipped` computed | Derived correctly from answers          |
| `remaining` computed                 | queue.length - currentIndex             |

### 3.2 `src/hooks/useVocabSession.ts`

| Test                           | Description                         |
| ------------------------------ | ----------------------------------- |
| Initial state                  | status: 'idle'                      |
| `start` → playing              | Queue populated                     |
| `rate(3)` marks Good           | Good count incremented              |
| Last rate → finished           | status 'finished'                   |
| `skip` → skipped               | Skipped count incremented           |
| `resume` past queue → finished | Index >= length → finished          |
| `resume` empty queue → idle    | Empty queue → idle                  |
| `counts` computed correctly    | again/hard/good/easy/skipped counts |
| `goBack` `goNext` boundary     | No-op at start/end                  |
| `restart` `exit`               | State reset properly                |

### 3.3 `src/hooks/useCards.ts`

| Test                               | Description                             |
| ---------------------------------- | --------------------------------------- |
| Loading state                      | loading = true initially                |
| Load success                       | Fetches /kana_cards.json, sets allCards |
| Load error                         | Network fail → error message            |
| Filter by groups                   | .filter(c => groups.has(c.group))       |
| Filter by rows                     | .filter(c => rows.has(c.row))           |
| Combined filter                    | Both groups AND rows applied            |
| availableRows from group filter    | Only rows present in selected groups    |
| availableRows sorted               | ROW_ORDER respected                     |
| getSorted returns sorted cards     | sortKana applied                        |
| getShuffled returns shuffled cards | Not same order as input                 |

### 3.4 `src/hooks/useAuth.ts`

| Test                              | Description                   |
| --------------------------------- | ----------------------------- |
| Initial loading                   | loading = true, user = null   |
| Auth state populated              | Mock session → user set       |
| `signIn` returns error on failure | Bad password → error returned |
| `signOut` clears user             | user → null                   |

### 3.5 Other Hooks (useBooks, useChapters, useWords, useDueWords, useVocabHistory, useHistory)

_Each follows a similar pattern: loading → data → error states_

---

## Tier 4 — Components (@testing-library/react + jsdom)

_To be tackled after Tiers 1-3. Each component tested for:_

- Renders without crashing
- Renders expected content given props
- Handles empty / loading / error states
- User interactions (click, type) trigger callbacks
- Accessibility basics (role, label, aria)

### Component Inventory

| Module    | Files                                                                                                                       |
| --------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Kana**  | AuthGate, BrowsePanel, Card, CardStack, ErrorDashboard, FilterBar, HistoryPanel, KanaDetailModal, ResultPanel, SessionStats |
| **Vocab** | App, BookList, Card, CardStack, ChapterList, HistoryPanel, Result, AudioButton                                              |

---

## Appendix: Running Tests

```bash
# Watch mode (dev)
npm run test

# Single run (CI)
npm run test:run

# With UI
npm run test:ui

# Coverage
npm run test:coverage
```
