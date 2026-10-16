# F22 — the cross-tab ships opt-in, behind a flag the wisher RESERVED

- rework = **clean**
- status = 🟡 **BEST-GUESSED at 2026-09-23 — `--trace` shipped**, opt-in, tree-only
- confidence = 🟡 **85%**

## .the fork, stated fairly

the dream this drive pulled in named five parts and reserved exactly one decision:

> *"(2) is likely too wide for the default `--of tree` render — 9 lanes × 6 rounds is ~54 rows,
> where `--limit` is refused at tree breadth. the axis probably wants to be opt-in, **which is a
> flag decision the wisher owns**."*

so the ARITHMETIC was specified and the SURFACE was not. three forks sat under that one line, and
the drive best-guessed all three:

| # | the fork | what shipped | the alternative |
|---|---|---|---|
| a | opt-in, or always rendered? | **opt-in** | always, and accept ~54 rows on a mature tree |
| b | what is the flag CALLED? | **`--trace`** | `--cross`, `--by round-and-reviewer`, `--axis <name>` |
| c | which breadths carry it? | **`--of tree` alone** | `run` (meaningless — one run) · `grove` (a cross-tab of cross-tabs) |

## .taken, and why at the time

**a — opt-in.** the dream's own arithmetic decides it: `--limit` is refused at tree breadth
(`F2`), so an always-on cross-tab has **no bound at all**. a mature tree would push its three
marginals — the rows a driver reads every day — off the top of a terminal, to serve a question
asked once per lever. ⇒ the default render's job is *"what did this cost"*; the cross-tab's is
*"did a lever move"*. one is daily, one is episodic.

**b — `--trace`.** it names the ACT the axis performs, which is the divergence the dream itself
drew: *"a cross-tab exists to TRACE where a marginal exists to RANK"*. the rejected peers each
name the SHAPE (`--cross`) or the KEY (`--by round-and-reviewer`) — and a reader who wants the
shape has to already know they want it, where a reader who wants to trace a lever knows that in
their own words. 🟡 `--axis <name>` was the strongest rival and is the one that generalizes; it
was declined because a one-member enum is a namespace with no second member yet
(`rule.prefer.wet-over-dry`).

**c — tree alone.** at `run` breadth a cross-tab has one cell. at `grove` breadth it is a
cross-tab over trees that share no stone names, so its keys collide by construction. ⇒ `tree` is
the only breadth where both axes have several positions AND one vocabulary.

🔴 **and none of the three was the wisher's to have taken.** the dream said so in one clause, and
the drive read the clause, implemented the axis, and did not raise the row until the round's close.
that gap — between *"the wisher owns this"* read and *"the wisher owns this"* recorded — is what
this file repairs.

## .rework, and why

**clean.** all three forks are one flag on one unreleased surface:

- **a** flips by a move of the `byRoundAndReviewer` section out of the `if (trace)` branch — one
  conditional, no fold change, no arithmetic
- **b** is a rename of one flag literal, its `--help` block, and its acceptance assertions — the
  axis ships under no other name, so there is no consumer to break
- **c** widens by a call at a second breadth; the fold (`getAllBucketsByKey`) is breadth-agnostic
  already

no caller outside this repo reads the flag, no artifact records it, and the `--json` payload
carries **every** axis unconditionally — so a flip of **a** changes stdout alone and leaves every
machine reader untouched.

## .confidence, and why it is not higher — 🟡 85%

**a** is near-certain: the `--limit` arithmetic is measured and the dream reached the same guess
independently. **b** and **c** are where the 15% sits.

1. ✅ **the glossary check on `trace` is RUN, and it is clean.** a `term=*trace*` glob over
   `domain.terms/` returns 0 clusters, and a case-insensitive grep returns 3 hits — all ordinary
   English prose in `term=artifact.dream` and `term=artifact.withdraw`, none a declared term, none
   a forbidden synonym. ⇒ this soft spot was written as OPEN and closed on the same pass: the check
   `rule.always.reuse-pavement-before-improvise` asks for is two commands, and this branch has
   already shipped **three** name defects it would have caught (`corpus` was a forbidden synonym of
   `scope`; `fleet` broke the container pair `tree` set).
   🟡 what it does NOT close: `trace` is now an undeclared contract word, so it owes a cluster of
   its own under `rule.require.domain-term-itemization` once the flag is ruled
2. **the opt-in default was never measured on a real tree.** ~54 rows is the dream's arithmetic
   (9 × 6), not an observed render. this tree's own corpus is 58 runs; a render of it would settle
   whether the default is *unreadable* or merely *long*
3. **`--of grove` was declined on a reasoned key-collision, not a tried one.** two trees that
   both carry `5.1.execution.from_vision i001 · repo-rules` would in fact collide — and whether a
   grove cross-tab wants tree-qualified keys instead is a question nobody asked

## .where

- `src/contract/cli/review._.cost.ts` — the `--trace` flag read, its refusal at non-tree breadths,
  and the `🟡 "did a cache lever MOVE a figure?"` help block
- `src/domain.operations/review/meter/genReviewMeterReport.ts` — `byRoundAndReviewer`, and the
  key-ordered sort option on the grouper
- `src/domain.operations/review/meter/genReviewMeterStdout.ts` — the section render
- `.dream/v2026_09_23.feat.the-meter-has-no-round-x-reviewer-cell-so-a-cold-run-reads-as-a-defect.md`
  — the dream, and the reservation clause verbatim

## .the verdict, once ruled

_unruled._

## .see also

- **F2** — `--limit` bounds the render, not the scan. its refusal at tree breadth is the fact that
  decides fork **a**
- **F1** — the same branch's other fulcrum over a contract WORD, and the one that shows what an
  unchecked word costs
- `rule.always.reuse-pavement-before-improvise` — the glossary grep soft spot 1 names
- `rule.prefer.wet-over-dry` — why `--axis <name>` was declined at one member
