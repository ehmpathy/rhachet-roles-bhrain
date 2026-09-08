# domain.term: focus

term.chosen   = focus
term.kind     = noun
term.boundary = review
term.synonyms.forbidden:
- mode
- strategy
- delivery
- ingestion

## .what

**how a review's target files reach the brain** — inlined into the prompt, or named as paths the
brain fetches on demand.

two positions, and the set is closed:

| focus | the prompt carries | the brain must |
|---|---|---|
| `push` | every target's **full content** | naught — it is all already there |
| `pull` | every target's **path** | **read** each file it chooses to open |

⇒ `push` is the default (`review.ts:166`).

## 🔴 .pull requires a REPL brain — a capability bound, never a credential one

`pull` hands the brain a list of paths, so the brain must be able to **use a tool** to open them.
`stepReview.ts:254` refuses a `BrainAtom` for exactly that reason:

```
✋ focus 'pull' requires a brain with tool use (BrainRepl).
   brain 'fireworks/deepseek/v4-flash' is a BrainAtom without tool use.
```

**that message names a brain CLASS and says naught about a key.** `rhx review --help` lists 19
brains, four of them repl (`↻`) — and one of those drives the local claude-code session with no
key and no vendor account at all.

⚠️ **this line exists because the refusal was read as a credential gate**, and that misread was
escalated to a human before it was caught. see `.reason`.

## .why the two positions are not interchangeable

the choice decides whether the review **fits**:

| targets | push | pull |
|---|---|---|
| 172 files (measured 2026-09-07) | **100.2–101.3%** of context — overflows, the lane grades naught | **5.3–8.5%** — fits with room |

⇒ `push` is exhaustive and bounded by the window; `pull` is unbounded and bounded by the brain's
own choice of what to open.

## ⚠️ .focus is orthogonal to scope

`scope` says **which** files a review reads (`rule`, `ref`, `target`); `focus` says **how** the
target set reaches the brain. neither constrains the other, and a change to one never implies a
change to the other.

## .refs

- `src/contract/cli/review.ts:57` — the flag doc
- `src/contract/cli/review.ts:111` — the declared field, `focus: 'push' | 'pull'`
- `src/contract/cli/review.ts:166` — the default, `'push'`
- `src/contract/cli/review.ts:278` — the pass-through into `stepReview`
- `src/domain.operations/review/stepReview.ts:254` — the repl-brain requirement

## .reason

- `term=review.focus._.choice.reason.md`
