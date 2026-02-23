# Chess Coach AI

AI-powered personal chess trainer that replaces a private chess teacher. Learn openings, tactics, and endgames through conversational coaching with real-time board interaction.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![Tests](https://img.shields.io/badge/tests-672%20passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Interactive Chessboard** — Drag-free click-to-move board with SVG arrow overlays, square highlights, and flip animation
- **AI Coach Chat** — Conversational coaching powered by Claude API with structured JSON responses (arrows, highlights, move quality)
- **Opening Trainer** — 12 openings with variation trees, spaced repetition scheduling (SM-2), and Lichess Explorer stats
- **Tactics Trainer** — 12 puzzles across 9 themes (forks, pins, skewers, etc.) with 3 difficulty levels and hint system
- **Endgame Trainer** — 12 positions across 8 categories with key technique guidance
- **Custom Position** — Setup any position with piece palette, import FEN, then play and get coaching
- **Game Analysis** — Import PGN or paste a Lichess URL, navigate moves, and get AI annotations
- **Rating Planner** — Form-driven study plan generation based on current rating, goals, and weaknesses
- **Dark Mode** — System-aware theme toggle on every page
- **Mobile-First** — Responsive layout with bottom-sheet chat drawer on small screens

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript strict) |
| UI | Tailwind CSS v4 + shadcn/ui |
| Chess Logic | chess.js (move validation, FEN/PGN) |
| Board | Custom React SVG component with numbered arrow overlay |
| AI | Claude API (Sonnet) via server-side route handler |
| State | Zustand (game, coach, trainer, progress stores) |
| Data | Lichess Opening Explorer API |
| Persistence | localStorage + IndexedDB |
| Testing | Vitest (672 unit tests) + Playwright (35 E2E tests) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
git clone https://github.com/TalhaHamdees/chess-coach.git
cd chess-coach
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

> The API key is only used server-side in `src/app/api/coach/route.ts` and is never exposed to the client.

### Development

```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run lint         # ESLint check
npm run type-check   # TypeScript strict check
npm test             # Run Vitest unit tests
npm run test:e2e     # Playwright E2E tests
```

## Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Home — board + chat + nav grid
│   ├── coach/page.tsx          # Coach Chat — 60/40 board/chat split
│   ├── analyze/page.tsx        # Game Analysis — PGN import + navigation
│   ├── plan/page.tsx           # Rating Planner — form + AI chat
│   ├── train/
│   │   ├── opening/[id]/       # Opening Trainer
│   │   ├── tactics/            # Tactics Trainer
│   │   ├── endgame/            # Endgame Trainer
│   │   └── custom/             # Custom Position Trainer
│   └── api/coach/route.ts      # Claude API proxy (server-only)
├── components/
│   ├── board/                  # ChessBoard, ArrowOverlay, MoveHistory
│   ├── coach/                  # ChatPanel, ChatMessage, ArrowLegend, MobileChatDrawer
│   ├── training/               # OpeningSelector, ProgressBar, TrainerFeedback
│   └── ui/                     # shadcn/ui primitives + ThemeToggle
├── lib/
│   ├── chess/                  # engine.ts, fen.ts, pgn.ts, arrows.ts
│   ├── ai/                     # coach.ts, prompts.ts, parser.ts
│   ├── data/                   # openings.ts, tactics.ts, endgames.ts
│   ├── lichess.ts              # Lichess API client with rate limiting
│   └── sounds.ts               # Web Audio API sound effects
├── stores/                     # Zustand stores (game, coach, progress, trainers)
└── types/                      # TypeScript type definitions
```

## Architecture

- **Server-side AI** — All Claude API calls go through `src/app/api/coach/route.ts`. The API key never reaches the client.
- **Controlled board** — `ChessBoard` receives FEN as prop and fires `onSquareClick`. All state lives in Zustand stores.
- **Numbered arrows** — When the AI returns 2+ arrows, the board renders numbered SVG labels. An `ArrowLegend` in chat messages maps numbers to from/to notation and color meanings.
- **Cross-store bridge** — Coach and trainer stores read/write game state via `useGameStore.getState()`.
- **Spaced repetition** — Opening progress uses SM-2 algorithm for review scheduling.

## Testing

Tests live next to source files (`Component.test.tsx` beside `Component.tsx`).

```bash
npm test             # 672 unit tests via Vitest
npm run test:e2e     # 35 E2E tests via Playwright (chromium)
```

Coverage areas:
- Chess engine utilities (FEN parsing, move validation)
- All Zustand stores (game, coach, progress, tactics, endgame, custom, analysis)
- UI components (board rendering, chat panel, arrow legend, trainer feedback)
- AI response parsing with edge cases
- E2E flows with mocked AI responses

## License

MIT
