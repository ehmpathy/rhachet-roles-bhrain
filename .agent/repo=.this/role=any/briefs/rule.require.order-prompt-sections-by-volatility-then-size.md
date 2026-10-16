# rule.require.order-prompt-sections-by-volatility-then-size

> **a prompt's section order is DECIDED by two measured metrics per section — its
> VOLATILITY and its SIZE SHARE. stable-and-large leads; volatile-and-small trails. never
> order sections by their conceptual read order.**

the parent rule (`rule.require.name-the-shared-prefix-as-the-cache-anchor`) states the
obligation: every static byte ahead of every variable byte. this states the **procedure** —
what to measure, and how to rank on it — because the obligation alone does not say which of
two partly-stable blocks goes first.

## .why — a block's damage is set by what sits BEHIND it, never by its own size

a prompt cache serves one run of bytes from token 0, and that run **halts at the first byte
that changed**. so a volatile section placed ahead of stable mass does not cost its own
length — it costs **every byte downstream of it**.

⇒ that inverts the intuition an author brings. a small section feels cheap to place
carelessly, and a small section is exactly the one whose misplacement is most costly per
byte, because its own size never bounds the harm.

**measured here, 2026-09-30 — and the measurement corrected the first claim made from it.**

the defect found was an **interleave**, not a section swap. verified against a shipped prompt and
the composer source, the real wire order already places the append-only `conversation` (3.9%) last,
behind `target` (93.3%) — correct, and deliberately so.

but **inside** the target block, each target renders as its own `{diff, file}` pair. so a volatile
diff on an early target sits ahead of every later target's stable body, and the prefix parts there.
the fix is to **de-interleave**: one block of all stable file bodies, then one block of all volatile
diffs.

🔴 **the first read of this defect was wrong, and how it was wrong is the lesson.** the driver read
the order off `RANK_OF_SECTION` — a rank table whose own comment claims *"the order is the order the
bytes are sent"* — and reported a 22:1 section inversion that does not exist. the table is stale with
respect to the wire. ⇒ **a rank table is a claim about bytes, and only bytes settle it.** that is why
the last cue row below exists, and it was written before its own author obeyed it.

## .the two metrics, and how to rank on them

for each section, measure both — never estimate either:

| metric | what it is | how to read it |
|---|---|---|
| **volatility** | what share of the section's bytes differ from the prior round | append-only ⇒ volatility is total for prefix purposes, whatever the diff ratio says |
| **size share** | the section's share of total prompt chars | the mass at stake, once the order is right |

then: **sort by volatility ASC; break ties by size share DESC.**

volatility leads because it is what *breaks* a prefix. size breaks ties because, among two
equally stable blocks, the larger one forward buys more cached bytes before the first break.

🔴 **an append-only block sorts LAST regardless of how small it is.** growth is total
volatility at the prefix boundary: round N+1 has bytes where round N had the next section, so
the prefix ends there no matter how few bytes were added. its smallness is an argument to
place it last cheaply, never an argument that its placement is unimportant.

## 🔴 .the third metric — is the volatility INDEPENDENT, or SHARED by a class?

the two metrics above rank blocks one at a time, and that is sound only while each block's
volatility is its own. where a whole **class** of blocks draws its volatility from one external
source, a block-by-block sort is the wrong instrument: it reads each member as low-volatility
on the rounds the source held still, and the source moves them all at once.

⇒ so the question is not merely *"how volatile is this block?"* but ***"what does it share its
volatility WITH?"*** — and the answer changes the unit of the sort from the block to the class.

**measured 2026-10-01**, over a 12-target corpus with 1 file repaired per round
(`reviewPromptCacheAnatomy` `[case6]`). the two classes are file bodies and their diffs; the
diffs share a volatility source, the range base:

| layout | the diff base HELD | the diff base MOVED |
|---|---|---|
| every body, then every diff | 23,274 · 76.8% | **23,274 · 76.8%** |
| one diff per body, interleaved | **24,759 · 81.9%** | 13,170 · 43.6% |

🔴 **neither layout dominates, and the winner flips.** the interleave is ahead by 5.1pp while
the base holds, because it carries each untouched diff ahead of the point where the prefix
parts. it is behind by 33.2pp once the base moves, because one perturbed diff at the first pair
voids all 12 bodies behind it.

⇒ **the figure that settles it is the repeated one: 76.8% in BOTH columns.** the grouped layout's
prefix is bounded by the first changed body with no diff ahead of it, so diff churn cannot reach
it. that is not a bigger prefix — it is an **invariant** one.

### ⇒ so rank by EXPECTED value, and say what you assumed

a flip means neither order is right unconditionally, and a point estimate hides that. compute
the break-even and compare it to how often the source actually moves:

```
break-even p = loss_when_stable / (gain_when_moved + loss_when_stable)
             = 5.1 / (33.2 + 5.1) = 13.3%
```

`since-main` moves whenever any other PR merges, and a diff's `@@` line numbers shift whenever a
file above it changes — both far above 13%, so the grouped layout wins on expectation. **write
that arithmetic down beside the order**, because a later reader who measures only the stable
scenario will find a 5.1pp regression and "fix" it.

🟡 **a prefix that is invariant is worth a few points of mean.** a layout whose hit rate swings
43.6%↔81.9% with a base nobody controls makes every cost report a lottery and every A/B on some
other lever unreadable. the grouped layout's 76.8% is the same figure every round, which is what
makes a trend line mean aught (`rule.require.report-both-cost-levers-with-trend-and-locus`).

## .the test

> **1. for each section, what is its volatility and its size share? (measured, both)**
> **2. does any section with higher volatility sit ahead of one with lower?**
> **3. does any append-only section sit ahead of any section at all?**
> **4. 🔴 does any block share a volatility SOURCE with others of its kind? then the CLASS is
>    the unit of the sort, and the two layouts are measured under both states of that source**

a yes on 2 or 3 is the defect, and its cost is the summed size share of every block behind it.
a yes on 4 with a block-grain sort is the subtler defect: it reads correct on the rounds the
source held, and is never measured on the rounds it moved.

| when… | then… |
|---|---|
| you declare or edit a section order | 🔴 measure both metrics first. a read order is not a wire order |
| a section is **append-only** | it sorts last. its size is irrelevant to that verdict |
| a small section sits ahead of a large one | 🔴 the strongest cue. cost is what is BEHIND it, so small-and-early is the worst place to be careless |
| two sections are equally stable | the larger leads |
| you would order sections to read naturally | the reader is a cache, and it reads from byte 0 only |
| a section's volatility is unmeasured | you have no order, only a guess that compiles |
| a rank table claims to mirror the wire order | 🔴 verify it against a shipped prompt. a stale rank silently mis-attributes every census built on it |
| two kinds of block **alternate**, one per item — a diff beside its file, a header beside its row | 🔴 the class-grain cue. group each kind and sort the kinds; an alternation puts every kind's volatility ahead of every other kind's mass |
| a block's volatility comes from a **base you do not control** — a merge-base, a clock, an upstream sha | sort its whole class last and take the invariant prefix, even at a few points of mean |
| one layout wins your measurement | 🔴 measure the OTHER state of the volatility source before you ship the claim. a winner that flips is a hedge, and it must be argued as one |

## 🟡 .the boundary

| a violation | not a violation |
|---|---|
| an append-only section ahead of any stable one | an append-only section last |
| a section order set by read order or by habit | an order set by measured volatility, then size |
| a volatile section ahead of a larger stable one | a volatile section first where **all** downstream mass is equally volatile |
| a rank declared to be the wire order and never checked against one | a rank verified against a shipped prompt |

the line that parts them: **is there a swap that would lengthen the shared prefix?** yes → the
order is wrong by exactly the mass behind the misplaced block. no → it is optimal.

## .enforcement

blocker: an append-only prompt section ordered ahead of a stable one · a section order declared
with either metric unmeasured · a declared rank asserted to mirror the wire order with no test
against a shipped prompt · 🔴 two kinds of block alternated one-per-item where each kind shares a
volatility source · a layout claim shipped from ONE state of a volatility source that flips it.
nitpick: two equally stable sections ordered smaller-first · a section order with no comment
that names the metrics that set it · a hedged order with no break-even arithmetic beside it.
false positive: a volatile section first where every downstream section is equally volatile · a
one-shot prompt with no peer round to share a prefix with · an order that loses a few points of
mean to hold its prefix invariant, where the trade is stated.

⇒ see also: `rule.require.name-the-shared-prefix-as-the-cache-anchor` (the parent obligation —
this is its decision procedure) · `rule.require.report-both-cost-levers-with-trend-and-locus`
(the report that makes both metrics visible, which is what makes this rule checkable) ·
`research.review-cost-and-cache` (the measurement, and the crossover where target-first wins) ·
`getAllTargetsByCacheStability` (the same law applied WITHIN a section, to order its members) ·
`term=prompt.cache.stability._.choice._.md` · `term=prompt.cache.shared-prefix._.choice._.md`.

worked example: `.behavior/v2026_09_20.review-cost-meter` — the two measured orders, and the two
wrong claims this rule's own author made before he measured either.

🔴 **both errors were the same species: a byte claim derived from a table rather than from bytes.**
the first read a stale `RANK_OF_SECTION` as the wire order and announced a `22:1` inversion that
did not exist — the compiler had put the conversation last all along. the second read the census
shares (`targetDiffs` 5.7% against `targetFiles` 87.6%) and announced that the interleave let the
small class void the large one — true only once the range base moves, and backwards by 5.1pp while
it holds. ⇒ **the last cue row of this table caught the first and not the second**, because a
shipped prompt settles an ORDER and only a two-state measurement settles a HEDGE.
