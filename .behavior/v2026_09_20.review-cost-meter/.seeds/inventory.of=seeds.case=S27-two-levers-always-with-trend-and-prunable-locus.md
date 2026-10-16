# seed S27 — two levers, always: input size down and cache rate up, with a trend and a prunable locus

archived verbatim, before distillation (`rule.always.archive-the-wishers-words-verbatim`).

## .the utterance

asked after the meter reported a tree cache rate of 19.8% and a grove rate of 21.9%:

> hey so has this tree actually proven to save costs on reviews or increase cache hits? you
> should have skills you can use to evaluate

> in this tree, whats our cache rate?

> also, whats our input size? cause we should have depolluted input size and increased cache rate

> the reports should by default make it clear this composition on both input size vs cache rate

> cause we want to always decrease input size and increase cache rate

> so these report operations should per run, per tree, and per grove make it easy to see the trend
> of each stat

> enbrief that seed and perspective

> cause we need to know the top N directories and etc to be able to see whether we can simply
> prune irrelevant input too

## .settled

- review cost has **two** levers, and they are named together, never one at a time: **input size
  DOWN** and **cache rate UP**
- a cost report states **both, by default** — neither is a flag, neither is a breadth the other
  lacks
- all three breadths carry both: **per run, per tree, per grove**
- each stat carries its **trend**, at every breadth — a single figure is not an answer
- input size is attributed by **locus** — the top N directories, and the like — so a reader can
  see what is prunable rather than only how large the total is

## 🔴 .the question this answers

the meter could already say a prompt was 1.0M chars and 87.6% `targetFiles`. it could not say
**where** those chars came from, so it could not part mass that a lane needs from mass that a glob
swept in. a reader who wants to prune has a size and no address.

and the cache rate had the mirror defect: the tree reported one lifetime average, 19.8%, while the
recent rounds ran 48–100%. one number over a series that climbs reports as a verdict and hides the
step.

⇒ so both levers were **unactionable for opposite reasons**: the size had no locus, and the rate
had no trend.

## 🔴 .what the round measured against the claim

| the ask | what the meter did | verdict |
|---|---|---|
| composition, by default | `--of run` renders it · `--of grove` renders `by input` · **`--of tree` renders none** | a breadth gap |
| input size, by locus | no breadth renders a directory rollup; the driver hand-wrote one | absent |
| trend, per stat | `--of tree --trace` exists, opt-in, cross-tab only; run and grove have none | partial, opt-in |
| both levers side by side | cache rate is headline; input size is a char total three sections away | not paired |

the hand-written rollup that proved the gap: 113 targets, 881.3k, **100% under
`src/domain.operations/review`** — and 100% of it `.test.ts` / `.snap`. legitimate for a
`*-tests` lane, and the meter could not say so.

## .landed in

- `.agent/repo=.this/role=any/briefs/rule.require.report-both-cost-levers-with-trend-and-locus.md`
- (open — the renderer work the rule now binds)
