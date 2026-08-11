# NFCunt — NFC Treasure Hunt (Frontend-Only)

## Problem
A frontend-only web app where physical NFC tags, hidden around a location, each
trigger a browser visit to a specific in-app "riddle" screen with a delightful
animation. The final tag triggers a celebratory completion animation. Riddle
copy must be trivially editable, tag IDs must live in one static file, and the
*animation design* must be iterable independently (potentially by a separate
design-focused AI agent) from the *app/data logic* (a separate functional-code
AI agent), while staying in one repo with a clean handoff boundary.

## Key Architecture Decisions
- **NFC mechanism**: No Web NFC API (unsupported on iOS Safari and all desktop
  browsers). Each physical tag is pre-written (via a phone NFC-writing app,
  e.g. NFC Tools) with a URL containing an arbitrary slug we choose —
  `https://hunt.onlyfork.at/#/t/<slug>`. Tapping just opens the browser
  — works on every phone.
- **Routing**: Hash-based (`#/t/<slug>`) — zero server config, works on any
  static host including GitHub Pages.
- **Stack**: React + Vite + TypeScript. No backend, no SSR.
- **Animation engine**: Motion (motion.dev) for spring/gesture/layout-quality
  animation, driven from JSX/props (not an exported asset format like Lottie).
- **Design/implementation separation (single repo)**: A dedicated
  `src/animation-kit/` folder is the sole domain of the "design" workstream.
  A small `contract.ts` file defines the fixed TypeScript prop interfaces
  (`TagRiddleAnimationProps`, `CompletionAnimationProps`) that both workstreams
  agree on up front. The design agent iterates inside a dev-only Playground
  route with mock data and never touches routing/data-loading code. The
  functional agent owns everything outside `animation-kit/` and only imports
  the two components by their contract types. Suggested workflow: two git
  branches (e.g. `animations`, `app-logic`) merged via PR — since folder
  ownership doesn't overlap, conflicts should be rare; changes to
  `contract.ts` require coordination between both agents.
- **Animation owns its riddle content**: Once unlocked (see Wordle gate below),
  the clue-reveal animation component receives the clue text as a prop and
  fully controls how/when it's revealed (fade, typewriter, particles, etc.) —
  the animation *is* the clue screen, not a transient splash before a separate
  static screen.
- **Wordle-style guessing gate (new)**: Tapping a (non-final) tag first shows a
  Wordle-like puzzle before the clue to the next tag is revealed:
  - Each riddle defines its own fixed `answer` word (no dictionary/word-list
    needed or wanted — just a simple letter-comparison algorithm, so this adds
    little complexity).
  - **Input method**: one scroll-wheel reel per letter position (A–Z, drag/swipe
    to snap to a letter, built with Motion), sized to the answer's length —
    no on-screen keyboard, no native text input.
  - Max **6 attempts**; each submitted guess is scored letter-by-letter
    (correct / present / absent, classic Wordle rules) via a small pure
    function. If all 6 attempts are used without success, the answer is
    auto-revealed so nobody gets stuck at a tag. The design distinguishes a
    correct solve (triumphant flourish) from a reveal-after-exhaustion
    (consolation) via the `onResolved(solved: boolean)` callback.
  - On success (or reveal-after-exhaustion), the screen transitions into the
    clue-reveal animation showing the riddle body text (guidance to the next
    physical tag).
  - **Answer constraints**: each `answer` must be a single word, letters A–Z
    only (no spaces, hyphens, digits, or accents) since input is A–Z letter
    wheels. `evaluateGuess` normalizes case (compares uppercased). Answers are
    validated at load time; a malformed answer surfaces a clear dev-time error.
  - The **final** tag skips the Wordle gate entirely and goes straight to the
    completion animation (per the `isFinal` flag, unchanged from before).
- **Riddle copy**: One markdown file per riddle in `src/data/riddles/`, with
  frontmatter `tagId`, `answer` (Wordle target word), optional `hint` (theme/
  clue shown alongside the puzzle), and `title`. The markdown body is the
  clue text revealed after solving, guiding to the next physical tag.
  Filenames can be descriptive, not tied to the slug.
- **Tag registry**: Single static `src/data/tags.ts` file listing every tag
  slug; one entry flagged `isFinal: true` — tapping that physical tag directly
  shows the completion animation.
- **No progress persistence**: No localStorage/order enforcement. Completion
  is purely "the physical final tag was tapped." Re-tapping any tag just
  re-shows its riddle.
- **Unknown/missing tag slug**: Friendly fallback "not recognized" screen,
  no crash. Bare URL (no slug) uses the same fallback with a "tap a tag to
  begin" variant message.
- **Hosting**: GitHub Pages via GitHub Actions (build + deploy on push).

## Repo Structure
```
nfcunt/
├── src/
│   ├── main.tsx
│   ├── App.tsx                     # hash router: #/t/:slug -> screen
│   ├── data/
│   │   ├── tags.ts                 # single source of truth: all tag slugs + isFinal flag
│   │   └── riddles/
│   │       ├── cave-entrance.md    # frontmatter: tagId, title?
│   │       └── ...
│   ├── lib/
│   │   ├── loadRiddles.ts          # import.meta.glob('*.md', {query:'?raw'}) + js-yaml frontmatter parse + validation
│   │   ├── router.ts               # parses location.hash -> slug (and #/playground in dev)
│   │   └── wordle.ts               # pure evaluateGuess(guess, answer) -> LetterStatus[] (case-normalized)
│   ├── screens/
│   │   ├── RiddleScreen.tsx        # looks up riddle; renders WordleGuessGame, then
│   │   │                          # TagRiddleAnimation once solved/revealed
│   │   ├── CompletionScreen.tsx    # renders <CompletionAnimation/>
│   │   └── NotFoundScreen.tsx      # fallback for unknown/missing slug
│   └── animation-kit/              # <-- DESIGN BOUNDARY (owned by design workstream)
│       ├── contract.ts             # shared TS prop types — the ONLY file both sides must agree on
│       ├── WordleGuessGame.tsx     # composes LetterWheels, attempt counter, tile feedback,
│       │                          # shake-on-wrong, success flourish; uses injected evaluateGuess
│       ├── LetterWheel.tsx         # single A–Z drag/snap reel (Motion)
│       ├── TagRiddleAnimation.tsx  # clue-reveal animation (shown after solving)
│       ├── CompletionAnimation.tsx
│       └── playground/
│           ├── Playground.tsx      # dev-only preview harness, mock data, replay controls
│           └── mockData.ts
├── src/wordle.test.ts              # Vitest unit tests for evaluateGuess (duplicate-letter cases)
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .github/workflows/deploy.yml    # build + deploy to GitHub Pages
```

## Data Schemas
`src/data/tags.ts`:
```ts
export interface TagEntry {
  slug: string;              // matches the URL written to the physical tag
  isFinal?: boolean;         // true for the one tag that triggers completion
  completionMessage?: string; // customizable message shown on the final tag (only used when isFinal)
}
export const tags: TagEntry[] = [
  { slug: "cave-entrance" },
  { slug: "old-oak" },
  { slug: "final", isFinal: true, completionMessage: "Mission complete, Agent." },
];
```

Riddle markdown (`src/data/riddles/cave-entrance.md`):
```md
---
tagId: cave-entrance
title: The Cave Entrance          # optional
answer: OWLET                     # Wordle target word (keep short per-riddle)
hint: A bird that flies at night, immature   # optional theme shown with the puzzle
---
Once you solve this, look for the next tag near the old stone bridge.
```
(The body is the clue revealed only after the Wordle puzzle is solved or the
answer is auto-revealed after 6 failed attempts.)

`src/lib/wordle.ts`:
```ts
export type LetterStatus = "correct" | "present" | "absent";
export function evaluateGuess(guess: string, answer: string): LetterStatus[] {
  // standard two-pass Wordle scoring; uppercases both inputs first;
  // handles duplicate letters correctly. Covered by src/wordle.test.ts (Vitest).
}
```

`src/animation-kit/contract.ts`:
```ts
export type LetterStatus = "correct" | "present" | "absent";

export interface WordleGuessGameProps {
  answerLength: number;                          // number of letter-wheels to render
  answer: string;                                 // the target word (A–Z, uppercase); enables reveal-on-exhaustion
  hint?: string;                                  // optional theme/hint text
  maxAttempts: number;                            // 6
  evaluateGuess: (guess: string) => LetterStatus[]; // injected pure function from lib/wordle.ts
  onResolved: (solved: boolean) => void;          // solved=true when guessed correctly; false when revealed after exhausting attempts
}

export interface TagRiddleAnimationProps {
  riddleTitle?: string;
  riddleText: string; // the clue guiding to the next tag, shown after the Wordle gate
}

export interface CompletionAnimationProps {
  message: string; // customizable congratulatory message, sourced from tags.ts completionMessage
}
```

## Notes
- Physical tag writing is a manual, one-time step per tag using a phone NFC
  app — not part of the codebase, but documented in the README.
- **Frontmatter parsing**: markdown is imported as raw strings via
  `import.meta.glob('./riddles/*.md', { query: '?raw', import: 'default' })`
  and parsed with `js-yaml` (browser-safe) — deliberately avoiding
  `gray-matter`, which depends on Node's `Buffer` and tends to break in a Vite
  browser build. `loadRiddles.ts` also validates each riddle (required
  `tagId`/`answer`, answer is A–Z only, every non-final tag in `tags.ts` has a
  matching riddle) and throws a clear error in dev if violated.
- **Testing**: Vitest is included for `src/lib/wordle.ts`. `evaluateGuess` is
  the one piece of non-trivial logic (duplicate-letter green/yellow/gray
  handling), so `src/wordle.test.ts` covers those edge cases. No other tests
  are planned unless needed.
- Placeholder animation components (satisfying the contract) get built early
  so the app is functional end-to-end before final designs land, including a
  basic placeholder `LetterWheel`/`WordleGuessGame` (plain, no polish yet).
- **Playground reachability**: exposed as a dev-only hash route
  `#/playground`, guarded by `import.meta.env.DEV` in the router so it is
  unreachable in (and tree-shaken from) the production build. It includes mock
  riddles with short Wordle answers so the wheel/guess flow can be iterated on
  visually without the real routing/data pipeline.
- Boundary for the Wordle feature specifically: `src/lib/wordle.ts`
  (`evaluateGuess`, scoring logic) is functional-workstream code — pure,
  deterministic, easily testable. `LetterWheel.tsx` and `WordleGuessGame.tsx`
  (drag/snap interaction, tile-flip/shake/success animations) are
  design-workstream code inside `animation-kit/`, consuming `evaluateGuess`
  only through the `contract.ts` prop shape.

## Risks & Accepted Trade-offs
- **Frontend-only means no secrecy (accepted).** Every answer word, every clue,
  and the `final` slug ship in the JS bundle. A determined participant could
  read answers via devtools or navigate directly to `#/t/final` to trigger
  completion without doing the hunt. This is obfuscation, not security — an
  accepted trade-off for a casual, fun treasure hunt with no backend.
- **Tag-URL permanence (operational).** The full URL (origin + base path +
  hash) is physically written into each NFC tag. Renaming the repo, changing
  the custom domain, or changing hosts later invalidates every tag and
  requires re-writing them. **Finalized: `hunt.onlyfork.at`**, served at the
  domain root (`base: '/'` in `vite.config.ts`), backed by repo `rj722/hunt`
  on GitHub Pages.

## Creative Direction / Design Brief
This section is a starting brief for whoever works in the design workstream
(`animation-kit/`), including a separate design-focused AI agent. It captures
mood/tone only — the actual implementation of these ideas happens inside
`animation-kit/` via the Playground, independent of the functional plan above.

- **Overall theme**: Sci-fi.
- **Visual flavor**: Neon/cyberpunk — dark background, glowing neon cyan/
  magenta/purple accents, holographic-feeling UI, glitch effects.
- **Wordle letter-wheel puzzle (`WordleGuessGame` / `LetterWheel`)**: Feels
  like a spaceship/vault access panel. Each letter reel glows neon; snapping
  to a letter gives a satisfying click/flash. An incorrect submitted guess
  triggers a glitch/static flicker across that guess row.
- **Clue-reveal animation (`TagRiddleAnimation`)**: Terminal decode/typewriter
  effect — the clue text glitches through random characters before resolving
  into readable neon text, like a hacked transmission being decoded.
- **Completion animation (`CompletionAnimation`)**: Warp-speed/portal burst —
  the screen streaks into hyperspace lines, then resolves into a bold neon
  completion message with particle bursts. The message itself is
  **customizable** (not hardcoded), sourced from data (see contract update
  below). Include a small, low-emphasis subtitle/credit line reading
  `Made with 🖤 by RJ722` — this is a fixed attribution, not editable per-hunt
  data, so it can be hardcoded directly into the component.
- **Accessibility (reduced motion)**: honor `prefers-reduced-motion`. The
  glitch/warp/typewriter effects should degrade to simple fades or instant
  reveals when reduced-motion is enabled, so the app stays usable and
  comfortable. Applies to all three animation components.

## Follow-up Changes (post-initial-build)

These enhancements were added after the first working build, in response to
user feedback. They are reflected in the code and preserve the design/logic
boundary described above.

- **Per-riddle artifact images**: A riddle may declare an `artifact:` frontmatter
  field naming an image file in `src/data/artifacts/` (SVG or PNG). At load time
  `loadRiddles.ts` resolves it to a URL via
  `import.meta.glob('../data/artifacts/*.{svg,png}', { query:'?url', eager:true })`
  and exposes it on `Riddle.artifactSrc`. The contract gained optional
  `artifactSrc?`/`artifactAlt?` on `WordleGuessGameProps`; `WordleGuessGame`
  renders it as a gently floating (motion) image above the access panel, honoring
  reduced-motion. Placeholder cute SVG characters ship in `src/data/artifacts/`
  (`relay-bot.svg`, `page-sprite.svg`, `bloom-flower.svg`, `default.svg`) and are
  meant to be replaced by real designed/animated artwork later — the filename in
  frontmatter is the only thing that must stay stable.
- **Circular letter wheels (wrap-around)**: `LetterWheel.tsx` now wraps — spinning
  up past 'A' lands on 'Z' and down past 'Z' lands on 'A'. Implemented with a
  triple-strip approach: the alphabet is rendered three times (78 items) and the
  selection lives in the middle copy; after every drag/step the reel is invisibly
  re-centered into the middle copy (same letter) so there is always a full
  alphabet of headroom in both directions. Works for both drag/swipe and the
  ▲/▼ buttons. The viewport is 3 items tall for better wrap affordance.
- **Spaces in answers**: An `answer` may contain single spaces between words
  (e.g. `IN BLOOM`). The load-time validation regex is `^[A-Z]+( [A-Z]+)*$`
  (whitespace collapsed to single spaces, uppercased). Space positions are
  **fixed** — `WordleGuessGame` renders a gap (not a wheel/tile) at each space
  position and the player never guesses them. The submitted guess string is
  reconstructed with spaces at those positions, so `evaluateGuess` scores them
  as `correct` (both guess and answer share the space at the same index). The
  `garden` riddle now uses `IN BLOOM` to demonstrate this end-to-end.

### Files touched by the follow-up
- `src/animation-kit/contract.ts` — added `artifactSrc?`/`artifactAlt?`.
- `src/animation-kit/LetterWheel.tsx` — circular wrap rewrite.
- `src/animation-kit/WordleGuessGame.tsx` — artifact image + space-aware rendering.
- `src/lib/loadRiddles.ts` — space-allowing answer regex + artifact URL resolution.
- `src/screens/RiddleScreen.tsx` — passes `artifactSrc`/`artifactAlt` through.
- `src/data/riddles/*.md` — added `artifact:`; `garden` answer -> `IN BLOOM`.
- `src/data/artifacts/*.svg` — placeholder character art.
- `src/animation-kit/playground/mockData.ts` — artifact URL + spaced-answer demo.

## Storybook Redesign (theme overhaul)

The neon/cyberpunk skin was fully replaced with a **cozy whimsical storybook**
theme: *Kat the cat exploring a garden of hidden birthday treats*. The
functional/design contract (`animation-kit/contract.ts`) is unchanged, so this
was a pure reskin plus a few UX refinements.

### Look & feel
- **Palette** (`theme.ts`): warm cream/blush surfaces (no dark bg) with soft
  peach, sage, and lavender accents + warm-brown ink. Token names
  `bg/panel/panelEdge/text/textDim` kept stable; accent names are semantic
  (`peach/sage/lavender/gold/cream/blush/...`).
- **Fonts**: Baloo 2 (display) + Quicksand (body) via Google Fonts CDN
  (`index.html`); exposed as `fonts.display` / `fonts.body`.
- **Panel motif**: `ScallopedCard.tsx` — a cream scrapbook page with scalloped
  top/bottom edges (SVG `<pattern>` bumps under one unifying `drop-shadow`), a
  dashed "stitch" border, and a washi-tape accent. Wraps the puzzle.
- **Sprites**: cute animated SVG placeholders. Riddle characters live in
  `src/data/artifacts/` (`curious-kat`, `book-friend`, `happy-flower`);
  design-owned sprites live in `src/animation-kit/assets/` (`party-kat`,
  `home-kat`, `lost-kat`). Swap in final art against these filenames.

### Component changes
- **LetterWheel**: petal-shaped reel with a **paw-print badge** haloing the
  centered letter. Strong **center pop** (large/bold/glowing selected letter vs.
  dimmed, smaller neighbours) driven reactively by `useMotionValueEvent` so it
  pops during scroll too. **▲/▼ buttons removed** — drag/flick is the sole touch
  interaction. **Desktop**: mouse-wheel/trackpad steps one letter per notch via
  a non-passive `wheel` listener (`preventDefault` stops page scroll). Circular
  wrap + velocity momentum retained.
- **WordleGuessGame** ("Paw Print Puzzle"): wrapped in `ScallopedCard`. Header
  reduced to a single hero — shrunk character (78px), tiny tracked
  "PAW PRINT PUZZLE" caption, hint is the largest text. Footer merges the
  button (**"Sniff it out 🐾"**) with **attempt pips** (● dots) instead of a
  separate counter line. Tiles softened to sage/gold/tan.
- **TagRiddleAnimation**: clue reveal is now **petals blooming open** from a bud
  + ribbon accent, text blossoming in word-by-word.
- **CompletionAnimation**: **confetti burst + rain, rising balloons, sparkles,
  glow ring, and a party-hat Kat** popping in with "Kat found it! 🎉".
- **NotFoundScreen**: cozy home/unknown states with waving/puzzled Kat sprites.
- All copy rewritten to storybook tone (riddles, `tags.ts` completion message,
  button/labels/messages). Riddle answers unchanged (RELAY / PAGE / IN BLOOM).

### Accessibility
Every new animation honors `prefers-reduced-motion` (petals/confetti/balloons
degrade to static; text appears instantly).

### Verification
`oxlint` clean · `tsc -b && vite build` succeeds (Playground still code-split) ·
`vitest` 18/18 (App smoke-test copy assertions updated to the new strings).

---

## UX feedback round — Puzzle screen onboarding & feedback (2026-08-11)

Refinements to teach first-time players (each tag is a surprise; they have no
prior context) and to give clearer right/wrong feedback.

### Onboarding
- **Load demo spin**: on mount the first letter reel auto-scrolls to a random
  letter (`LetterWheel demo` prop; 7–17 letter roll, eased). It self-cancels the
  instant the player drags or wheels any reel. Skipped under
  `prefers-reduced-motion`/disabled. Teaches the spin gesture without copy.
- **Instructional caption**: "Paw Print Puzzle" → **"🐾 Spin the petals to spell
  the word"** so players know the task immediately.

### Feedback
- **Attempt pips relocated**: moved out of the footer to a row **below the hint,
  above the guess history**. Spent tries now fill **red** (`theme.rose`);
  remaining are hollow tan. `aria-label` retained.
- **De-emphasized submit button**: bold peach filled pill → quiet outline/ghost
  (transparent bg, tan border, `textDim`), copy changed to **"Check the word"**
  (was "Sniff it out 🐾") so it isn't pressed just for fun.
- **Wrong-answer negative feedback** (layered):
  - Wrong-letter tiles turn **red** (`tileBg` absent → `theme.rose`).
  - The just-submitted guess **row shakes**.
  - A red nudge appears: **"Not quite — give the petals another spin 🐾"**.
  - Spent attempt pips fill red (see above).
  - **Kat sprite reacts**: on a wrong guess she **droops + shakes her head**
    (`useAnimationControls`), then resumes her idle float. The idle float itself
    now runs through the same controls (mount fade-in → looping bob).

### Tokens
- Added `theme.rose` (`#e08877`) and `theme.roseSoft` (`#f6c9be`) for negative
  feedback.

### Verification
`oxlint` clean · `tsc -b && vite build` succeeds · `vitest` 18/18
(App caption assertion updated `/Paw Print Puzzle/i` → `/Spin the petals/i`).
All new motion honors `prefers-reduced-motion`.
