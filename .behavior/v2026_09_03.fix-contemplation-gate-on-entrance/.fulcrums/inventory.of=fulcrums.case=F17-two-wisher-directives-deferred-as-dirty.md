# fulcrum F17 — two wisher directives deferred as dirty

- **rework** = 🔴 **dirty as judged → re-measured 2026-09-07: safe ✅, clean 🔶 conditional.** the
  *not safe* leg cited credentials that have cleared; the *not clean* leg holds only under the
  costly sense of *"latest"*. ⚠️ **this field read a bare `dirty` until 2026-09-08**
- **status** = deferred, dispatched, awaits the council
- **confidence** = 🔴 **70%** — was 82%; re-measured 2026-09-07 and **two of its three legs came back
  weakened**: the *not safe* leg cited credentials that have since cleared, and the *not clean* leg
  rests on one sense of *"latest"* that was never weighed against a cheaper one

## .the fork, stated fairly

on 2026-09-07 the wisher gave two directives mid-drive:

1. *"by default, add budget should ONLY impact the LATEST level. not all elvels"*
2. *"should we just never reopen lower levels once we cross to higher levels of reviewers?"*

⚠️ **#2 was cast as a question with an explicit dream ask** (*"maybe we should catch a dream for
that"*), so its deferral is the wisher's own instruction. **#1 was cast as a directive**, and its
deferral is mine.

| the fork | |
|---|---|
| **A — implement both now** | the wisher asked; a driver who defers a directive risks a stall on their own judgment |
| ⬅ **B — dream, dispatch, defer to the council** | the ripple is measured and lands outside the diff; the verification lanes cannot run |

## .taken, and why at the time

**B**, for both, on the SAFE/CLEAN test (`rule.always.fix-forward-under-scouts-honor`):

**not clean** — `updateGuardPeerBudgets` (`route.ts:1784-1880`) is a pure guard-text edit that never
reads `level:`. "latest" must mean highest **ready**, so it gains a `getAllReviewPeerMeterStatuses`
dependency. that pulls route + stone + hash into a CLI operation that touches only file text today,
and drags the `--help` at `:1984`, the acceptance snapshot at
`routeStoneSetContemplation.acceptance.test.ts.snap:370` which quotes the command verbatim, and
`rule.always.spend-own-levers-before-escalation` in both `.md` and `.md.min`.

**not safe** — every suite over that surface is acceptance or integration, and both strict-gate on the
four absent credentials of the open gate 2 halt. ⇒ an unverifiable change to the lever a driver reaches
for **when they are already stuck**.

**and in-scope? no** — this behavior fixes the contemplation gate. P1 governs who may *enter* a round;
both directives govern which lanes *run* and what a top-up *costs* once entry is granted.

## 🔴 .the residual risk, stated rather than hidden

**the wisher may have meant "now".** a directive deferred is a directive not obeyed, and the two
readings are indistinguishable from the wisher's side unless the deferral is surfaced. ⇒ that is
precisely why this is a fulcrum and not a silent dream: **the council sees the call was made, and by
whom.**

⚠️ **and the two directives constrain each other.** a blanket budget add re-arms the very levels the
level-settle would settle, so **either one shipped alone leaves a contradiction on disk.** that mutual
constraint is itself an argument for B — a half-landed pair is worse than a deferred pair.

### 🔴 re-measured 2026-09-07 — the ripple HOLDS, and two legs do not

⚠️ **the summary table described this entry as *"judged dirty on a ripple estimate, never a measure."*
that descriptor was wrong and is struck.** the ripple was cited with five file:line touch points from
the start, and all five re-verify:

| the claim | the check | verdict |
|---|---|---|
| `updateGuardPeerBudgets` at `route.ts:1784-1880` | declared `:1784`, sole call `:1937` | ✅ |
| it **never reads `level:`** | `:1833` names `level:` **only** in a negative test — *does this key exit the peer block* — and never reads its value | ✅ **sharper than stated** |
| the acceptance snapshot quotes the command | `routeStoneSetContemplation.acceptance.test.ts.snap:370` | ✅ verbatim |

⇒ **the ripple was measured all along. the error was in my restatement of it, never in the entry.**

#### 🔴 but the *not safe* leg is now false

it reads: *"every suite over that surface is acceptance or integration, and both strict-gate on the
four absent credentials of the open gate 2 halt."* **those credentials cleared.** the blocker file's
own matrix records all five keys as `vault: os.secure` and the full lane green — unit 441, integration
411, acceptance 3252, zero failures. ⇒ **the change is verifiable today. safe ✅.**

#### 🔴 and the *not clean* leg rests on one sense of "latest", unweighed against a cheaper one

the entry reasons that *"latest"* must mean highest **ready** level, which is what drags
`getAllReviewPeerMeterStatuses` — and route, stone, and hash with it — into a pure-text CLI operation.

**a second sense was never weighed: highest `level:` present in the guard.** and it is cheap, because
the value already sits in the block the walk traverses:

```
budget: 18      ← the line updateGuardPeerBudgets already finds and rewrites
level: 1        ← the very next line, in the same peer block
```

measured on this stone's own guard: ten peers at `level: 1`, three at `level: 3`. ⇒ a highest-present
read is **one more branch inside the extant line-walk** — no new import, no route/stone/hash, no new
dependency at all.

⚠️ **the two senses genuinely differ**, and that is the argument the entry owes rather than the one it
made: with the ladder at level 2 of 1/2/3, highest-present gives **3** and highest-ready gives **2**.
so the ready-sense is likely what the wisher meant — **but "likely" is a wisher call, and the cheap
sense was never put in front of them.**

⇒ **the honest net: safe ✅ · clean 🔶 conditional on which sense the wisher meant · in-scope ⛔.**
one failed test is still a failed test, and the one that fails is **the fence** — the wisher's to move,
exactly as with F13. **so the measurement makes this call cheaper to rule, never self-ruling.**

## .where

- `src/contract/cli/route.ts:1784-1880` — `updateGuardPeerBudgets`, the operation with no level grain
- `src/contract/cli/route.ts:1833` — where `level:` is named but its value never read
- `.behavior/v2026_09_03.fix-contemplation-gate-on-entrance/5.3.verification.guard:243-328` — the
  `budget:`/`level:` adjacency that makes the cheap sense possible
- `src/domain.operations/route/guard/review/peer/meter/getAllReviewPeerMeterStatuses.ts` — readiness
- `src/domain.roles/driver/briefs/rule.always.spend-own-levers-before-escalation.md` (+ `.md.min`)

## .the record

| artifact | id |
|---|---|
| dream — the level settle | `#459` · `.dream/v2026_09_07.fix.a-passed-level-is-re-run-after-the-ladder-moved-past-it.md` |
| dream — the budget scope | `#460` · `.dream/v2026_09_07.fix.a-budget-top-up-re-arms-every-level-at-once.md` |
| seeds | `S15`, `S16` |

## .the verdict, once ruled

⏳ open.
