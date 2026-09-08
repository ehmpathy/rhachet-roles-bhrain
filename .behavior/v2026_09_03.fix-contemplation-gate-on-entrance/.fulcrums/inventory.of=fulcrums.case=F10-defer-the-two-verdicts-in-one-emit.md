# F10 — defer the two-verdicts-in-one-emit defect rather than fix it here

- **rework** = dirty
- **status** = open — the wisher's call
- **confidence** = 74% → **91%**, after the check below was actually run
- **where** = `.dream/v2026_09_05.fix.the-guard-tree-shows-a-verdict-the-live-tree-already-superseded.md`
- **found** = 2026-09-05, `5.3.verification` i015, `ergo-snapshot-visual-blemishes` (bounded)

## .the fork, stated fairly

a snapshot added this round to close a journey-coverage blocker exposed a live defect: one emit
renders one reviewer twice with **opposite verdicts** — `approved` in the live tree, `malfunction 💥`
in the guard tree, on identical `given`/`taken` paths, under `passage = allowed`.

| take it | leave it |
|---|---|
| the stone's own words: *"if you detect it, you fix it. no exceptions"* | the repair touches the **meter** surface P2 widened, and P1/P2 are order-coupled |
| the defect is now **shipped in a baseline**, so it freezes | it does not gate passage — the judge reads the live verdict, which is correct. the harm is legibility |
| a reader of a persisted report is actively misled | it is adjacent to **wish scope item #1**, a fence the wisher set — to fix it here moves that fence with no ask |

## .taken, and why at the time

**leave it, catch it, itemize it.** three reasons, in the order they weighed:

1. **the surface is the one this behavior exists to change.** P2 rewrote latest-given-per-slug across
   hashes. a second, un-clamped change to the same read-or-write path risks the contemplation-debt
   semantics that are the whole deliverable — and a regression there is not local, because P1 is
   inert without P2
2. **the diagnosis is not finished.** the dream rules out the stamp and `computeReviewPeerVerdict` by
   read, and is left with a **write-side / read-side** fork it does not settle. to fix before that
   determination is to guess at a surface that cannot afford a guess
3. **it is a legibility defect, not a correctness one.** the judge reads the live verdict; passage is
   right. that is what makes the deferral defensible — and it is also why the fix is still owed

## .why the rework is dirty

the fix lands in the meter's read or write path. `getRouteGuardReviewPeerContemplationStatus` and
its four consumers (entrance gate, exit gate, overrule short-circuit, stophook) all read through that
surface, and each is clamped by tests written this round. a change there is a teardown-and-reprove,
never a rename.

## .why the confidence was not higher — the doubts as written at 74%

⚠️ 🔴 **this title read `## .why the confidence is 74% and not higher` until 2026-09-08**, while the
header field already carried `74% → **91%**` and the section immediately below records the move. ⇒
the re-score reached the field and left the title. **the same defect as F7, F8, and F13 — a section
title is a home for the value, and no sweep before the thirteenth checked one.**

| doubt | weight |
|---|---|
| **the stone forbids deferral outright.** *"you do not proceed. you do not defer."* I am deferring, and the carve-out I lean on (a wisher fence) is my reading of scope item #1, not a wisher statement about **this** defect | the largest |
| the defect may be **wholly inside a render** and not the meter at all — in which case the rework is clean and the deferral was unnecessary. the dream's own fork admits I have not settled it | real |
| **P2 may have caused it.** if the fresh round stopped writing a meter row because of a P2 edit, this is in scope by construction and the fence argument collapses | real, and unchecked |

## ✅ the third doubt, CLOSED by measurement — and it is why 74% became 91%

I wrote *"real, and unchecked"* above, then noticed the check was one command. it is the same class
of error this whole round kept correcting, so I ran it rather than ship the doubt:

```sh
git diff origin/main --stat -- src/domain.operations/route/guard/review/peer/meter/
⇒ getAllReviewPeerMeterStatuses.ts | 34 +-      getOverruledReviewerSlugs{,.test}.ts | 40 +-
```

and the body of that 34-line change is **entirely a display-path relativization** — it wraps
`cachedReview.path` in `asGuardDisplayPath` and reads a repo root once. it does not touch
`exitClass`, `blockers`, `nitpicks`, or which meter row is selected.

⇒ **P2 did not cause this defect. it is pre-existing on `origin/main`.**

🔴 **and the root cause has a name already in this inventory.** the row is chosen by
`getLatestReviewArtifactForIndex` — *by INDEX, never by slug*, which is **F9** verbatim
(`.dream/v2026_09_05.fix.guard-review-cache-is-keyed-by-index-not-slug.md`). so what r6 blocker.1
found is F9's **second manifestation**, at a second surface, rather than a new defect.

| the doubt | after the check |
|---|---|
| P2 may have caused it | ⛔ **refuted.** the only meter edit is a display-path cast |
| the rework may be clean | 🔴 still open — but the fix now clearly lands in F9's operation, which is dirty |
| the stone forbids deferral | 🔴 **still the largest doubt, and unchanged.** it is a judgment against a hard instruction |

⇒ the honest net: **two of my three doubts moved toward the deferral, and the biggest one did not
move at all.** 91%, never 100%.

## 🔴 amended 2026-09-06, i025 — this entry's ROOT-CAUSE claim is refuted

the section above closes with:

> the row is chosen by `getLatestReviewArtifactForIndex` — *by INDEX, never by slug*, which is **F9**
> verbatim.

**that attribution is wrong.** the operation was rekeyed to the slug this round
(`getLatestReviewArtifactForSlug`, clamped and proven to bite), and the `[case7][t3]` render is
**byte-unchanged**: `r1: successor` still carries `by_peer.departed.md`.

⇒ the row is driven by `cachedReviews.find((r) => r.index === …)` — `runStoneGuardReviews:402`/`:445`
— which is what the F9 **dream** named from the start. this entry reached past the dream's own
diagnosis to an adjacent operation and landed on the wrong one.

### 🔴 how it went wrong is the part worth a record

this entry is the page's best example of a check run and a confidence raised: it went **74% → 91%**
on one `git diff --stat` that refuted a real doubt. that discipline was right.

⚠️ **and the attribution it made in the same breath was never checked at all.** it came from a read
of two operations that shared a defect shape, and a shared shape is a **hypothesis**. the two are
easy to conflate because both feel like *"I looked at the source"* — but one was falsifiable by a
command and the other was falsifiable by a **run**, and only the first got its test.

⇒ **the rule this yields: a claim about which site produced the bytes is settled by a run, never by
a read.** stated in the dream too, where the next reader of this defect will look.

### what does NOT change

the deferral itself stands, and its ground is now **firmer**: the artifact's declared identity is
`unique = ['stone', 'hash', 'index']`, so the repair is a domain-entity identity change rather than a
lookup change. **91% → 88%** — the call holds, the argument behind it was partly wrong, and a
confidence that survives a refuted premise unchanged would be the tell of a number nobody re-derived.

## .the verdict, once ruled

_(open)_ — ⚠️ **rule it together with F9**, not separately. one root, two surfaces; to settle one and
leave the other would fix half a defect and leave a snapshot that pins the other half.
