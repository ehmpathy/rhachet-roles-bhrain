# seed S11 — the GUARD owns the warmer

archived verbatim, before distillation (`rule.always.archive-the-wishers-words-verbatim`).

## .the utterances

> so does the poke automatically run if there is budget for an rhx reviewer now? from the guard ?

> i.e., guards should warm their review cahces

> it should be part of the guards specifically

> cause its the route guards that neeed efficient review

## .what it did

**settled who owns the timer.** the keep-alive dream listed three CLEAN objections — a new brain
surface, a scheduler that outlives one `rhx review`, and *"a decision about who owns the timer"*.
the third is now ruled: **the guard.**

🔴 **and the last utterance gives the REASON, which is worth more than the placement.** the guard
is not merely a convenient host for a timer. it is **the subject of the whole cost problem**: a
route guard is what re-reads one corpus across eleven lanes, round after round, with 20–120m of
driver time between rounds. every figure in the review-cost work was measured on guard rounds.

⇒ so the warmer belongs to the guard for the same reason the meter does — **the guard is what
needs efficient review.** a warmer placed anywhere else would warm a cache the guard is not the
one to spend.

## .why the guard is the right owner, mechanically

it is the only place that already holds `route.guard.budget`, which is the gate that keeps a
warmer from ever being speculative:

| the lane's budget | the warmer |
|---|---|
| **rounds left** | a driver will re-drive this lane ⇒ its prefix WILL be hit ⇒ warm it |
| **exhausted** | the lane is done ⇒ its prefix will never be hit again ⇒ skip it |

and `runStoneGuardReviews` already pours lanes per level — that is the loop a per-reviewer warmer
rides, so the fan-out needs no new traversal.

## 🔴 .the hard problem the ruling exposes

**the guard process EXITS when the round ends.** the gap being warmed is 20–120m of *driver*
time, so a warmer that lives inside the guard dies long before the prefix it protects is wanted.

⇒ the guard cannot simply BE the warmer. it must **spawn something that outlives itself**:

| approach | verdict |
|---|---|
| **detached child** — fork a warmer at round end, poke 3× / 15m, exit | ✅ matches the ruling. self-contained, no new infra. risk: an orphan that spends where a driver abandons the route |
| **external schedule** — write a cron / systemd entry | survives cleanly, but needs a host-level install, so it is not portable |
| **warm on next entry** | 🔴 useless — the real call follows at once, so there is no gap to bridge |

🟡 **the orphan risk is now a NUMBER rather than a worry**: 3 pokes × 11 lanes × ~$0.0013 ≈
**$0.043** worst case per abandoned route. that is the whole exposure of a scheduler defect, and
it is small enough to be an acceptable failure mode.

## .how it composes with what is already dispatched

`ehmpathy/rhachet#550` bar **B8** says *"no scheduler in scope — the timer, the budget gate, and
the retry policy belong to the caller."* this seed names the caller.

⇒ **the two pieces are complementary, and they share no seam**: `#550` ships the one-act surface
in rhachet core; this repo's guard owns the cadence, the budget gate, and the per-lane fan-out.

> ~~the guard work is BLOCKED on `#550` — a warmer with no `brain.cache({ prefix })` has no
> surface to call.~~

🔴 **retracted 2026-09-24 by [S12](inventory.of=seeds.case=S12-no-new-brain-surface-is-owed-brain-ask-serves.md).**
a poke is an ordinary completion that HITS, so `brain.choice.ask` already returns every figure a
poke needs. `#550` stays a real **ergonomic** want and is a blocker for aught.

🟡 the line is struck rather than deleted, because **why it read as a hard gate is the lesson**:
the objection named a package this repo does not own, and a dependency inside an objection makes a
deferral feel principled.

## .landed in

- `.dream/v2026_09_24.feat.a-prefix-keep-alive-could-halve-the-bill-if-eviction-is-lru.md`
- `ehmpathy/rhachet#550` — the surface this rides on
