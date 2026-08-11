# NFCunt — an NFC treasure hunt

A frontend-only web app for a physical treasure hunt. Each hidden **NFC tag**,
when tapped, opens a URL in the phone's browser. The app shows a **Wordle-style
puzzle** (a sci-fi "access panel"); solving it decodes a **clue** to the next
tag. The final tag plays a **completion celebration**.

No backend, no app install, no special NFC permissions — tapping a tag just
opens a normal web link, so it works on **any phone** (iOS or Android).

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173/
npm test           # Wordle scoring + loader + render smoke tests
npm run build      # type-check + production build into dist/
npm run lint
```

Try it locally by visiting a tag route, e.g.
`http://localhost:5173/#/t/start`.

---

## How it works

- **No Web NFC API.** The Web NFC API only works on Android Chrome and never on
  iOS Safari or desktop. Instead, each physical tag is pre-written with a URL
  like `https://hunt.onlyfork.at/#/t/<slug>`. Tapping the tag just opens
  that link.
- **Hash routing.** Routes live in the URL hash (`#/t/<slug>`), so any static
  host serves it with zero config.
- **Completion.** One tag is flagged `isFinal` in `src/data/tags.ts`; tapping it
  shows the celebration and skips the puzzle. There is **no** progress tracking
  or order enforcement — the hunt is "done" simply by finding the final tag.

---

## Editing the hunt content

You only need to touch two kinds of files.

### 1. Tags — `src/data/tags.ts`

The single source of truth for every stop. `slug` is an arbitrary, URL-safe
string **you** choose (not the tag's hardware serial):

```ts
export const tags: TagEntry[] = [
  { slug: 'start' },
  { slug: 'library' },
  { slug: 'garden' },
  { slug: 'vault', isFinal: true, completionMessage: 'ACCESS GRANTED, Agent.' },
]
```

- Exactly **one** tag should have `isFinal: true`.
- `completionMessage` is the customizable text on the final screen.

### 2. Riddles — `src/data/riddles/*.md`

One markdown file per non-final tag. Filenames can be anything; the link is the
`tagId` frontmatter field:

```md
---
tagId: start                 # must match a slug in tags.ts
title: Transmission 01       # optional
answer: RELAY                # the Wordle word — LETTERS A–Z ONLY
hint: A station that passes a signal along   # optional
---
The clue body, revealed after the puzzle is solved.
Point the player toward the next physical tag here.
```

**Answer rules:** single word, letters `A–Z` only (no spaces, digits, hyphens,
or accents) — the puzzle input is A–Z letter wheels. Case doesn't matter. These
rules are validated on load; a bad answer throws a clear error in `npm run dev`.

Every non-final tag **must** have a matching riddle file, and vice versa — the
loader enforces this.

---

## Writing the physical NFC tags

Do this once per tag with a phone NFC-writing app (e.g. **NFC Tools**):

1. Decide your final production URL first (see the ⚠️ warning below).
2. In the NFC app, choose "Write" → "Add a record" → "URL".
3. Enter the tag's URL: `https://hunt.onlyfork.at/#/t/<slug>`, using the
   `slug` from `tags.ts` (e.g. `.../#/t/library`).
4. Hold the tag to the phone to write it. Repeat for each tag.

### Tag URL reference

Every tag's URL is `https://hunt.onlyfork.at/#/t/<slug>`. These slugs are the
single source of truth in [`src/data/tags.ts`](src/data/tags.ts) — keep this
table in sync if you add, rename, or remove tags.

| Order | Slug | Riddle / role | Answer | Production URL to burn |
| ----- | ---- | ------------- | ------ | ---------------------- |
| 1 | `start` | Treat One | `RELAY` | `https://hunt.onlyfork.at/#/t/start` |
| 2 | `library` | Treat Two | `PAGE` | `https://hunt.onlyfork.at/#/t/library` |
| 3 | `garden` | Treat Three | `IN BLOOM` | `https://hunt.onlyfork.at/#/t/garden` |
| 🎉 | `vault` | Final — celebration (no puzzle) | — | `https://hunt.onlyfork.at/#/t/vault` |

For local testing before you burn tags, swap the base for the dev server, e.g.
`http://localhost:5173/#/t/start` (the dev server may pick another port
such as `5174` if `5173` is busy — check the terminal output).

> **Tip:** The hunt order is defined by the *clues*, not the tags themselves —
> each riddle's text points the player to the next physical tag. `start` is the
> intended entry point; `vault` is the final celebration. Place the physical
> tags accordingly.

> ### ⚠️ Finalize your URL before writing tags
> The full URL is physically burned into each tag. If you later rename the repo,
> change the custom domain, or move hosts, **every tag must be re-written.**
> The production domain is finalized as `hunt.onlyfork.at`, served at the
> domain root (`base: '/'` in `vite.config.ts`).

> ### 🔓 Frontend-only means no secrecy
> All answers, all clues, and the `final` slug ship in the JavaScript bundle. A
> determined participant could read answers via browser devtools or jump
> straight to the final tag's URL. This is fine for a fun hunt — just don't rely
> on it for anything that must stay secret.

---

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` builds and deploys `dist/` on every push to
`main`. To enable it: in the repo, go to **Settings → Pages → Build and
deployment → Source: GitHub Actions**, then set **Settings → Pages → Custom
domain** to `hunt.onlyfork.at` (requires a DNS `CNAME` record for `hunt`
pointing at `rj722.github.io`) and enable **Enforce HTTPS** once the
certificate is issued. The site publishes at `https://hunt.onlyfork.at/`.

Note: `actions/deploy-pages` ignores any `CNAME` file committed to the repo —
the custom domain must be set via the Settings UI (or `gh api`), not the
workflow.

---

## Design / implementation split

The project is built so the **animation design** can be iterated on completely
independently of the **app logic** — potentially by a separate (design-focused)
agent or contributor.

- **`src/animation-kit/`** is the design workstream's domain: the three
  animation components (`WordleGuessGame`, `TagRiddleAnimation`,
  `CompletionAnimation`), the `LetterWheel`, theme, and a live `playground/`.
- **`src/animation-kit/contract.ts`** is the *only* shared boundary. It defines
  the prop types both sides agree on. The app imports the components by these
  types; the design side may rewrite the internals freely as long as the
  contract holds. **Changing `contract.ts` requires coordinating both sides.**
- Everything **outside** `animation-kit/` (routing, data, screens, `lib/`) is
  the functional workstream and never needs design knowledge.
- **Playground:** run `npm run dev` and open `#/playground` (dev-only; it is
  code-split and never shipped to production). It renders each animation with
  mock data and a replay button, so the design can be tuned without the real
  routing/data pipeline.

Current look: neon/cyberpunk sci-fi (vault-panel letter wheels, terminal-decode
clue reveal, warp-burst completion). All three animations honor
`prefers-reduced-motion`.

---

## Project structure

```
src/
├── App.tsx                  # hash router → screen
├── data/
│   ├── tags.ts              # tag registry (edit here)
│   └── riddles/*.md         # riddle copy (edit here)
├── lib/
│   ├── loadRiddles.ts       # loads + validates riddle markdown
│   ├── router.ts            # hash → route
│   └── wordle.ts            # pure Wordle scoring (tested)
├── screens/                 # Riddle / Completion / NotFound
└── animation-kit/           # DESIGN BOUNDARY — see contract.ts
    ├── contract.ts
    ├── WordleGuessGame.tsx
    ├── LetterWheel.tsx
    ├── TagRiddleAnimation.tsx
    ├── CompletionAnimation.tsx
    └── playground/          # dev-only (#/playground)
```

Made with 🖤 by RJ722
