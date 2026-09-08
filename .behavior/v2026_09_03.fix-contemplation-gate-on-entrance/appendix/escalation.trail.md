# appendix: the escalation trail — how the three gates were built

**this is the EVIDENCE under `blocker/5.3.verification.md`, never the ask itself.** the ask lives
there and is refreshed each round; this file holds the rounds that built it, so the blocker file
can state the current state in one screen.

⚠️ **read the blocker file first.** if a claim here disagrees with it, the blocker file is
authoritative — it is the one kept current.

## .why this file exists

the blocker file had accreted **three stacked "kept as written" layers** (i023 under i026 under
i027) and reached 496 lines. `route.drive` points a human straight at it, so the artifact a human
opens first was the one where the current ask was hardest to find. that is
`rule.always.yield-the-output-not-the-archaeology` — *the evidence under a decision that IS in the
yield goes in `appendix/`, and the yield cites it by path.*

🔴 **and the file had already failed for exactly this reason once**: at i026 it was found three
rounds stale, and it *presented gate 2's own headline example as live after that example had been
resolved.* the repair chosen then was to **prepend** a correction and keep the body — which is
what produced the stack. **an accretion repaired by accretion.**

---

## ⬇️ the i027 layer — the retracted growth claim

⛔ **RETRACTED — "the wall rises each round I answer" was FALSE.**

the claim was: *"every taken I write lands in `since-main`, which is exactly the unscoped set the
lane tries to read."* the wisher asked for proof from the reviewer inventory, and it does not hold:

```
$ git check-ignore -v ".../.reviews/peer/…r001._.taken.by_self.repo-rules.md"
.reviews/peer/.gitignore:2:*    → IGNORED
```

that gitignore is `*` plus `!.gitignore`, so **a taken can never enter `git diff origin/main`.**
independently, a grep for `.reviews` across the whole token breakdown returns **0 matches**.

the growth is real, and it came from elsewhere:

| | files in diff | tokens | overflow |
|---|---|---|---|
| i026 | 299 | 1027.3k | ~137.7% |
| **i027** | **310** | **1079.7k** | **~143.9%** |

| the real source of +52.4k | |
|---|---|
| `.behavior/` | +21.3k — of which `5.3.verification.yield.md` alone is +8.1k |
| `src/` | +9.3k |
| `blackbox/` | +8.8k |
| `.dream/` | +8.1k |
| `.agent/` | +4.9k |

⇒ 🔴 **an aggregate answers "how big"; it can never answer "what is in it."** a total was read, a
story fit it, and the story was written as a measurement — the exact error F10 forbids, in the
round that wrote F10.

⚠️ **the escalation never rested on this claim**, so its withdrawal left the ask unchanged. what
is withdrawn is only the added claim that another lap would make the gate harder — **it would
not.**

---

## ⬇️ the i026 layer — what the driver did with its own levers

1. 🔴 **i025 — five dark lanes relit, after five rounds wrongly filed as gate 1.**
   `rule.always.diagnose-reviewer-malfunctions` gives an overflowed lane a **driver-owned** remedy:
   a scoped `rhx review`. for five rounds the overflow was filed upward instead, which the rule
   grades a **blocker** by name. the five scoped runs found **3 blockers + 3 nitpicks** that were
   one round from a silent ship. ⇒ **gate 1 is real, and it was never the reason those lanes were
   silent.**
2. **i025 — the cross-hash index-key defect repaired**, clamped, and proven to bite both ways.
3. ✅ **i026 — `r004 blocker.1` closed.** the wish's headline behavior gained a blackbox witness:
   `peer-contemplation [case2]`, four `[tn]`, all snapped. an edit no longer buys passage, and the
   proof is a run rather than an argument.
4. ✅ **i026 — a stale experience tally corrected** (`1.vision.yield.md` read `16/6/9/81` against
   the inventory's `20/6/9/77`). the same class of defect as this file's own staleness, caught
   twice in one round and dreamed for reseed.

### gate 2, as it stood at i026 — the `[case4]` argument in full

`[case4]` of `setStoneAsPassed.exhausted.integration.test.ts` (`:430-640`) walks **four** `[tn]`
steps and carries **zero** `toMatchSnapshot()` calls. **two independent rubrics, over two
independent bounded corpora, raise it:**

| lane | rule |
|---|---|
| r1 | `rule.require.snapshot-every-journey-step` |
| r2 | `rule.require.contract-snapshot-exhaustiveness` |

it was conceded in full. earlier rounds carried it as a queued deferral; both lanes rejected that,
and they were right to. `philosophy.verification-strictness` is explicit — *"credential difficulty
= blocker. not exception."*

**✅ the reviewer's own proposed alternative was tested, not argued against.** r1 offered:
*"scoped-run the kernel steps that genuinely need no brain."* **the premise is correct** —
`[case4]` is entirely brain-free; its reviewer is `echo "blockers: 1\nnitpicks: 0\ntest review"`
(`:455`), its judge is `echo "passed: false\nreason: blockers found"` (`:459`). so exactly that was
run:

```sh
rhx git.repo.test --what integration --scope 'path://setStoneAsPassed.exhausted' --mode apply
```

| result | value |
|---|---|
| keyrack | `unlocked ehmpath/test` |
| scope | matched **1 file** — the narrow scope held |
| outcome | ✋ **failed in 2s, before any test ran** · exit `2` |
| log | `.log/role=mechanic/skill=git.repo.test/what=integration/2026-09-05T23-40-24Z.stderr.log` |

⇒ 🔴 **the credential gate is per-PROCESS, never per-SUITE.** `jest.integration.env.ts:96` runs in
setup — before jest selects a suite — and `mode: 'strict'` calls `process.exit(2)`. **a brain-free
suite is refused for five keys it would never read.**

⚠️ **and the same file already knows better:** `:60-86` gates the test database *conditionally* on
`declapract.use.yml`. the keyrack gate at `:94-96` is the outlier. that asymmetry is the fix at
source — real, but it ripples to every integration and acceptance suite, so it is **dirty** and
stays caught as a dream rather than pulled into this diff.

### every other lever, spent and refused with cause

| lever | why it fails |
|---|---|
| the **unit** lane (ungated; `--resnap` works there) | `rule.forbid.unit.remote-boundaries` — it touches the filesystem. and the unit suite **already** crosses that boundary (`.dream/v2026_09_04.fix.unit-suite-crosses-the-fs-boundary-repo-wide.md`); a fifth case through it braids a second path beside one already graded broken |
| flip `mode: 'lenient'` | it mints baselines under absent credentials — **a fake clean bill**, the exact failhide this stone forbids (`.dream/v2026_09_04.fix.lenient-keyrack-flip-writes-fake-clean-snapshots.md`) |
| **hand-author** the four baselines | 🔴 **the refusal worth the record.** this branch has a proven practice for **stale** baselines — bytes exist, the delta is determined, the repair is checkable. `[case4]`'s are **absent**, and that difference is the whole ladder: to write them is to assert output never observed. **a fabricated test** |
| **delete `[case4]`** (r2 offered it) | declined, with cause: it is the only case that drives the wish's sharpest path — the edit-escape-hatch itself, twice, over a carried debt. **to delete it to satisfy a snapshot rule trades the contract's central proof for its observability** |

⚠️ **what is absent is the reviewer's visual window, never the verification.** all four steps
assert their behavior by name and pass — `await your reply`, `passed`, `contemplate from`,
`articulate into`, and the reviewer slug.

### 🔴 the same ladder, applied against the driver at i021

r11's repair required edits to snapshot keys in files behind this very gate, so a reader could
fairly ask whether the "hand-author" row above is a standard or a convenience. it is a standard,
and the two cases sit on opposite rungs of it:

| | `[case4]`'s baselines | i021's key edits |
|---|---|---|
| bytes on disk | ❌ **none** | ✅ present |
| the delta | the entire rendered output — **unknown** | two characters dropped from an export key |
| does a **value** change? | it would be authored whole | ❌ **no value is touched at all** |
| checkable without a run? | ✋ no — that is the fabrication | ✅ yes, and it was: `exports\[.*🔴` → 0 |
| proven by a run? | — | ✅ **1586 passed** under `--ci`, on four unit twins of the same edit |

⇒ **the rule is not "never hand-edit a snapshot."** it is *"never assert output you have not
observed."* a key that drops a fragment asserts no output at all; an absent baseline is **purely**
asserted output.

🔴 **this ladder was then violated by its own author at i028** — a baseline for
`routeStoneJudgeTally.acceptance.test.ts` was typed by hand and withdrawn the same day. the record
is in `.reviews/peer/…r010._.taken.by_self.enroll-verif-snapshot-coverage.md`; the durable half is
`ehmpathy/rhachet-roles-ehmpathy#659` (dispatched, then pruned locally — the tracker is the queue).
⇒ **the ladder was right, and to write it down was not enough to obey it.**

---

## ⬇️ the i023 layer — how the picture sharpened

| lane | level | i023 |
|---|---|---|
| r011 `enroll-verif-snapshot-blemishes` | **l3** | ✅ **0 blockers, 0 nitpicks** — the lane that blocked at i021 |
| r012 `enroll-verif-test-intent` | **l3** | ✅ **0 blockers, 0 nitpicks** |
| r010 `enroll-verif-snapshot-coverage` | **l3** | 🔴 **1 blocker** — `[case4]`, and r010 itself calls the gate human-only |
| r005, r007, r008, r009 | l1 | ✅ approved, cached |
| r001–r004, r006 | l1 | ✋ **constraint — a THIRD consecutive round** |

### what changed between i021 and i023, and why it strengthened the ask

1. **r011 turned.** the lane that raised the emphasis-marker blocker returned `0/0`. **the 87-edit
   sweep was confirmed by its own critic**, not by a self-count
2. **a peer verified the verification.** the unminted-snapshot argument rests on `jest --ci`, which
   refuses to write keys. r010 checked that from source unprompted — `package.json:63`,
   `jest-snapshot@30.2.0`. ⇒ **the standard was confirmed by a party other than the one it
   exonerates**
3. **gate 2 gained four independent readers** — r001, r002, r010's manual walk, r010's re-read
4. **gate 1 was measured three times over**, and the trend is adverse: i023 reported **133.3%** of
   a 1M-token window against **295** files
5. **two more rounds of repairs landed** — r007's two placeholder titles, then the full
   seven-frame new-bytes sweep that F12's reversal forced. gates green throughout, **1586 passed,
   no baseline movement**

### 🔴 the i021 headline once read "zero blockers" — corrected 2026-09-06

r11 raised a real one, and that articulation had been written before the lane was read. **it was
corrected rather than overwritten**, because the correction is the point: an escalation that
claims a cleaner corpus than it has asks a human to grant a lever on a false premise.

what the lane caught: **11 emphasis markers baked into snapshot keys** in a new acceptance suite,
against a rule from **this drive's own dream**. the sweep it triggered found **29 more in 14 other
files** — one file of sixteen had been swept, and the dream recorded that as done. **87 edits**
landed; gates re-run green at **1586 passed**, no baseline movement.

---

## ⬇️ gate 1's full measurement — the unparseable binds

five lanes returned `constraint ✋`, each with the identical scope block:

```
targets
   ├─ diffs: since-main
   │  └─ files: 314
   ├─ paths: (none)          ← 🔴
   │  └─ files: null
   └─ joined via intersect
      ├─ files: 289
      └─ tokens: 978.4k
✋ prompt exceeds 75% of context window
   └─ 127.7% of 1000000 tokens
```

**`paths: (none)` is the whole defect.** the guard binds an extension-brace glob
(`'**/*.{ts,sh,md,snap}'`); `parseReviewArgs` (`src/contract/cli/review.ts:121-151`) does not
survive it, so the path filter evaluates to an empty bound, the target set collapses to the entire
`since-main` diff — **289 files, 978.4k tokens** — and the lane overflows before it reads a line.

⚠️ **this is not budget exhaustion.** the five lanes sit at `9/18`; they have half their rounds
left. they are broken, not spent — so **more budget cannot help, and neither can another round.**

### the bind forms, measured

| form | result |
|---|---|
| `'**/*.{ts,sh,md,snap}'` | 🔴 `paths: (none)` — the extension-brace, unparseable |
| `'{src,blackbox}/**'` | ✅ **158 targets, 61.5% context** |
| `'{.behavior,src}/**'` | ✅ **182 targets, 70.9% context** |
| `'{src,blackbox,.behavior}/**'` | 🔴 `paths: (none)` — a **three-way** brace with a dot entry also fails |

⚠️ **`--paths-with` must be paired with an explicit `--diffs`.** measured 2026-09-05: without it
the bound is silently dropped — **112 targets vs 34** against a 21-file delta, so the lane grades
~5× the branch and returns plausible items about code that predates it. **the tell is an absence,
never an error** — a bounded run prints a `diffs:` line; an unbounded one prints none.

### the five bounded re-runs, at i020

| lane | bounded verdict | logs |
|---|---|---|
| r1 repo-rules | 🔴 2 blockers + 1 nitpick → **2 repaired**, 1 escalated to gate 2 | — |
| r2 ergo-contract-snapshots | 🔴 1 blocker → the same `[case4]` cell as r1's | `2026-09-05T23-42-19-763Z` |
| r3 mech-external-contracts | ✅ **0/0** | `2026-09-05T23-48-40-910Z` |
| r4 ergo-acceptance-journey-coverage | ✅ **0/0** | `2026-09-05T23-49-41-406Z` |
| r6 ergo-snapshot-visual-blemishes | ✅ **0/0** | `2026-09-05T23-50-43-492Z` |

⇒ **so the five overflowed lanes hide no unknown critique.** four are clean; the fifth raises the
same cell as gate 2.

⇒ the engine-level repair (which fixes every route's binds at once, rather than this one's) is the
open fulcrum **F11**, at 84% confidence across five rounds, and the dream
`.dream/v2026_09_04.fix.review-multi-glob-flags-do-not-comma-split.md`.

---

## ⬇️ the peer opinion, and the F1 correction it forced

`rule.always.get-a-second-opinion-before-foreman` demands a peer read **before** a human is
knocked on, and demands the opinion be **cited** in the escalation.

| | |
|---|---|
| the opinion | `.review/peer-opinion.harness-key-demand.md` (2026-09-04) |
| the ask | the harness key demand — gate 2 |
| the rubric it graded against | `rule.always.spend-own-levers-before-escalation` |
| its verdict | 🔴 1 blocker — **on a different subject than the ask** |

⚠️ **it did not answer the question asked.** it graded the branch against the levers rule and
raised an unrelated inconsistency: that `1.vision.experience.case=5` `[t2]` contradicts F1's
"three discharge paths" line. **that is a real inconsistency, and it was chased rather than
filed** — the mandate admits no omissions.

### the peer found a true contradiction and blamed the wrong side

it proposed that `case=5` move to match F1. **`[case3]` proves the opposite** — a real,
snapshotted, green integration test on this branch, authored precisely to settle this:

> `[case3] 🔴 a budget top-up does NOT discharge a debt — it only buys a confirmation round`
> `[t1] 🔴 the driver tops the budget up and re-enters, with NO answer written`
> `then: 🔴 matches snapshot — a topped-up reviewer, still held by the debt`

⇒ **`case=5` was right; F1's line was loose.** so **F1 moved**, and its correction now names the
distinction the loose prose had collapsed:

| | what it is | examples |
|---|---|---|
| a **lever** | what the driver can spend | an answer · **a budget top-up** |
| a **discharge** | what clears the debt | an answer · an overrule |

⚠️ **the discharge row listed a third — *"the reviewer's own withdrawal"* — and it is struck.** the
entrance gate is stone-level and returns before any reviewer runs, so a reviewer speaks again only
after an answer or an overrule already unlocked the round. **a withdrawal is a consequence of a
discharge, never one of its own.** caught by the wisher 2026-09-07; see `1.vision.yield.md` § "the
second corrected row".

🔴 **so this correction landed half-way when it was written.** the peer flagged the loose prose, F1
moved, and **this very table restated the loose claim in the same breath** — the third path survived
the round that was convened to fix it.

⚠️ **the peer's deeper concern survives the correction** — `rule.always.spend-own-levers-before-escalation`
is right that a driver must spend the budget lever before any ask. **the five overflowed lanes sit
at `9/18`. budget is not their constraint; a broken glob is.** more budget cannot repair a lane
that grades no corpus.

---

## ⬇️ the i019 defect worth a name — created by the driver one round earlier

r1's blocker.1 caught that the **i019** repair lifted `runStoneGuardReviews`'s inline passage
footer into the shared `formatArtifactFooters` and **left `runStoneGuardJudges`'s copy inline.**

> **an extraction that lifts one of two call sites does not reduce duplication.** it converts a
> symmetric pair into an authoritative writer plus a stale copy — strictly worse, since the copy
> now drifts against a writer that claims to own the grammar.

⚠️ **and it hid because the output was byte-identical.** with `tally: null`,
`formatArtifactFooters:38-40` derives `marker = '└─'` and `childIndent = '   '` — exactly the three
lines the inline block pushed by hand. **no snapshot moved and no test failed**, so it was
invisible to every output-shaped rubric, r6 among them, which returned `0/0` on the same corpus.
only a rule about duplicate tree operations could see it.

⇒ the repair confirms itself the same way: **`1586 passed` with no baseline movement.** a moved
baseline would have proved the two renderers had already diverged.
