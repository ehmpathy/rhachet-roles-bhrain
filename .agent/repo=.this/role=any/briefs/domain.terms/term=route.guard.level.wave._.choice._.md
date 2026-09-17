# domain.term: route.guard.level.wave

term.chosen   = wave
term.kind     = noun
term.boundary = route.guard.level   # the level whose ordered release it buffers
term.synonyms.forbidden:
- batch
- queue
- buffer
- cohort

## .what

a **level wave** is a **level's ordered-release buffer** — it holds each settled reviewer block
until every earlier-declared slot in that level has landed, then releases the run in declared order.

it owns the level's live counters and the block map; it performs no i/o. its status is
`{ inflight, done, left, beganMs }`, where `left = inflight + queued`, so `done + left = members`
holds at every tick.

```ts
const wave = genReviewWaveBuffer();
// ReviewWaveBuffer = { begin, launch, settle, drain, status }
```

## ⚠️ .wave is the STATE; pour is the ACT — they are two terms, never one

the **pour** (`route.guard.level.pour`) is the one-shot act that releases the level. the wave is the
live state that then tracks each lane and orders how the blocks come down. a pour opens the level;
the wave decides which settled block may be shown yet.

⇒ **this answers the i015 reviewer's open question directly:** `pour` and `wave` are distinct, not
one concept from two angles. the pour is a verb performed once; the wave is a noun that persists
across the level's whole run and holds the ordering invariant.

## 🟡 .why not `batch`, `queue`, or `buffer`

| candidate | verdict |
|---|---|
| `batch` | **wrong shape** — a batch settles all-or-nothing; a wave releases each block the moment its predecessors have landed, member by member |
| `queue` | 🔴 **the metaphor the vision forbids** — a queue implies order and fairness among members *matter*; within a level they do not. the wave orders only the **render**, never the run |
| `buffer` | **the genus** — the wave IS a buffer, so `buffer` names the category, not this one. `wave` is the differentia: a buffer that releases in declared order |
| `cohort` | **wrong axis** — a cohort shares a start time; a wave's members start at different moments and settle out of order |

## .refs

where the term composes declared operations:

- src/domain.operations/route/guard/review/genReviewWaveBuffer.ts   # the buffer + `ReviewWaveStatus` types
- src/domain.operations/route/guard/genContextCliEmit.ts            # the emit path drives one wave per level

## .reason

see the ref-level cluster beside this choice:

- `term=route.guard.level.wave._.choice.reason.md` — why `wave` over `batch` and `queue`, and why the
  ordered-release shape is what earns it a word of its own
