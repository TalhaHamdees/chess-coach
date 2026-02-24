# Chess Coach AI — Comprehensive Project Analysis

> Generated: 2026-02-23 | Commit: bd3e394 | Branch: master
> Use this document to discuss the project's architecture, strengths, gaps, and future direction with an LLM.

---

## 1. Project Overview

**Chess Coach AI** is an AI-powered personal chess trainer that replaces a private chess teacher. Users learn openings, tactics, and endgames through conversational coaching with real-time board interaction.

| Metric | Value |
|--------|-------|
| Total source files | 70 (.ts/.tsx, excluding tests) |
| Total test files | 43 (35 unit + 8 E2E) |
| Total lines of code | ~17,700 (src/) |
| Unit tests | 648 passing |
| E2E tests | 35 passing (Playwright) |
| Pages/routes | 11 |
| Zustand stores | 8 |
| Type definition files | 6 |
| Dependencies | 11 production + 16 dev |

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript (strict) | 5.x |
| UI Framework | React | 19.2.3 |
| Styling | Tailwind CSS v4 | 4.x |
| Component Library | shadcn/ui + Radix UI | 1.4.3 |
| Chess Logic | chess.js | 1.4.0 |
| State Management | Zustand | 5.0.11 |
| AI | Anthropic Claude API (Sonnet) | SDK 0.78.0 |
| Icons | Lucide React | 0.575.0 |
| Dark Mode | next-themes | 0.4.6 |
| Unit Testing | Vitest + Testing Library | 4.0.18 |
| E2E Testing | Playwright | 1.58.2 |
| DOM Environment | jsdom | 28.1.0 |

---

## 3. Architecture

### 3.1 App Router Structure

```
src/app/
├── page.tsx                    # Home/landing with board + navigation
├── layout.tsx                  # Root layout (ThemeProvider, fonts)
├── coach/page.tsx              # Free-form AI coaching chat
├── analyze/page.tsx            # PGN import + game analysis
├── plan/page.tsx               # Rating improvement planner
├── train/
│   ├── opening/page.tsx        # Opening catalog selector
│   ├── opening/[id]/page.tsx   # Interactive opening trainer
│   ├── tactics/page.tsx        # Tactics puzzle selector + solver
│   ├── endgame/page.tsx        # Endgame position selector + trainer
│   └── custom/page.tsx         # Custom position setup + play
└── api/coach/route.ts          # POST — Claude API proxy (server-only)
```

### 3.2 State Management (8 Zustand Stores)

| Store | Purpose | Persistence |
|-------|---------|-------------|
| `gameStore` | Board state, FEN, moves, arrows, highlights, sound, flip | None (ephemeral) |
| `coachStore` | Chat messages, AI context, cross-store bridge | None |
| `openingTrainerStore` | Opening variation playthrough, move validation | localStorage (per-opening) |
| `tacticsStore` | Puzzle solving, hints, wrong-move feedback | localStorage |
| `endgameStore` | Endgame position training, hints, completion | localStorage |
| `progressStore` | SM-2 spaced repetition, streak, all progress | Zustand persist middleware |
| `analysisStore` | PGN import, move annotations, navigation | None |
| `customTrainerStore` | Board setup mode, piece placement, FEN generation | None |

**Cross-store communication pattern:** Trainer stores and coachStore read/write gameStore via `useGameStore.getState()` (synchronous, outside React render cycle).

### 3.3 Component Architecture

```
src/components/
├── board/          # ChessBoard (controlled), ArrowOverlay (SVG), SquareHighlight,
│                   # MoveHistory, PiecePalette, SetupBoard
├── coach/          # ChatPanel, ChatMessage, SuggestedPrompts, ArrowLegend,
│                   # MobileChatDrawer, InlineCoachFeedback
├── training/       # OpeningCard, VariationTree, TrainerFeedback, ProgressBar,
│                   # SpacedRepetition, LichessExplorer, PuzzleCard, EndgameCard,
│                   # TacticsFeedback
├── analysis/       # PGNImport, MoveNavigator
└── ui/             # shadcn primitives (button, card, input, badge, scroll-area,
                    # sheet, ThemeProvider, ThemeToggle)
```

**ChessBoard** is a controlled component: receives FEN as prop, fires `onSquareClick` callback. All state lives in gameStore.

### 3.4 AI Pipeline

```
User message → coachStore.sendMessage()
  → POST /api/coach/route.ts (server-side)
    → buildContext() from prompts.ts (system prompt + board state + history)
    → Anthropic SDK → Claude Sonnet
    → Server-side move validation (engine.ts)
    → Structured JSON response parsing (parser.ts)
  ← CoachResponse { message, fen, arrows, highlights, engineMove, suggestedMove, moveQuality }
  → coachStore applies arrows/highlights/FEN to gameStore
  → UI re-renders
```

**Security:** API key never exposed client-side. All Claude calls go through the server route handler. Rate limiting returns 429. Error codes: 400/429/500/503.

### 3.5 Data Layer

All training data is static TypeScript constants (not fetched from API):

| Data Source | File | Count |
|------------|------|-------|
| Openings | `src/lib/data/openings.ts` | 12 openings with variations |
| Tactics | `src/lib/data/tactics.ts` | 12 puzzles, 9 themes, 3 difficulties |
| Endgames | `src/lib/data/endgames.ts` | 12 positions, 8 categories |

**External API:** Lichess Opening Explorer (`src/lib/lichess.ts`) for real game statistics, with rate limiting.

---

## 4. Feature Inventory

### 4.1 Home Page (`/`)
- Interactive chessboard with SVG piece images
- New Game / Flip Board controls
- Navigation to all 7 feature pages
- Dark mode toggle (next-themes)
- Turn indicator

### 4.2 Opening Trainer (`/train/opening/[id]`)
- 12 openings catalog with category filter (White/Black/All)
- Interactive variation tree with progress indicators
- Move-by-move playthrough with auto opponent moves
- Wrong move detection with red highlight + sound feedback
- Auto-hint after 3 wrong attempts (arrow overlay)
- SM-2 spaced repetition scheduling for review
- Completion tracking per variation (localStorage)
- Lichess Explorer integration for real game statistics

### 4.3 Tactics Trainer (`/train/tactics`)
- 12 puzzles across 9 themes (pin, fork, skewer, discovery, etc.)
- 3 difficulty levels (beginner/intermediate/advanced)
- Progressive text hints + arrow hints
- Wrong move feedback with visual + audio cues
- Solve time tracking
- Progress persistence (localStorage + progressStore)

### 4.4 Endgame Trainer (`/train/endgame`)
- 12 positions across 8 categories (K+P, K+R, K+Q, etc.)
- Difficulty filtering
- Hint system (text → arrow escalation)
- Completion tracking with wrong attempts and hints used

### 4.5 Game Analysis (`/analyze`)
- PGN paste, file upload, and Lichess URL import
- Move-by-move navigation with keyboard shortcuts
- AI-powered move annotations and coaching
- Move quality indicators (brilliant/good/inaccuracy/mistake/blunder)
- Arrow and highlight overlays from AI analysis

### 4.6 Coach Chat (`/coach`)
- Free-form conversational coaching
- 60/40 board/chat split layout
- AI responds with structured board interactions (arrows, highlights, FEN changes)
- Suggested prompts for common questions
- Mobile: bottom-sheet chat drawer with floating button

### 4.7 Custom Position (`/train/custom`)
- Board setup mode with piece palette (click-to-place)
- FEN import/export
- Position validation before play
- Transition to play mode against AI coaching

### 4.8 Rating Planner (`/plan`)
- Form: current rating, target rating, time commitment, areas of focus
- AI-generated personalized study plan
- Chat interface for follow-up questions

---

## 5. Code Quality Assessment

### 5.1 Type Safety — Grade: A+
- TypeScript strict mode enabled
- Zero `any` types (enforced by CLAUDE.md rules)
- 6 dedicated type definition files
- All chess squares typed as algebraic notation strings
- All FEN strings validated before use
- AI responses parsed with try-catch (never trust raw JSON from LLM)

### 5.2 Test Coverage — Grade: A
- **648 unit tests** covering stores, components, utilities, and data validation
- **35 E2E tests** covering all 8 feature pages
- Test files co-located with source (e.g., `ChessBoard.test.tsx` beside `ChessBoard.tsx`)
- AI routes mocked in E2E via `page.route()` for deterministic tests
- All tests pass on CI (vitest + playwright)

### 5.3 Security — Grade: A
- API key server-side only (route handler proxy)
- No sensitive data in localStorage (only progress/preferences)
- Input validation on all API boundaries
- Rate limiting on coach API (429 responses)
- FEN validation before chess.js consumption

### 5.4 Accessibility — Grade: B
- Semantic HTML (`role="gridcell"` on board squares)
- Label associations for form inputs
- Dark mode support
- Mobile-first responsive design
- **Gaps:** No ARIA live regions for move announcements, no keyboard navigation for board squares, no screen reader announcements for AI responses

### 5.5 Performance — Grade: B+
- Static data (no runtime fetching for puzzles/openings)
- Controlled component pattern prevents unnecessary re-renders
- ResizeObserver for responsive arrow overlay
- **Gaps:** No code splitting beyond Next.js automatic page splitting, no memoization on expensive chess computations, no virtualization for long move histories

---

## 6. Architecture Patterns & Conventions

### Established Patterns
1. **Controlled board:** ChessBoard receives FEN, fires callbacks — all state external
2. **Cross-store sync:** Trainer stores write to gameStore via `getState()` (synchronous)
3. **Trainer lifecycle:** `loadPuzzle`/`loadPosition` → `solving` → `correct`/`wrong` → `completed`
4. **Timeout tracking:** Module-level `pendingTimeouts` Set with `scheduleTimeout`/`clearPendingTimeouts` in each trainer store (prevents memory leaks)
5. **AI response format:** Structured JSON with fallback to raw text on parse failure
6. **Sound effects:** Web Audio API (no audio files)
7. **Named exports** everywhere (no default exports except Next.js pages)
8. **`cn()` utility** for conditional classNames (clsx + tailwind-merge)

### Key Conventions
- Components: PascalCase filenames
- Utilities: camelCase filenames
- Arrow colors: green=good, red=bad, blue=alternative, yellow=key square, orange=threat
- chess.js normalizes en passant — never compare raw FEN strings
- chess.js `loadPgn()` throws — always try/catch
- `progressStore` uses Zustand `persist` middleware with custom storage adapter
- `updateStreak` uses functional `set((state) => {...})` to prevent race conditions
- Message IDs use `crypto.randomUUID()` with timestamp+random fallback
- Trainer store duplication is intentional (factory extraction evaluated and rejected)

---

## 7. Known Issues & Technical Debt

### High Priority
| Issue | Impact | Location |
|-------|--------|----------|
| No error boundaries | Unhandled errors crash entire app | All pages |
| No loading skeletons | Flash of empty content on navigation | All pages |
| ChessBoard test flaky timeout | Intermittent 5s timeout in full suite | `ChessBoard.test.tsx` |
| `act(...)` warning in PGNImport test | React state update not wrapped in act | `PGNImport.test.tsx` |

### Medium Priority
| Issue | Impact | Location |
|-------|--------|----------|
| No keyboard navigation on board | Accessibility gap for motor-impaired users | `ChessBoard.tsx` |
| No ARIA live regions | Screen readers can't follow game state | Board components |
| No code splitting for chess.js | ~100KB loaded on every page | Global |
| 20-message cap in coach chat | Hard limit, no pagination | `coachStore.ts` |
| No retry/offline handling | Network failures show raw errors | Coach/Lichess calls |
| SVG piece images not optimized | Could use sprite sheet | `/public/pieces/` |

### Low Priority
| Issue | Impact | Location |
|-------|--------|----------|
| No i18n support | English only | All text |
| No analytics/telemetry | No usage insights | N/A |
| Static puzzle data | Limited content, no user-generated | `src/lib/data/` |
| No promotion UI | Queen auto-promotion only | `gameStore.ts` |
| Sound effects use oscillators | Could use real audio samples | `sounds.ts` |

---

## 8. Project Statistics Summary

```
Source Files:        70 (.ts/.tsx)
Test Files:          43 (35 unit + 8 E2E)
Total Lines:         ~17,700
Unit Tests:          648 passing
E2E Tests:           35 passing
Pages:               11
Stores:              8
Components:          ~45
Type Files:          6
Lib Utilities:       ~15
Dependencies:        11 production
Dev Dependencies:    16
Openings Data:       12 openings
Tactics Data:        12 puzzles
Endgame Data:        12 positions
Git Commits:         ~12 on master
```

---

## 9. Dependency Graph

```
User Interface
  ├── Next.js 16 (App Router, SSR)
  │   ├── React 19
  │   └── TypeScript 5 (strict)
  ├── Tailwind CSS v4
  │   └── tw-animate-css
  ├── shadcn/ui
  │   ├── Radix UI primitives
  │   ├── class-variance-authority
  │   ├── clsx + tailwind-merge
  │   └── lucide-react (icons)
  └── next-themes (dark mode)

Chess Logic
  └── chess.js 1.4.0

State Management
  └── Zustand 5.0.11
      └── persist middleware (progressStore)

AI Pipeline
  └── @anthropic-ai/sdk 0.78.0
      └── Claude Sonnet (server-side only)

External APIs
  └── Lichess Opening Explorer (rate-limited)

Testing
  ├── Vitest 4.0.18 + jsdom 28
  ├── @testing-library/react 16
  └── Playwright 1.58.2
```

---

## 10. File Structure (Complete)

```
D:\Projects\Chess Coach\
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── coach/page.tsx
│   │   ├── analyze/page.tsx
│   │   ├── plan/page.tsx
│   │   ├── train/
│   │   │   ├── opening/page.tsx
│   │   │   ├── opening/[id]/page.tsx
│   │   │   ├── tactics/page.tsx
│   │   │   ├── endgame/page.tsx
│   │   │   └── custom/page.tsx
│   │   └── api/coach/route.ts
│   ├── components/
│   │   ├── board/
│   │   │   ├── ChessBoard.tsx (+test)
│   │   │   ├── ArrowOverlay.tsx
│   │   │   ├── SquareHighlight.tsx
│   │   │   ├── MoveHistory.tsx (+test)
│   │   │   ├── PiecePalette.tsx (+test)
│   │   │   └── SetupBoard.tsx
│   │   ├── coach/
│   │   │   ├── ChatPanel.tsx (+test)
│   │   │   ├── ChatMessage.tsx (+test)
│   │   │   ├── SuggestedPrompts.tsx
│   │   │   ├── ArrowLegend.tsx (+test)
│   │   │   ├── MobileChatDrawer.tsx (+test)
│   │   │   └── InlineCoachFeedback.tsx (+test)
│   │   ├── training/
│   │   │   ├── OpeningCard.tsx (+test)
│   │   │   ├── VariationTree.tsx (+test)
│   │   │   ├── TrainerFeedback.tsx (+test)
│   │   │   ├── ProgressBar.tsx (+test)
│   │   │   ├── SpacedRepetition.tsx (+test)
│   │   │   ├── LichessExplorer.tsx (+test)
│   │   │   ├── PuzzleCard.tsx
│   │   │   ├── EndgameCard.tsx
│   │   │   └── TacticsFeedback.tsx
│   │   ├── analysis/
│   │   │   ├── PGNImport.tsx (+test)
│   │   │   └── MoveNavigator.tsx (+test)
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── badge.tsx
│   │       ├── scroll-area.tsx
│   │       ├── sheet.tsx
│   │       ├── ThemeProvider.tsx
│   │       └── ThemeToggle.tsx (+test)
│   ├── stores/
│   │   ├── gameStore.ts (+test)
│   │   ├── coachStore.ts (+test)
│   │   ├── openingTrainerStore.ts (+test)
│   │   ├── tacticsStore.ts (+test)
│   │   ├── endgameStore.ts (+test)
│   │   ├── progressStore.ts (+test)
│   │   ├── analysisStore.ts (+test)
│   │   └── customTrainerStore.ts (+test)
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── lichess.ts (+test)
│   │   ├── sounds.ts
│   │   ├── spaced-repetition.ts (+test)
│   │   ├── ai/
│   │   │   ├── coach.ts
│   │   │   ├── parser.ts (+test)
│   │   │   ├── move-validator.ts (+test)
│   │   │   └── prompts.ts
│   │   ├── chess/
│   │   │   ├── engine.ts (+test)
│   │   │   ├── pgn.ts (+test)
│   │   │   └── fen.ts (+test)
│   │   └── data/
│   │       ├── openings.ts (+test)
│   │       ├── tactics.ts (+test)
│   │       └── endgames.ts (+test)
│   └── types/
│       ├── chess.ts
│       ├── coach.ts
│       ├── opening.ts
│       ├── progress.ts
│       ├── tactics.ts
│       └── endgame.ts
├── e2e/
│   ├── home.spec.ts
│   ├── opening-trainer.spec.ts
│   ├── tactics.spec.ts
│   ├── endgame.spec.ts
│   ├── analyze.spec.ts
│   ├── custom.spec.ts
│   ├── coach.spec.ts
│   └── plan.spec.ts
├── public/pieces/               # SVG chess piece images
├── CLAUDE.md                    # AI coding instructions
├── package.json
├── tsconfig.json                # strict, ES2022 target
├── vitest.config.ts
├── playwright.config.ts
├── next.config.ts
├── postcss.config.mjs
└── eslint.config.mjs
```

---

## 11. AI Coaching System Details

### System Prompt Architecture
Located in `src/lib/ai/prompts.ts`, context builders generate specialized system prompts for each mode:

| Builder | Used By | Purpose |
|---------|---------|---------|
| `buildCoachContext` | Coach chat | General coaching with board state |
| `buildAnalysisContext` | Game analysis | Move-by-move game review |
| `buildOpeningTrainerContext` | Opening trainer | Opening-specific coaching |
| `buildTacticsTrainerContext` | Tactics trainer | Puzzle hint coaching |
| `buildEndgameTrainerContext` | Endgame trainer | Endgame technique coaching |
| `buildPlannerContext` | Rating planner | Study plan generation |

### AI Response Schema
```typescript
interface CoachResponse {
  message: string;           // Coach's explanation text
  fen: string | null;        // New board position (null = no change)
  arrows: Arrow[];           // Visual arrows on board
  highlights: string[];      // Squares to highlight
  engineMove: string | null; // Engine's next move "e2-e4" format
  suggestedMove: string | null; // Hint for student
  moveQuality: "brilliant" | "good" | "inaccuracy" | "mistake" | "blunder" | null;
}
```

### Server-Side Move Validation
`src/lib/ai/move-validator.ts` validates AI-suggested moves against the current board position using chess.js before returning to the client, preventing invalid board states from AI hallucinations.

---

## 12. Spaced Repetition System

Uses the **SM-2 algorithm** (`src/lib/spaced-repetition.ts`):

- **Quality mapping:** Wrong attempts → quality score (0-5)
- **Ease factor:** Adjusts based on performance (min 1.3)
- **Interval calculation:** Days until next review
- **Review urgency:** overdue / due-today / due-soon / not-due
- **Streak tracking:** Consecutive days of practice (race-condition-safe)

Progress stored via Zustand persist middleware with custom storage adapter for backwards compatibility with pre-middleware localStorage format.

---

## 13. Potential Future Directions

### Short-Term Improvements
1. **Error boundaries** — Wrap each page in React error boundaries to prevent full-app crashes
2. **Loading states** — Add skeleton UI for page transitions and AI responses
3. **Keyboard board navigation** — Arrow keys + Enter for accessible board interaction
4. **Promotion UI** — Let users choose promotion piece (currently auto-queen)
5. **More training content** — Expand beyond 12 puzzles/endgames per category

### Medium-Term Features
6. **User authentication** — Supabase integration for cloud progress sync
7. **Puzzle rating system** — Elo-like rating that adjusts based on solve performance
8. **Opening Explorer integration** — Show Lichess stats inline during opening training
9. **Game import from chess.com** — Expand beyond Lichess URL support
10. **Multiplayer analysis** — Share analysis boards via URL

### Long-Term Vision
11. **Adaptive difficulty** — AI adjusts puzzle/lesson difficulty based on user performance
12. **Custom opening repertoire** — Users build and train their own opening lines
13. **Tournament preparation** — Opponent-specific preparation using game databases
14. **Voice coaching** — Text-to-speech for AI responses during play
15. **Mobile app** — React Native or PWA for offline training
16. **Community features** — Shared puzzles, leaderboards, study groups

### Infrastructure
17. **Deployment to Vercel** — Production hosting with edge functions
18. **Database migration** — Supabase for persistent user data (replacing localStorage)
19. **CI/CD pipeline** — GitHub Actions for automated testing on PR
20. **Performance monitoring** — Web Vitals tracking, error reporting (Sentry)
21. **API caching** — Cache Lichess API responses, reduce Claude API costs
22. **i18n** — Multi-language support

---

## 14. Session History

| Session | Date | Focus | Tests After |
|---------|------|-------|-------------|
| 1 | 2026-02-23 | Project scaffold + chess engine | 27 |
| 2 | 2026-02-23 | ChessBoard component + gameStore | 69 |
| 3 | 2026-02-23 | Coach Chat Panel (AI pipeline) | 131 |
| 4 | 2026-02-23 | Opening Data + Selector UI | 159 |
| 5 | 2026-02-23 | Interactive Opening Trainer | 216 |
| 6 | 2026-02-23 | Spaced Repetition + Lichess API | 309 |
| 7 | 2026-02-23 | Server-side move validation | 331 |
| 8 | 2026-02-23 | Game Analysis Mode | 394 |
| 9 | 2026-02-23 | Tactics + Endgame Trainers | 540 |
| 10 | 2026-02-23 | Coach Chat + Custom Position + Planner | 613 |
| 11 | 2026-02-23 | E2E Tests + Dark Mode + Mobile | 622 + 35 E2E |
| 12 | 2026-02-23 | Code Quality Audit + Bug Fixes | 648 + 35 E2E |

All 12 sessions completed in a single day. The entire application was built from scratch to 17,700+ lines with 683 total tests.
