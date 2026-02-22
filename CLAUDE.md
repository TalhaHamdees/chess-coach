# Chess Coach AI

AI-powered personal chess trainer that replaces a private chess teacher. Users learn openings, tactics, endgames through conversational coaching with real-time board interaction.

## Tech Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **UI:** Tailwind CSS + shadcn/ui
- **Chess Logic:** chess.js (move validation, FEN/PGN)
- **Board Rendering:** Custom React component with SVG arrow overlay
- **AI:** Claude API (Sonnet for coaching responses)
- **State:** Zustand for global state, React hooks for local
- **Data:** Lichess Opening Explorer API for real game statistics
- **Persistence:** localStorage + IndexedDB (V1), Supabase (V2)
- **Deployment:** Vercel

## Development Commands

```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run lint         # ESLint check
npm run type-check   # TypeScript strict check
npm test             # Run Vitest
npm run test:e2e     # Playwright E2E tests
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx
│   ├── page.tsx            # Home/landing
│   ├── train/
│   │   ├── opening/[id]/   # Opening trainer
│   │   ├── tactics/        # Tactics trainer
│   │   ├── endgame/        # Endgame trainer
│   │   └── custom/         # Custom position
│   ├── coach/              # Free chat with coach
│   ├── analyze/            # Game analysis
│   ├── plan/               # Rating improvement planner
│   └── api/
│       └── coach/          # Proxy to Claude API
├── components/
│   ├── board/
│   │   ├── ChessBoard.tsx      # Main board component
│   │   ├── ArrowOverlay.tsx    # SVG arrows on board
│   │   ├── SquareHighlight.tsx # Square highlighting
│   │   ├── PiecePalette.tsx    # Setup mode piece selector
│   │   └── MoveHistory.tsx     # Move list with navigation
│   ├── coach/
│   │   ├── ChatPanel.tsx       # Coach conversation UI
│   │   ├── ChatMessage.tsx     # Individual message bubble
│   │   └── SuggestedPrompts.tsx
│   ├── training/
│   │   ├── OpeningSelector.tsx
│   │   ├── VariationTree.tsx
│   │   ├── ProgressBar.tsx
│   │   └── SpacedRepetition.tsx
│   └── ui/                 # shadcn/ui primitives
├── lib/
│   ├── chess/
│   │   ├── engine.ts       # Chess logic wrapper around chess.js
│   │   ├── arrows.ts       # Arrow calculation utilities
│   │   ├── fen.ts          # FEN parsing/generation helpers
│   │   └── pgn.ts          # PGN import/export
│   ├── ai/
│   │   ├── coach.ts        # Claude API client
│   │   ├── prompts.ts      # System prompts for coaching modes
│   │   └── parser.ts       # Parse structured AI responses
│   ├── data/
│   │   ├── openings.ts     # Opening catalog with teaching data
│   │   ├── tactics.ts      # Tactical puzzle data
│   │   └── endgames.ts     # Endgame position data
│   ├── lichess.ts          # Lichess API client
│   └── utils.ts            # General utilities
├── stores/
│   ├── gameStore.ts        # Board state, moves, FEN
│   ├── coachStore.ts       # Chat history, AI context
│   └── progressStore.ts    # Learning progress, spaced rep
└── types/
    ├── chess.ts            # Chess-related types
    ├── coach.ts            # AI response types
    └── progress.ts         # Progress tracking types
```

## Architecture Rules

- All AI API calls go through `src/app/api/coach/` route handler — NEVER call Claude API from client-side
- Chess move validation uses chess.js — do NOT write custom move validation
- Board component is a controlled component: receives FEN as prop, fires onMove callback
- Arrow data flows from AI response → store → ArrowOverlay component
- Opening data lives in `src/lib/data/openings.ts` as typed constants — not fetched from API
- Lichess Opening Explorer calls use `src/lib/lichess.ts` wrapper with rate limiting

## Code Conventions

- Named exports everywhere, no default exports (except Next.js pages)
- Components: PascalCase filenames (`ChessBoard.tsx`)
- Utilities: camelCase filenames (`formatDate.ts`)
- Use `cn()` from `@/lib/utils` for conditional classNames
- Prefer `interface` over `type` for object shapes
- All chess squares represented as algebraic notation strings: `"e4"`, `"d7"`
- All FEN strings validated before use
- AI responses always parsed with try-catch — never trust raw JSON from LLM

## AI Response Format

The Claude coaching API must always return this JSON structure:

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

## Critical Rules

- NEVER expose the Anthropic API key in client-side code
- NEVER use `any` type — always define proper types
- NEVER store sensitive data in localStorage
- Always handle loading and error states in UI
- Always validate FEN strings before passing to chess.js
- Keep AI system prompts in `src/lib/ai/prompts.ts`, not inline
- Board must work without AI (offline-capable for move making)
- Mobile-first responsive design — board full-width on small screens
- Arrow colors: green=good, red=bad/danger, blue=alternative, yellow=key square, orange=threat

## Testing Strategy

- Unit tests for chess utilities (FEN parsing, move validation helpers)
- Component tests for ChessBoard (renders correctly, handles clicks)
- Integration tests for AI response parsing
- E2E tests for opening trainer flow (select opening → play through → correction)
- Test file lives next to source: `ChessBoard.test.tsx` beside `ChessBoard.tsx`

## When Compacting

Always preserve: the full project structure, the AI response format spec, current implementation status, and the list of files that have been modified in this session.
