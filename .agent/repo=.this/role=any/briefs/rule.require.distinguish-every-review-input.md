# rule.require.distinguish-every-review-input

> **when the review prompt gains an input, that input gains a named row of its own —
> its mass, its file count, and which side of the cache seam it sat on. an input
> that ships with no row is forbidden.**

an **input** is any source a review prompt is built from: the rubric, the refs, the
prior peer dialogue, the deltas under review, the file bodies carried around them.
the row is a `PromptInputName` member in `getOnePromptComposition.ts`, and it rides
to disk in `metrics.compiled.json` on every run.

## .why — an unattributed input does not go absent. it goes into the residual

`markup` is defined as what is left when every named row is subtracted from the
prompt. so a new input with no row does not vanish from the census — it is silently
re-labelled as render overhead.

| the figure a reader sees | what it actually holds |
|---|---|
| `markup 5,400 chars 0.4%` | the headers and xml tags. true |
| `markup 812,000 chars 31.2%` | an input nobody named, wearing overhead's label |

the census stays well-formed while it lies, which is the precise shape
`rule.forbid.failhide` forbids. the percentages still sum to 100. every row still
carries a count. a reader cannot tell the second table from the first without the
source in hand — and the whole point of the artifact is to spare them that read.

and the cost is not academic. this meter exists to point at the next lever: the
`targetDiffs` / `targetFiles` split says whether the reduction sits in the delta or
in the context, and `cacheable` says whether a cut is worth 1× or 31.4×. an input
folded into `markup` is priced at neither — it is charged to a row marked
cacheable, so it reads as the cheap half however dear it truly was.

## .the three obligations, and each is owed before the input ships

| # | the obligation | where | the clamp |
|---|---|---|---|
| 1 | name it — a member of the `PromptInputName` union | `getOnePromptComposition.ts` | the union itself |
| 2 | state its seam — cacheable, or re-paid every round | `IS_CACHEABLE`, declared beside the union so silence cannot default it into the cheap half | `Record<PromptInputName, boolean>` — TS2741 |
| 3a | measure it — a row in the composition | the returned `inputs` map | `Record<PromptInputName, PromptInputWeight>` — TS2741 |
| 3b | render it — a row in the census | `SECTION_OF_INPUT` in `meter/getOnePromptSectionCharsFromCompiled.ts` | `Record<PromptInputName, keyof PromptSectionChars>` — TS2741 |

all three are compile errors, and 3b was the one that was absent. extend the union
and `tsc` names each obligation you still owe, by file and line. verified by probe:
one new member added to the union raised exactly three TS2741s, one per row.

1 without 3 is the cheap half-step, and it reads as done. the union compiles, the
type is exhaustive, and the input still contributes zero to every figure — a row
that exists and measures naught is worse than an absent one, because it looks
measured.

### .why 3b needed a clamp of its own, and a residual would not have served

the compiled artifact names every member of `PromptInputName`; the grove census
carries fewer, coarser rows (`keyof PromptSectionChars`) — the two unions are the
counts, so neither is restated here — because the coarse reader — a re-parse of the rendered prompt — cannot part the
preamble from the output contract from the markup. so the fine rows must fold.

that fold was once a hand-written list of lookups:

```ts
scaffold: at('instructions') + at('outputFormat') + at('markup'),   // wrong
```

it compiles forever. a new input is named, measured, written to disk — and then
dropped in silence on its way into the census, which under-reports while every
figure still looks whole.

and the obvious repair is the wrong one. to define `scaffold` as the residual —
`chars - (every other section row)` — keeps the sum exact while it absorbs the unmapped
input into a row labelled render overhead. that is this rule's own failure mode,
re-committed one layer down. a `Record` over the union is the honest fix: it costs
naught at runtime and refuses to compile until the new input names the row it feeds.

## .the fourth obligation — measure what was sent, never what was held

the three obligations above assume every input the composition sums actually
reached the prompt. the renderer can break that assumption, and it does so
silently.

> **a target carries a `.diff`. the renderer decides whether to send it. if the
> census sums the source array while the renderer drops a member, the census
> reports spend that never happened.**

and the residual runs the other way. `markup = chars - (every other named input)`, so a
phantom in a named row drives markup negative by that exact mass.

measured 2026-09-20, a deliberate probe against the real composition. one new
target, 400-char body, 401-char diff, the diff no longer rendered:

| the assertion | under the probe |
|---|---|
| `targetDiffs.chars === 0` | 401 — chars the prompt never carried |
| `markup.chars >= 0` | −189 — the residual absorbed the phantom |
| `summed === chars` | stayed green |

that third row is this rule's own thesis, caught live on a real defect. the rows
summed to the prompt exactly while one row over-reported by 401 and another went
negative by 189. the sum is algebra. it went green over a census that was wrong in
two places at once.

the repair is not a second measurement. it is one decision, read twice: the
predicate that decides what renders is extracted (`isTargetDiffSent`), and the
renderer and the census each call it. neither restates it, so neither can drift
from it.

the negative-markup check is the cheap detector here, and it is not the markup
bound. the bound catches an input that entered with no row (markup too high); this
catches a row that counts what never entered (markup below zero). two directions,
two assertions, one row.

## .what each clamp catches — and the one that catches naught

the sum invariant is a tautology, and must never be cited as coverage. the rows
sum to `chars` by algebra, because `markup` is the residual — that assertion holds
whatever enters the prompt, so it proves the arithmetic and proves naught about
attribution.

| the detector | what it catches | what it misses |
|---|---|---|
| `asSummed === chars`, in the composition | a row measured twice, or dropped | an unnamed input. it is absorbed |
| the declared key set ([case4]) | a union member added and then forgotten | an input that never reached the union |
| the markup bound ([case1], fired in [case5]) | an input that entered with no row | overhead that genuinely grew |
| `summed === chars`, in the fold ([case3]) | a named input dropped on its way into the census | an input that never reached the union |

the bound is the load-bearing one, and it is the one an author is least likely to
reach for, since the sum reads like the stronger guarantee. [case5] exists to fire
it on purpose: 5,000 rendered chars fed by no array, sum still green, bound red.

### one assertion, a tautology in one layer and a real detector in the other

| where | `markup` / `scaffold` is | so the sum is |
|---|---|---|
| the composition | the residual — `chars` minus every other named input | a tautology. it holds whatever enters |
| the fold | a sum of three named rows | a real check. an unmapped row makes it disagree |

do not carry a verdict about one layer into the other. the identical line of code
proves naught upstream and carries the weight downstream, and which one you read
turns entirely on whether the catch-all row was computed by subtraction.

## .the test

> **1. "what source array does this block of the prompt come from?"**
> **2. "which row of `metrics.compiled.json` will its chars land in?"**

`markup`, and it is not a header or a tag → the row is owed. name it.
a row of its own → state its seam, measure it, render it.

| when… | then… |
|---|---|
| you add a block to the compiled prompt | the strongest cue. the row is owed in the same change, never after |
| a new input resembles one already named | resemblance is not identity. `targetDiffs` and `targetFiles` come from one array and are two rows, because the lever differs |
| you would fold a small input into a neighbour | small today. the row costs one line; the re-derivation costs a corpus read |
| you add a union member and ship | half-done. it measures zero until step 3 |
| an input's seam is unclear | that doubt IS the finder of the fact. state the answer in `IS_CACHEABLE`, where a reader can dispute it |
| `markup` climbs above a few percent in a real census | read it as an unattributed input until proven overhead |
| you cite the sum invariant as proof of coverage | it is algebra in the composition. reach for the bound. in the fold it is a real check — do not confuse the two |
| you fold fine rows into a coarse row for a peer reader | fold through a `Record` over the union, never a list of lookups. a list compiles while it drops the newest input |
| you would make the catch-all row a residual, so the sum stays exact | the sharpest cue in this rule. an exact sum that absorbs an unmapped input is the defect, not the proof |
| you change WHICH inputs the renderer sends | the census must change in the same edit. extract the predicate, call it from both — never write the condition twice |
| you sum a source array to measure a row | ask whether the renderer sends every member of it. if not, the row over-reports and `markup` goes negative |
| a `markup` share reads below zero | a named row counts what the prompt never carried. the sum will not tell you — it holds by algebra either way |

## .the boundary

| a violation | not a violation |
|---|---|
| a rendered prompt block with no `PromptInputName` row | a block of pure markup — a header, a tag, a separator |
| a union member with no measurement, so its row reads zero | a named input that is genuinely empty on a given run (`refs: []`) |
| a new input folded into a neighbour's row for tidiness | two inputs from one source array, split into two rows |
| a seam left undeclared, so it defaults cacheable | a seam declared and later disputed with evidence |

the line that parts them: does a reader of the census learn what this input cost?
yes → the row holds. no → the row is owed, however small the input.

## .enforcement

blocker: a review prompt input rendered with no row of its own · a union member added
with no measurement · an input folded into a neighbour's row · a seam left to default
by silence · the composition's sum invariant cited as evidence of coverage · a
fine→coarse fold written as a list of lookups where a `Record` over the union would
clamp it · a catch-all census row computed as a residual, so an unmapped input is
absorbed with the sum still exact · a row measured off a source array the renderer
does not send in full · the render condition written twice, once in the renderer and
once in the census.
nitpick: a named and measured input absent from the rendered census order.
false positive: a genuinely empty named input · chars that are truly render overhead ·
a sum assertion over rows that are each named — there the sum is a real detector.

see also: `getOnePromptComposition.ts` (the union and the seam map — the contract
this rule governs) · `getOnePromptComposition.test.ts` [case4] and [case5] (the two
clamps, and the proof the bound bites) · `rule.require.clamp-edge-cases`
(ehmpathy/mechanic — why [case5] had to fire before the bound could be trusted) ·
`rule.forbid.failhide` (ehmpathy/mechanic — the shape a well-formed lie takes) ·
`rule.require.name-the-shared-prefix-as-the-cache-anchor` (why the seam is the axis
that prices a cut) · `research.review-cost-and-cache` (the rate card the seam sorts on).
