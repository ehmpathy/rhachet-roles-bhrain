# handoff.v1.to_wisher — the judge tallies ONE HASH, never the latest review

**status** = ✅ **DELIVERED 2026-09-06.** the wisher moved the fence — *"ok can you please reproduce
this with a test and then fix it?"* — and pulled in the twin symptom
(`.dream/v2026_09_04.fix.judge-tally-dies-on-hash-move-after-exhaustion.md`). both are closed.
**found** 2026-09-05, by a read of how `5.1.execution.from_vision` passed.
**relates to** wish `.scope` item **#1** — *per-reviewer cache keys* — reached from a second end.

## ✅ .what landed

| | |
|---|---|
| the clamp | `src/contract/cli/routeStoneJudgeTally.acceptance.test.ts` — two cases, one per direction |
| the pick | `…/guard/review/peer/getLatestReviewFilesPerSlug.ts` — latest per SLUG, across every hash |
| the call site | `route.ts` — `enumRouteGuardReviewPeerFiles` loses its `hash` bound; the per-INDEX dedupe becomes per-SLUG |

**the shape chosen is §3a — latest-per-slug, unconditional.** it is the shape that makes the two
readers agree, which was the defect: the meter already crossed hashes keyed by slug, and the judge
alone did not.

### 🔴 the defect failed in BOTH directions, and one test could not have shown that

measured before the fix, by the clamp itself:

| the fixture | the judge said | the truth |
|---|---|---|
| every reviewer exhausted | `passed: false — no review files found for hash 6c8552b1` | a clean verdict sat at H1 — a **false BLOCK** |
| one reviewer exhausted | `passed: true — nitpicks: 0/3` | a 5-nitpick verdict sat at H1 — a **false PASS** |

⇒ the second is the unsafe one, and the reason this was worth the fence move: **an edit discharged a
verdict nobody addressed** — the same exit this whole behavior exists to shut, one rung up at the
judge rather than at the review gate.

⚠️ **the clamp was proven to BITE, not merely to pass** (`rule.require.clamp-edge-cases`): 3 failed
before the fix, 5 passed after, same fixtures.

### the blast radius, measured rather than estimated

| suite | result |
|---|---|
| unit, full | **1589 passed / 0 failed** |
| integration, full | every route/guard/judge/stone suite passed; the 256 failures are all brain suites with absent api keys |
| acceptance, `driver.route` — 79 suites | **2083 passed / 0 failed / 0 skipped** |

**six blackbox snapshots moved, all in one direction: `blockers exceed threshold (1 > 0)` → `(2 > 0)`
or `(3 > 0)`.** every one is an exhausted reviewer's blocker that the old tally dropped on a hash
move. 🔴 **not one behavioral assertion failed** — only snapshots — so the guard's unlock order, its
terminal detection, its halt point, and its budget tally are untouched; only the COUNT moved.

⇒ that is the branch's already-approved contract finally reaching the judge. `1.vision.yield.md`
already states it for the review gate — *"a reviewer that is exhausted with a blocker outstanding now
persists — the driver must answer, or a human overrules"* — and **the judge was the one reader still
on the old semantics.**

⚠️ the exits are unchanged and all three remain: an answer plus a budget top-up (driver-owned), or a
human overrule/approval. `driver.route.peer-exhaustion-boundary [t3]` still reaches the
`budget exhausted` + `approve` halt, so no stone is deadlocked by this.

---

*what follows is the original escalation, unchanged. its evidence stands; its `.the ask` is closed.*

## 🔴 .the answer

> **must be the LATEST always.**
> — the wisher, 2026-09-05. archived verbatim at
> [`.seeds/…case=S07`](../.seeds/inventory.of=seeds.case=S07-the-judge-must-tally-the-latest-review.md)

**a judge grades the newest verdict each reviewer has spoken.** *"latest"* is a property of the
**reviewer**, never of the hash — a verdict is superseded by that reviewer's next word, and by no
other event.

⚠️ **the answer picked neither §3a nor §3b.** it settled the **invariant**; both shapes satisfy it and
differ only in how many *stale* verdicts survive. so **§6's recommendation is superseded** — it is a
shape argument, and the shape is still open.

⇒ what §4 names as consequences are now **known prices**, not objections: a persisted nitpick has no
`.taken` route, `--allow-nitpicks N` denotes a new quantity, and the hash split is settled to have
been inherited rather than chosen.

*what follows is the original escalation, unchanged. its evidence stands; its `.the ask` is closed.*

---

## .the ask, shortest form

> **should the judge tally each reviewer's LATEST verdict, rather than only the verdicts written at
> the current artifact hash?**

⇒ the direction reads obviously right. **the shape is the call**, and one of the two shapes changes
what `--allow-nitpicks N` means. that is yours, not a driver's.

## 1. the measured fact

`5.1.execution.from_vision` **passed** with a stamp that displays **16 nitpicks** against
`--allow-nitpicks 7`.

no defect in the pass. the judge tallied **4**.

| the read | scope | what it saw at 5.1 |
|---|---|---|
| the **meter** — the stamp tree a human reads | latest per slug, **across hashes** | 11 reviewers · **16 nitpicks** |
| the **tally** — the judge's pass/fail decision | 🔴 **current hash only** | **1 reviewer** · **4 nitpicks** |

the judge's own cache records its verdict verbatim
(`.route/5.1.execution.from_vision.guard.judge.i6p1.78572c4f6f5ae0c9ad.…j1.md`):

```
passed: true
reason: reviews pass (blockers: 0/0, nitpicks: 4/7)
```

⚠️ **no human approval and no overrule are involved.** `passage.jsonl` holds exactly one `approved`
line and it is `1.vision` (`:60`). the threshold check ran, on a set of one.

## 2. why the sets differ — a fallback that exists on one side only

both readers call the same enumerator. `enumRouteGuardReviewPeerFiles.ts:40` puts the hash in the
glob as an **exact segment**, so at hash `78572c4f` it returns one file.

the divergence is what each does on a miss:

| | on a reviewer with no file at the current hash |
|---|---|
| **the meter** (`getAllReviewPeerMeterStatuses.ts:109-116`) | falls back to `getLatestReviewArtifactForSlug` — its docblock: *"…the latest review artifact for a specific reviewer, **regardless of hash**"* |
| **the judge** (`route.ts:1296` → `:1393`) | 🔴 **no fallback.** the by-hash list goes straight to `computeReviewTotalsFromFiles` |

⚠️ **two citations here named `getLatestReviewArtifactForIndex`, which no longer exists** — it was
renamed to `…ForSlug` mid-behavior, and the rename made the two readers MORE divergent, not less:
the meter became correctly slug-keyed across hashes while the judge stayed index-keyed within one.
corrected 2026-09-06, in the same round that closed the divergence itself.

the fallback is deliberate, and its stated purpose is the tell — `runStoneGuardReviews.ts:454`:

> *"still add latest review for display purposes"*

⇒ **the cross-hash read was built to render a tree.** the judge is a separate process
(`rhx route.stone.judge`) that re-derives its own list from disk, so it never sees that array.

### why ten reviewers had no file there

`reviewPeerMeters.jsonl` + the guard: nine l1 reviewers and `enroll-impl-behavior-intent` all sit at
`rounds: 3` against `budget: 3`. `enroll-impl-arch-defects` sits at `rounds: 4` against `budget: 5`
— a top-up, which is why it alone was live at i006.

so at i006 the ten hit the exhaustion skip and wrote no file. their newest verdicts stayed at
`i003.d70502041f…` and `i005.daefaed902…`.

### the shape of the hazard

the hash moved between i005 and i006 because the driver edited `src/**/*` to answer r010. **that is
the normal loop.** for a live reviewer it costs no verdict — the move forces a re-run and the count
is re-derived.

the count only disappears when the reviewer **cannot** re-run:

> 🔴 **exhaustion + a hash move = a reviewer's nitpicks leave the tally, with no one left to re-raise
> them.**

⚠️ **that is defect D2's mechanism, one lane over.** the wish says of contemplation debt:
*"keyed `(slug, hash)`, so any code edit discharges it"*, and names manufactured exhaustion as
structurally free. **P2 fixed the keying for the debt. the tally still keys by hash**, so the same
edit still discharges the count.

## 3. two shapes, and they are not equivalent

### 3a. the coarse shape — give the judge the meter's fallback

latest per slug, regardless of hash. small change.

🔴 **it counts verdicts about code that may no longer exist.** `r010`'s 6 nitpicks were raised
against the i005 tree; the driver then edited `src/**/*` to answer them. some are likely repaired —
and `enroll-impl-behavior-intent` is at `3/3`, so it cannot re-run to say so.

⇒ exits become a per-reviewer budget top-up, or a human overrule. **for ten reviewers.** 5.1 would
have been un-passable at 16 > 7.

### 3b. the fine shape — the wish's own scope item #1

> *"`computeStoneReviewInputHash` hashes the whole artifact set, so a reviewer's clean verdict dies
> on a hash change its own rule does not govern. `input.scope.json` already records each reviewer's
> exact `targetFiles`."*

verified extant: `stepReview.ts:418` computes `targetFiles`; `genReviewInputStdout.ts:112` writes it
to `input.scope.json`.

key each reviewer's cache to **their own** files, and *"latest"* stops meaning *latest ever* and
starts meaning **latest still valid**. a reviewer whose files did not change keeps a live verdict;
one whose files did change is invalidated and owes a re-run.

⚠️ **and it dissolves the problem upstream rather than a patch at the tally.**
`runStoneGuardReviews.ts:416` already promises the cache:

> *"if that review has said all good already, then its already cached and budget wont be used"*

that promise is keyed by the **whole-artifact** hash. so every edit anywhere invalidates it, every
reviewer re-runs, and every reviewer burns a round. 🔴 **that is how all ten reached `3/3` in the
first place.** under per-reviewer keys most would never have been exhausted, so there would be no
stale count to argue about.

⇒ **the tally's hash-scope is a symptom. the whole-tree hash is the cause.**

## 4. why this is yours and not a driver's

### 4a. a persisted nitpick has NO driver-side discharge

`…Uncontemplated.ts:9,17` filters on `blockers > 0` (vision assumption **A2**). so P2's contemplation
route — write a `.taken`, the debt clears — **does not reach a nitpick at all**.

| | exits under a widened tally |
|---|---|
| a persisted **blocker** | answer it · budget top-up · human overrule |
| a persisted **nitpick** | 🔴 budget top-up · human overrule. **no answer route** |

⇒ to widen the tally is to give nitpicks the persistence P2 gave blockers, with **strictly fewer
ways out**. either that is intended, or the discharge set owes a matching widen — and that is a
policy call.

### 4b. the number's meaning changes

`--allow-nitpicks 7` was calibrated against a **per-hash sum**. widen the scope and the same `7`
denotes a different quantity. that is a re-reading of every guard in the repo, not a repair.

### 4c. it reverses a documented decision, exactly as Q1 did

`route.ts:1359-1364` and `getStoneGuardLevelClearance.ts:30-33` both already state that the meter and
the tally differ **by design** — *"its SUM-of-blockers semantics differ from a per-reviewer check for
allow>0 guards, so the judge keeps its own SUM tally for the pass/fail decision."*

⚠️ **what neither states is that they also differ on which HASHES they read.** so the extant note
covers the semantic split and is silent on this one — which leaves it unclear whether the hash split
was chosen or inherited.

⇒ same shape as **Q1** in the vision, where P2 deleted a guarantee a prior author had written down.
that was escalated rather than decided. this is escalated for the same reason.

## 5. what is NOT claimed here

- ⛔ **no defect in this behavior's fix.** P1 and P2 landed as contracted. 5.1 passed on a correct
  tally of the set the judge was built to read
- ⛔ **no claim the 16 SHOULD have blocked.** whether a stale nitpick still counts is the open
  question, not its answer
- ⛔ **no read of the fine shape's blast radius.** per-reviewer cache keys touch
  `computeStoneReviewInputHash`, the enumerator, both readers, and every guard's caching. **not
  measured** — the estimate above comes from a read of five files, not a walk of the change
- ⛔ **the sibling tree was not checked**, exactly as the wish's own gaps list records

## 6. the recommendation, held loosely

**direction: yes.** the asymmetry as it stands is indefensible — two reads of *"the reviews"*, one
crosses hashes and one does not, and no artifact records that they differ on that axis. a human
reads a stamp that displays eleven verdicts the judge summed one of.

**shape: 3b, not 3a.** it repairs the cause, leaves far fewer stale counts to litigate, and the
`input.scope.json` groundwork already exists.

⚠️ **and it probably deserves its own wish rather than a scope expansion here.** scope item #1 is now
reached from two independent ends — the contemplation debt (this behavior) and the judge tally (this
handoff) — which is evidence it is a peer of this wish, not a footnote to it.

## .see also

- `0.wish.md` `.scope` item **#1** — the fence this sits behind, and the `input.scope.json` pointer
- `1.vision.yield.md` `.open questions` **Q1** — the same escalation shape, on P2's own key
- `.dream/v2026_09_04.fix.judge-tally-dies-on-hash-move-after-exhaustion.md` — ⚠️ **the caught dream
  named for this mechanism. its content was not re-read this round; confirm it matches before you act**
