# seed S28 — target files first, then target diffs, then conversation

archived verbatim, before distillation (`rule.always.archive-the-wishers-words-verbatim`).

🟡 the `.said` below keeps the wisher's own word choice, per that rule — including one word this
repo's gerund hook flags. a verbatim archive is the one artifact where a word choice is not the
driver's to repair.

## .the utterance

asked after the meter reported `targetFiles` at 87.6% of a prompt and marked it
`cacheable: 🔴 no`:

> arent target files cacheable though? if we order them by last touched asc?

> so how much of the target files were actually cached / can we predict that based on cache size
> given we know the order the input prompt was set?

> like on those massive share target files

> what was the percentage of it that was indeed cached?

> also, should we adopt a different policy with target files? e.g., use a radius or enable a few
> rounds of tooluse for the reviewers, so they can choose which files to expand?

> cause it sounds like thats where we can get a big win

> also, you're really unclear, what has our actual cache hit percentage been in the latest rounds?
> and the actual sizes in the latest rounds the trend?

> ok we talked about this like 10 times

> it should be target files first, then target diffs, then conversation

> conversation is always growing
> and its the smallest set sizewise
> so lets prove this out whether this tactic improves our cachable hit rate
> but also evaluate the trends of input size and cache hits

> and fix the tools so they report those intuitively and rapidly

> and enbrief the lesson to always evaluate against these two metrics in order to decide the order
> in which those sections are appended

> capture these todos and seeds before you continue

> and especially that dream to give a few rounds of file expansion to the reviewer brains

> that way they can self progressively disclose what they review

> also catch a dream to use jev to decide which files to include

## .settled

- **the section order is `targetFiles` → `targetDiffs` → `conversation`** — a reversal of the
  shipped order, which puts `conversation` first of the three
- the reason is a **two-metric** judgment, and it generalizes: a section's place is decided by
  its **volatility** and its **size share**. `conversation` gains bytes every round (so it can
  never join a cross-round prefix) and it is the **smallest** of the three — so it costs least to
  move last and voids the most where it leads
- `targetFiles` is **not inherently uncacheable**. the `cacheable: false` flag is a property of
  its POSITION, never of the input
- the reorder is a **claim owed proof** — measured on real rounds, on both levers, never argued
- the cost tools report both levers' **trend** intuitively and rapidly, as a default
- the order judgment is **enbriefed as a rule**, not left as a one-time fix

## 🔴 .the correction this carries

the driver reported `targetFiles` as `cacheable: 🔴 no` and read that as a fact about the input.
it is a fact about the **layout** — but the driver then got the layout wrong too.

it read the order off `RANK_OF_SECTION` (`conversation`=4, `targetDiffs`=5, `targetFiles`=6) and
reported a **22:1 section inversion**. that inversion does not exist. verified against a shipped
prompt and against `compileReviewPrompt.ts`, the real wire order is
`scaffold → rules → refs → target → conversation` — **the append-only conversation is already last,
deliberately.**

⇒ **the rank table is stale with respect to the wire, and its own comment claims it is the wire
order.** that is the defect, and it silently mis-attributes the head/tail split of every census
built on it.

🔴 **the real target-side defect is an INTERLEAVE, not a swap.** each target renders as its own
`{diff, file}` pair, so a volatile diff on an early target sits ahead of every later target's stable
body. the wisher's settlement holds — files first, then diffs — and its mechanism is
**de-interleave**, never reorder-the-sections.

🟡 and the driver had reported a symptom of the same stale table twice already (a `cacheable 6.2%`
limit the realized rate beat by ~3×) and never traced it to its source.

🔴 **the driver was also asked twice for the recent trend before it produced one.** the figures it
volunteered were lifetime averages, which understated current state by 2.2×, and the round series
that answered the question sat in the tool's own json the whole time.

## .the measured trend, once produced

`5.1.execution.from_vision`, metered runs only:

| | first 5 rounds | last 5 rounds | move |
|---|---|---|---|
| mean input / run | 549k tokens | 228k tokens | −58% |
| cache hit rate | 13.7% | 44.7% | 3.3× |

## .landed in

- `.agent/repo=.this/role=any/briefs/rule.require.order-prompt-sections-by-volatility-then-size.md`
- `.dream/v2026_09_30.feat.reviewers-progressively-disclose-their-own-targets-via-tooluse.md`
- `.dream/v2026_09_30.feat.score-target-inclusion-by-jev.md`
- (open — the reorder itself, its proof, and the tool report fix)
