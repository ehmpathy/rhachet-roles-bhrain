# rule.require.report-both-cost-levers-with-trend-and-locus

> **a cost report names TWO levers — input size DOWN and cache rate UP — renders both by
> default at every breadth, gives each one a TREND, and attributes input size by LOCUS.**

four obligations. each one alone leaves the report unactionable, and three of the four are
cheap to satisfy from data the meter already holds.

## .why — one lever alone argues for the wrong move

a cache rate answers *"how much of what we sent repeated."* an input size answers *"how much we
sent."* neither implies the other, and they multiply into the bill. so a report that carries one
is not half an answer — it is a case for the wrong optimization:

| the report carries | the reader concludes | why that is wrong |
|---|---|---|
| cache rate only | *"raise the rate"* | a fully cached prompt of 1M chars still bills 1M chars, merely at the cheaper rate. the cheapest prompt is the one never sent |
| input size only | *"cut the scope"* | scope a lane needs is not waste, and a repeat is ~31× cheaper — so a large stable prompt can cost less than a small volatile one |
| both, no trend | *"we sit at X"* | one average over a series that climbs reports the repair as mediocre |
| both + trend, no locus | *"it is large, somehow"* | a size with no address cannot be pruned |

## .obligation 3 — the trend, and why a single figure misleads

a lifetime average spans every round, so it spans the repair. measured here: one tree reported
**19.8%** cached over its life while its recent rounds ran **48–100%** — the early rounds it still
counts were pre-repair, and they drag the headline below current state by more than 2×.

⇒ **a rate over a repaired series is not a state; it is a history.** a reader who acts on it either
re-fixes what is fixed, or abandons a lever that in fact works.

so each stat carries its series at every breadth — not behind an opt-in flag, and not only as a
cross-tab whose rows sort by weight rather than by round.

## .obligation 4 — the locus, and why a named input is not an address

a composition by *named input* states the size and withholds the target. *"`targetFiles` is 87.6%
of 1.0M chars"* is true, actionable by nobody: it names the **kind** of input, never the **place**
it came from, so it cannot part mass a lane needs from mass a glob swept in.

measured here: a run whose 113 targets were **100% one directory** and **100% tests** — correct for
a tests lane, and the meter could not say so either way. the rollup that settled it was written by
hand, which is the tell: **a question a reader must leave the tool to answer is a question the tool
does not report.**

⇒ so input size is attributed by locus — top N directories, and the like — with a share per row.

## .the test

> **1. can a reader see BOTH levers without a flag, at the breadth they asked for?**
> **2. can they see which way each one MOVED?**
> **3. can they name a directory to prune, from the report alone?**

three yeses → it reports. any no → that lever is present as a number and absent as a lever.

| when… | then… |
|---|---|
| you add a cost figure at one breadth | 🔴 add it at all three. a breadth that lacks a stat its peer has is the defect, and it is invisible from inside that breadth |
| you render a rate | render its series beside it. a bare rate over a repaired corpus is a history read as a state |
| you render a size | render its locus. a total with no address funds no decision |
| a trend lives behind a flag | it is not reported. a default is what a reader sees |
| you would sort a trend by weight | order by round, or the step is gone — that is what a trend is for |
| you hand-write a rollup to answer a reader | 🔴 the strongest cue. that rollup is owed by the tool |
| a stat has one breadth and a peer has three | name the gap in the report, never in your head |

## 🟡 .the boundary

| a violation | not a violation |
|---|---|
| a breadth that renders cache rate and no input size | a breadth that renders both, briefly |
| a trend available only under a flag | a **deeper** cross-tab under a flag, where a default trend already ships |
| a composition by named input, with no locus | a locus truncated to top N, with the remainder named |
| a size figure a reader must leave the tool to attribute | a size whose locus is one row because the corpus genuinely is |

the line that parts them: **after one default invocation, can the reader act on both levers?** yes →
it reports. no → whichever lever they cannot act on is decoration.

## .enforcement

blocker: a cost report that renders one lever and not the other · a breadth that omits a stat its
peer breadth carries · a composition by named input with no locus attribution · a size or rate
whose trend exists nowhere at that breadth.
nitpick: a trend that ships only behind a flag where a default would serve · a trend ordered by
weight rather than by round · a locus rollup with no share per row.
false positive: a deeper cross-tab gated behind a flag, where a default trend already ships · a
locus of one row where the corpus is genuinely one directory · a one-shot report with no peer
breadth.

⇒ see also: `research.review-cost-and-cache` (the measurement, the rate card, the cost drivers) ·
`rule.require.name-the-shared-prefix-as-the-cache-anchor` (the cache-rate lever's own mechanism) ·
`rule.require.exclude-review-scope-polluters` (the input-size lever's own mechanism) ·
`rule.forbid.adhoc-scope-rollups` (the specialization for an overflowed reviewer — split out
2026-10-04, after a driver mid-diagnosis read this rule as one about cost reports and hand-rolled
a scope census beside the paved locus) ·
`term=review.cost._.choice._.md` · `term=review.meter._.choice._.md` ·
`rule.require.judge-derived-counts` · `hazard.a-status-read-cannot-report-absence` (the peer
hazard: a figure that cannot state what it does not know).

worked example: `.behavior/v2026_09_20.review-cost-meter` — the route that measured all four
obligations against a shipped meter and found one satisfied.
