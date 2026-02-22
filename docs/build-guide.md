# Building Chess Coach AI with Claude Code — Complete Setup & Guidelines

---

## Part 1: Your CLAUDE.md File (Copy This Into Your Project Root)

The `CLAUDE.md` file is the **most important file in your entire project**. Claude Code reads it at the start of every session. It's your project's permanent brain — telling Claude your stack, structure, conventions, and rules. 

The prepared CLAUDE.md file (attached as a separate download) contains:

- **Tech Stack:** Next.js 15, TypeScript, Tailwind, shadcn/ui, chess.js, Zustand, Claude API
- **Full project structure:** every folder, every key file, with explanations
- **Architecture rules:** API calls through server routes only, chess.js for validation, controlled board component
- **Code conventions:** named exports, PascalCase components, AI response format spec
- **Critical rules:** no API keys in client, no `any` types, mobile-first design
- **Compaction instructions:** what to preserve when context gets compressed

**Key principle from research:** CLAUDE.md should be under 150 lines. Beyond that, instruction-following degrades uniformly across all rules. The prepared file is ~120 lines — right in the sweet spot.

---

## Part 2: How Claude Code Works (What You Need to Know)

### The Context Window Problem

Claude Code's entire conversation — your messages, every file it reads, every command output — lives in a single context window. This fills up fast. When it fills:

- Claude starts "forgetting" earlier instructions
- Code quality degrades
- Bugs increase

**This is the #1 thing to manage.** Everything else follows from this.

### What Claude Code Reads Automatically

1. **CLAUDE.md** in project root → read every session
2. **CLAUDE.md** in subdirectories → read when working in that directory
3. **~/.claude/CLAUDE.md** → your global preferences (applied everywhere)
4. **Memory** → persistent notes you save with `/memory add`

### The Hierarchy

```
~/.claude/CLAUDE.md          ← Global (your coding preferences)
  └── project/CLAUDE.md      ← Project (stack, structure, rules)  ← THIS IS THE ONE WE PREPARED
       └── project/src/components/CLAUDE.md  ← Directory-specific (optional)
```

---

## Part 3: The Golden Rules

### Rule 1: One Feature Per Session

The most impactful practice. Start a fresh session (`/clear`) for each feature.

- Session 1: Set up project + chess utilities
- Session 2: ChessBoard component
- Session 3: Arrow overlay system
- Session 4: AI coaching API route
- ...and so on

**Never** try to build multiple unrelated features in the same session.

### Rule 2: Plan Before You Code

Press `Shift+Tab` twice to enter **Plan Mode**. Claude analyzes but cannot modify files.

```
[Plan Mode] I want to build the opening trainer module. 
Read CLAUDE.md for requirements. Create a detailed plan 
listing every file, component, and data flow. 
Write it to docs/plan-opening-trainer.md.
```

Review the plan. Then start a **new session** to implement it.

### Rule 3: Verify Everything

Always ask Claude to test its own work:

```
Build the FEN parser. Write unit tests covering:
- Starting position
- Position after 1.e4 e5
- Invalid FEN strings  
Run the tests and fix any failures.
```

### Rule 4: Commit Between Sessions

```bash
git checkout -b feature/chessboard    # Before starting
# ... Claude builds the feature ...
git add . && git commit -m "feat: chessboard component"
git checkout main && git merge feature/chessboard
git checkout -b feature/ai-coaching   # Next feature
```

If something goes wrong, you can always `git checkout main`.

### Rule 5: Use Subagents for Research

When Claude needs to investigate APIs, read many files, or explore:

```
Use a subagent to investigate the Lichess Opening Explorer API.
Find endpoints, parameters, and response formats.
Report back a summary.
```

Subagents run in separate context windows — they don't eat your main context.

---

## Part 4: Session-by-Session Build Guide

### Phase 1: Core Engine (3 sessions, ~4 hours)

**Session 1 — Project Scaffold + Chess Utilities**
```
Set up Next.js 15 with TypeScript, Tailwind, shadcn/ui. 
Install chess.js and zustand.
Create the folder structure from CLAUDE.md.
Build src/lib/chess/engine.ts — wrapper around chess.js providing:
makeMove, getValidMoves, isCheck, isCheckmate, parseFEN, validateFEN.
Write tests. Run them. Commit.
```

**Session 2 — ChessBoard Component**
```
Build src/components/board/ChessBoard.tsx:
- Receives FEN prop, renders board with Unicode pieces
- Click-to-move with valid move dots
- Board flipping, last move highlight
- File/rank coordinates
- Responsive: full-width mobile, max 520px desktop
```

**Session 3 — Arrow & Highlight Overlay**
```
Build ArrowOverlay.tsx — SVG arrows on the chessboard.
Arrows: from/to squares, 5 colors, proper arrowheads.
Build SquareHighlight.tsx — colored square overlays.
Both must account for board flipping.
```

### Phase 2: AI Coaching (3 sessions, ~4 hours)

**Session 4 — API Route + System Prompts**
```
Build src/app/api/coach/route.ts — proxies to Claude API.
Build src/lib/ai/prompts.ts — system prompts for each mode.
Build src/lib/ai/parser.ts — parse/validate AI JSON responses.
The API route must never expose the API key to the client.
```

**Session 5 — Chat Panel UI**
```
Build ChatPanel, ChatMessage, SuggestedPrompts components.
Coach messages: dark bg, green accent. Student: green gradient.
Loading animation. Auto-scroll. Enter-to-send.
```

**Session 6 — Wire Board ↔ Coach**
```
Connect board moves to coach API. 
Coach response updates arrows, highlights, and chat.
Engine moves animate on board after delay.
Full feedback loop: play → evaluate → respond → update.
```

### Phase 3: Opening Trainer (3 sessions, ~5 hours)

**Session 7 — Opening Data + Selector UI**
**Session 8 — Guided Walk-Through Training Flow**
**Session 9 — Spaced Repetition + Lichess API Integration**

### Phase 4: Additional Modules (5 sessions, ~8 hours)

**Session 10:** Tactics trainer
**Session 11:** Endgame trainer  
**Session 12:** Custom position editor
**Session 13:** Rating improvement planner
**Session 14:** Game analysis (PGN import)

### Phase 5: Polish & Deploy (3 sessions, ~4 hours)

**Session 15:** Mobile pass, dark theme, sounds
**Session 16:** Progress dashboard, achievements
**Session 17:** Vercel deployment, env vars, final tests

---

## Part 5: Prompting Patterns That Work

### Pattern 1: Context + Intent + Constraint

```
[CONTEXT] The ChessBoard component is built and accepts FEN prop 
and fires onMove(from, to).

[INTENT] Create the OpeningTrainer page connecting board to AI coach.

[CONSTRAINT] Follow CLAUDE.md architecture. Use CoachResponse type. 
Keep under 200 lines — extract sub-components if needed.
```

### Pattern 2: Show Before Building

```
Create a demo page at src/app/demo/page.tsx showing the 
OpeningSelector with 3 hardcoded openings. 
I want to see the layout before building the full thing.
```

### Pattern 3: Fix and Explain

```
Arrows don't render on the board. Read ArrowOverlay.tsx 
and ChessBoard.tsx. Explain what's wrong, fix it, 
then add a test to prevent regression.
```

### Pattern 4: Refactor After Working

```
The opening trainer works but it's 350 lines. 
Refactor: extract move validation into a hook, 
progress tracking into a component, AI communication 
into the store. Don't change functionality — only structure.
```

---

## Part 6: Anti-Patterns to Avoid

| Anti-Pattern | Why It Fails | What to Do Instead |
|---|---|---|
| Giant one-shot prompt ("build the whole app") | Context overflows, code is incomplete and buggy | One feature per session |
| Vague prompts ("make it better") | Claude guesses, usually wrong | Be specific about what "better" means |
| Not committing between sessions | Lose safety net, Claude overwrites | Always commit + new branch |
| Ignoring CLAUDE.md violations | Inconsistent architecture | Stop Claude immediately, redirect |
| Letting context fill silently | Quality degrades without warning | Watch context %, compact at 60-70% |
| Stuffing CLAUDE.md with temporary notes | Instruction-following drops | Use docs/*.md for temporary plans |

---

## Part 7: Useful Commands

| Command | Purpose |
|---|---|
| `/init` | First-time project setup |
| `/clear` | Wipe context — use between features |
| `/compact` | Compress context mid-task |
| `/compact Preserve all chess component changes` | Compact with specific preservation |
| `/memory add "Board component is done"` | Persistent note across sessions |
| `/rewind` | Undo to a checkpoint when Claude goes off-track |
| `Shift+Tab` (×2) | Plan Mode — analyze without writing code |
| `Esc` | Stop Claude mid-action |

---

## Part 8: Custom Slash Commands to Create

Save these in `.claude/commands/` for shortcuts:

**.claude/commands/test-chess.md** — Run all chess tests, show failures

**.claude/commands/review-component.md** — Review a component for types, accessibility, responsiveness

**.claude/commands/add-opening.md** — Research and add a new opening to the database

---

## Part 9: Cost & Time Estimates

| Phase | Sessions | Time | API Cost |
|---|---|---|---|
| Core Engine | 3 | ~4 hrs | ~$3-5 |
| AI Coaching | 3 | ~4 hrs | ~$4-6 |
| Opening Trainer | 3 | ~5 hrs | ~$4-6 |
| Additional Modules | 5 | ~8 hrs | ~$6-10 |
| Polish & Deploy | 3 | ~4 hrs | ~$3-5 |
| **Total** | **17** | **~25 hrs** | **~$20-32** |

---

## Part 10: Pre-Session Checklist

**Before each session:**
- [ ] Previous work committed to git
- [ ] New branch created for this feature
- [ ] Clear goal: what does "done" look like?
- [ ] Plan exists (for complex features)

**During each session:**
- [ ] Watch context usage
- [ ] Ask Claude to test after building
- [ ] Stop and redirect if Claude goes off-track

**After each session:**
- [ ] Run the app — does it work?
- [ ] Commit with descriptive message
- [ ] `/clear` before next feature
