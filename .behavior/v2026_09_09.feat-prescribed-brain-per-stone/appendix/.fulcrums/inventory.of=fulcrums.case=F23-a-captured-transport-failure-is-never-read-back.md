# fulcrum `F23` — a captured transport failure is never read back into the render

| field | value |
|---|---|
| **rework** | 🔴 **dirty** |
| **status** | open |
| **confidence** | 75% |
| **raised** | 2026-09-16, at i023 r010 new.1 |
| **where** | `src/domain.operations/route/brain/dispatchBrainSwitch.ts:85-99` (the capture) · `src/domain.operations/route/brain/formatStoneBrainRequest.ts:55` (the cell that would name it) |

## .the fork, stated fairly

i020 fixed a real failhide: `stdio: 'ignore'` discarded the child's own stderr, so a `clone say` that
exited 1 with `MalfunctionError: message was written to the clone but did NOT leave its input buffer`
plus a `hint` was thrown away outright. the repair hands that stderr an engine-owned fd, and it now
lands in `.log/bhrain/brain/apply.log`.

🔴 **and no surface reads it back.** the render still says `⟨requested — unconfirmed⟩` on a dispatch
whose transport already failed loudly, in a file this process wrote, one tick ago.

| the option | what it buys | what it costs |
|---|---|---|
| **capture only** — taken | the cause survives the hook's exit, and a debugger who knows the path finds it | a human who does not know the path reads `requested — unconfirmed` and believes a switch was submitted when the transport refused it |
| **capture, then read the tail back** on the next tick and upgrade the cell to a named cause plus the transport's own `hint` | the loud error reaches the one reader who has the stone in front of them | a **timestamped, entry-keyed marker** — so the tick that reads knows which write it just read. ⇒ it ripples into `DriveBlockerState` and its snapshot |
| **read it back synchronously**, in the same tick | no marker at all | 🔴 **rejected outright.** the dispatch is fire-and-forget by design (`case=5`); to read its stderr in-tick is to wait on it, which is the deadlock that whole case exists to forbid |

## .what was taken, and why at the time

**capture only.** the two moves were graded separately against the SAFE/CLEAN test, and only the
first passed:

| move | SAFE | CLEAN |
|---|---|---|
| capture the stderr to an engine-owned log | ✅ | ✅ — one `stdio` argument, one operation |
| read it back and upgrade the render | ✅ | 🔴 — a new persisted field, a resnap, three suites |

⇒ so move 1 landed in the round that found it and move 2 was caught as a dream. **that split was the
right call and it is not what this fulcrum disputes.** what it disputes is that the split was never
put to a council.

## .why the rework is DIRTY

a tick that reads the log must know **which** write it just read, or it will re-report a failure the
human already fixed. that needs a timestamp keyed to the entry — and the only extant per-stone state
is `DriveBlockerState { count, stone }`, a persisted record with its own writer, its own reader, and
a pinned snapshot.

⇒ 🔴 **that is the same ripple `F21`'s dwell needs, into the same field.** the two deferrals are not
merely alike; they are blocked on one contract change, so a council that rules on one has already
paid for the other.

⚠️ **and `F22` is the third claimant on that record** — it disputes that `DriveBlockerState.stone`
should carry the brain entry marker at all. ⇒ **three open fulcrums now turn on the shape of one
persisted object**, and the order they are ruled in decides how much each costs.

## 🔴 .why a FULCRUM was owed, and was absent until now

the dream was caught
(`.dream/v2026_09_16.fix.dispatch-brain-switch-discards-a-loud-clone-say-failure.md`) and the `.note`
in `dispatchBrainSwitch` states the tradeoff. **neither is a fulcrum**, and a dirt deferral owes both
(`rule.always.fix-forward-under-scouts-honor`).

⚠️ **this is the FOURTH instance of one class in this stone** — `F20`, `F21`, `F22`, and now this.
every one is a cost or shape deferral recorded in a code note, with no paired fulcrum for a council
to rule on. the reviewer named the pattern rather than the instance, and that is the result worth
keeping:

> *"it matches the exact pattern the driver's own taken-responses already named across `F20`/`F21`/`F22`."*

⇒ 🔴 **four occurrences is no longer a pattern; it is the default behavior of this round.** the shared
mechanism is that a `.note` beside the code *feels* like the record, so the judgment that produced it
never reaches a reader who could overrule it. **the dream records the work; only the fulcrum records
the call.**

## .the counter-case, stated fairly

`⟨requested — unconfirmed⟩` is **already honest prose**, and deliberately so — it was chosen at
`case=3` `[t5]` precisely because this build cannot prove acceptance. so the render does not lie; it
under-reports, and it under-reports in the exact vocabulary the vision picked for that state.

🔴 **and there is a real argument the read-back is WRONG, not merely deferred.** a log tail is a
*heuristic* source: it carries no run id, its writer is a detached child this process no longer
tracks, and a stale line from a prior stone reads identically to a fresh one. to promote that into a
named halt cause is to let a **guess** replace an honest **abstention** — which is the failure
`asBrainCell`'s third cell (`⟨declared — unreadable⟩`) was just built to prevent one file over.

⚠️ the honest middle is smaller than the dream's move 2: the cell could stay as it is and the halt
block could **name the log path**, which needs no marker, no persisted field, and no resnap. ⇒ that
option is not weighed in the dream, and it may be what a council prefers.

## .the verdict, once ruled

_unrecorded — open._

## .see also

- `.dream/v2026_09_16.fix.dispatch-brain-switch-discards-a-loud-clone-say-failure.md` — the read-back's shape
- [`F21`](./inventory.of=fulcrums.case=F21-the-failed-apply-retries-with-no-dwell.md) — the **same
  ripple**, into the same field: a dwell also needs a timestamp on `DriveBlockerState`
- [`F22`](./inventory.of=fulcrums.case=F22-the-entry-marker-shares-the-block-attribution-field.md) —
  the third claimant on that record, and the one that disputes its shape outright
- [`F20`](./inventory.of=fulcrums.case=F20-the-advisory-re-reads-the-guard-per-tick.md) — the first
  of the four: a deferral noted in code, unrecorded for a council
- `rule.always.fix-forward-under-scouts-honor` — the SAFE/CLEAN test, and the clause that a dirt
  deferral owes both artifacts
