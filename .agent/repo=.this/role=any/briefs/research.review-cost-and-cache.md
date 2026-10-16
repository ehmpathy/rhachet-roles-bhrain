# research.review-cost-and-cache

## .what

what one L1 peer review costs, and why it costs that. two answers, each traced to a code path
or to a measured byte offset. no figure here is an estimate unless the line says so.

## .the instrument

`rhx review._.cost --of tree` (`src/contract/cli/review._.cost.ts`) reports the spend per
reviewer, per round, per stone, over the log corpus `rhx review` already writes. it reads
`metrics.realized.json` only — never `metrics.expected.json` — so no estimate can enter a
reported figure.

it grades each run, and the grade decides whether a figure may be printed at all:

| grade | the artifacts | what the meter prints |
|---|---|---|
| `metered` | `metrics.realized.json` present | the measured tokens and spend |
| `refused` | no metrics and no prompt — the run died at validation before any brain call | `0 prompt · $0` — nil is a fact here |
| `unknown` | no metrics but a prompt was compiled — the brain may have been billed | `— prompt · —`, plus a caveat beside every total it falls inside |

the law runs both ways. an unrecorded spend never renders as `$0.00`, and a known-nil never
renders as `—`. a meter that collapsed the two would report a number nobody measured in one
direction and discard a number it had in the other.

### the law is declared once

`getOneAccountedCost` (`src/domain.operations/review/meter/getOneAccountedCost.ts`) is the one
place the grade decides whether a spend may be printed. both the per-tree meter and the grove
mine call it. earlier, the grove rollup summed over metered runs and fell back to `USD 0` when
it found none — so a lane whose every run was `unknown` rendered as a measured `$0.00`, while
the per-tree meter, over the identical corpus, correctly answered absent. the acceptance test
found it on its first run.

the fix moved no real figure: every rollup row in the live corpus holds at least one accounted
run, so the grove total over the corpus live at the fix stayed `$151.85` — a later and larger
corpus than the 2026-09-20 walk below, whose 3,594 runs measured `$150.21`. that is what made it dangerous — the defect was
invisible in the output a human reads, and would have surfaced only on the day a whole lane went
dark, which is exactly the day the figure matters most.

this is the second time one law here grew two expressions that disagreed. the first was
`asBillableTokens`, where the rollup sorted on `input + cacheSet + output` while the renderer
displayed `input + cacheSet`, so a 27M row rendered above a 33.9M row and read as a broken sort.
both are now declared once and exported. two expressions of one quantity can disagree; one
cannot.

the cache anatomy below is produced by a second, named instrument:
`src/domain.operations/review/meter/getOneSharedPrefixByteCount.ts`, exercised over prompts built by
the real compiler in `reviewPromptCacheAnatomy.test.ts`. the offsets are snapped, so prose and
compiler cannot drift apart.

## .the rate card — why answer 1 is worth more than answer 2

the rate card of the deepseek flash brain every figure in this brief was measured on, served by
a since-retired provider. the default is now the versionless openrouter tier
`openrouter/deepseek/flash` (`BRAIN_DEFAULT_OF_REVIEW`) — a different rate card, so re-derive a
figure before you apply it to a later run. rhachet looks a brain up by exact slug, and the
openrouter sdk registers the tier slug as is, so `reviewDefaultBrains.test.ts` holds that the
default is registered:

| token | $/1M | vs uncached input |
|---|---|---|
| input | `$0.22` | 1× |
| cache.get | `$0.007` | 31.4× cheaper |
| output | `$0.66` | 3× dearer |
| cache.set | `$0` | free |

a cache hit removes 96.8% of a prompt token's price. the review ladder is almost all prompt, so
the cache is the largest single lever on the bill.

## .answer 1 — why the cache hit rate was so low

four causes, ranked by what each cost. #1 alone was sufficient to hold the rate at ~0.

| # | cause | class | the proof | what it cost | state |
|---|---|---|---|---|---|
| 1 | the replica pin is never sent | replica | code chain, 6 hops | every request may land on a cold replica | repaired |
| 2 | a conditional instruction sits upstream of the whole rubric | order | byte 534 vs byte 3,442 | 96.7% of round 2's prompt | repaired |
| 3 | the static tail sits below the variable target | order | byte 14,332 vs byte 13,068 | ~1.7kb per review, on every review ever run | repaired |
| 4 | nine lanes share one target corpus but carry divergent rubrics | order | measured divergence at `## rules` | the corpus is re-paid once per lane, per round | inherent |

each cause below states what was measured and how it was repaired. the diagnosis is kept
because the repair is only checkable against it — the clamps in
`reviewPromptCacheAnatomy.test.ts` assert the inverse of each figure here, and every one of them
was red against the prior layout.

cause 4 is inherent to the fan-out, not a defect: nine lanes carry nine rubrics by design. what
the repair does buy it is a longer common head — see cause 3.

### cause 1 — the review never sends the replica pin

the provider measured here held its prompt cache per replica, and serverless hands each call to
an arbitrary one. its brain adapter shipped the remedy — a replica-affinity pin derived from the
system prompt, since the cache works within one replica only and a multi-replica deployment must
be told where the traffic should go.

that pin was suppressed for every `rhx review` call. the chain, end to end:

| hop | where | what happens |
|---|---|---|
| 1 | `src/domain.operations/review/stepReview.ts:885` | `ask({ role: { briefs: [] }, ... })` — the briefs array is empty |
| 2 | `rhachet/.../castBriefsToPrompt.js` | `[].map(...)` then `.join('\n\n')` → `''` |
| 3 | the adapter's atom | `askInput.role.briefs ? await castBriefsToPrompt(...) : undefined` → `''` |
| 4 | the adapter's atom | `if (systemPrompt)` — `''` is falsy → no system message is pushed |
| 5 | the adapter's affinity key | `if (!input.systemPrompt) return null` |
| 6 | the adapter's request | no affinity key → no pin |

the defect is a premise mismatch, not a bug in either half. the adapter's own note states its
assumption plainly: with no briefs there is no prefix worth a pin, so a constant key would
funnel brief-less traffic onto one replica for no gain. that argument is sound for a caller
whose shared prefix lives in the system prompt.

`rhx review` is not that caller. it puts its entire shared prefix — the rubric, the
instructions, the goal block — in the user message, and hands `briefs: []`. so the adapter reads
"no shared prefix" from a request that is ~97% shared prefix, and withholds the pin.

the fix named itself: hand the static head to `ask` as briefs. that one change earns both
halves at once — the static block becomes a system message (so it leads the message array,
which is the order a prefix cache serves from) and it gives the affinity pin a key to derive.

shipped. `stepReview.ts` now writes `promptHeadStatic` to `input.prompt.head.md`, hands that
artifact as the lone brief, and sends `promptTailVariable` as the prompt. the wire bytes are
unchanged — `compileReviewPrompt` returns both halves and `head + tail === prompt`, clamped in
`reviewPromptCacheAnatomy.test.ts` case4.

### cause 2 — a conditional clause sat upstream of the whole rubric

measured over prompts built by `compileReviewPrompt`, snapped in
`__snapshots__/reviewPromptCacheAnatomy.test.ts.snap`.

the defect. `compileReviewPrompt` appended instruction item 7 to the `## CRITICAL INSTRUCTIONS`
block only when a conversation was present — and that block sits above `## rules`. every
guarded lane takes `--conversation $conversation`, and a conversation first exists at round 2.
so the very round the cache would first pay off, the prompt diverged at byte 534 — before
`## rules` at byte 3,442 — and voided the largest static block on offer: the whole rubric, the
goal block, the diff instructions.

the repair. every instruction item is now unconditional and reads correctly whether or not its
section is present ("if a `<refs>` section appears below…"). no clause ahead of the rubric can
differ between rounds.

### cause 3 — the grove-static boilerplate sat below the variable target

`## output format` is byte-identical on every review the grove has ever run — 1,704 bytes of
it. it sat at byte 14,332, below `## target` at 13,068, so a prefix cache could never reach it
and it was re-paid at full input rate on every single review.

the repair. it is hoisted above `## rules`, which puts it inside the block every lane shares —
so it now sits in the cross-lane prefix, not merely the per-lane one. that is the only relief
cause 4 can get.

### the layout, across three states

there are three states here, not two — the head repair (causes 1–3) and the tail flip (answer
2, `target` before `conversation`) landed separately, so this is a column per state, named by
the change that produced it. a before/after table silently expires the moment a third state
arrives, since both its columns stay individually true.

section offsets in one compiled round-2 prompt:

| section | before the repair | after the head repair | after the tail flip (live) |
|---|---|---|---|
| `## output format` | 14,332 | 3,612 | 3,612 |
| `## rules` | 3,442 | 5,283 | 5,283 |
| `## target` | 13,068 | 15,269 | 13,020 |
| `## prior conversation` | 11,179 | 13,020 | 14,284 |
| total bytes (round 2) | 16,036 | 16,568 | 16,753 |

the last two columns are the flip, read off the page: `target` and `conversation` trade places,
and whichever block leads sits at 13,020.

prefix survival between adjacent rounds of one lane:

| transition | before the repair | after the head repair | after the tail flip (live) |
|---|---|---|---|
| round 1 → round 2 | 534 bytes, 3.3% | 13,057 bytes, 78.8% | 13,207 bytes, 78.8% |
| round 2 → round 3 | 13,255 bytes, 82.7% | 15,288 bytes, 81.9% | 13,207 bytes, 70.1% |

24× on the transition that mattered most — round 1 → round 2 is the first round a cache could
ever pay off, and it was the one round the layout broke.

the flip regressed the second transition here, 81.9% → 70.1%. that is no defect in the flip; it
is the crossover, measured. this fixture revises its one target every round, so target-first
puts the changed bytes at the front and the prefix halts at 13,207 on both transitions alike.
the 12-target fixture (`case5`) is the other side: 50.7% → 81.8%.

target-first wins iff the unchanged target mass exceeds the accumulated conversation. one
fixture cannot settle which case a real lane is, which is why the flip ships against an open
dream rather than a closed argument
(`.dream/v2026_09_19.feat.the-tail-order-trades-31pp-of-cache-for-target-recency.md`).

### where the prefix stops — and how the flip moved that place

the two transitions were never the same measurement, and the place each one stops is what
answer 2 was aimed at. the mechanism inverted when the flip landed, so both states are named:

| transition | under the head repair (conversation leads) | under the tail flip (target leads, live) |
|---|---|---|
| 1 → 2 | the static head only — round 1 has no `## prior conversation` block at all, so there is no conversation to share. stops at the head's end, byte 13,057 | stops inside the target, byte 13,207 |
| 2 → 3 | the head plus round 1's conversation, which round 3 still carries verbatim. stops inside the conversation, byte 15,288 | stops inside the target, byte 13,207 |

the conversation grows append-only and oldest-first — `enumFilesFromGlob` sorts
lexicographically, `i001 < i002`, and `given` precedes `taken` alphabetically, which here is
also chronological. so round N's conversation is a byte-prefix of round N+1's, and where the
conversation leads, the prefix runs through every exchange the two rounds share before it parts
at the new one.

under the head repair, the target was never inside the shared prefix once a conversation
existed. round 2 spent its post-head bytes on its target; round 3 spent them on round 2's
conversation, so they diverged before either target was reached — the target was re-paid in
full, every round, forever. that was the limit answer 2 attacked, and the flip removed it: the
prefix now reaches past `## target` in both transitions, and the conversation is what sits
below.

the cost of that, on this fixture, is that 2 → 3 fell from 15,288 to 13,207 bytes. the target
leads and this fixture revises its target every round, so the prefix halts early and
identically on both transitions. the gain is on corpora where most targets hold still — see the
crossover above.

the price, read off the `total bytes` row above: the prompt grew 532 bytes under the head repair,
where items 6 and 7 became always present, and a further 185 under the flip, for the static
closer that buys back target recency. that is the whole price: 717 bytes against 12,523 rescued
from outside the prefix.

### cause 4 — nine lanes cannot share one another's prefix

measured: two lanes given an identical target corpus and divergent rubrics share only the head
above `## rules`, diverge there, and reconverge never.

the guard binds 9 L1 lanes that read the same target corpus and carry different rubrics (9 is
ONE stone's L1 fan-out, read off the guard below; the grove-wide count of distinct lanes is 11,
see lever F — two scopes, never one count that drifted), and
the rubric must sit above the target — a reviewer cannot grade against a rubric it has not yet
read. the identical target corpus — the expensive half under push focus — is paid at full input
rate once per lane, every round.

this one is inherent, not a defect. nine rubrics is what nine lanes means. the only lever is to
make the block they DO share as long as possible, which is what cause 3's repair does: the
`## output format` block moved from outside every lane's prefix to inside all nine. clamped in
`reviewPromptCacheAnatomy.test.ts` case2 `[t0]`.

the larger lever on cause 4 is not the layout at all — it is the target corpus size, which is
answer 2's subject.

## .answer 2 — why a review is expensive at all

the split, read from the guard that binds them
(`.behavior/v2026_09_08.feat-dispute-or-concede-review-budget/5.1.execution.from_vision.guard`):

| driver | what it is | what it multiplies |
|---|---|---|
| fan-out | 9 L1 lanes on one stone | ×9 |
| budget | 5,5,5,3,3,3,3,5,7 | up to 39 runs for ONE stone |
| focus | `--focus` defaults to `push` (`review.ts:244`) and no lane overrides it | full file content, not paths |
| scope | `--diffs since-main` with zero commits on the branch | unions the whole staged+untracked set (~293 files) |
| refs | 5 of 9 lanes add `--refs` globs on top of the target | whole brief directories, per run |
| conversation | every lane takes `--conversation $conversation` | grows every round, monotonically — and, until lever K, by lanes × rounds: each lane read every lane's dialogue |
| rounds | a rejected lane re-reads the whole corpus | the corpus is re-paid, not diffed |

the recorded consequence sits in the guard's own comments: four context-window overflows on
this one ladder — 75.8%, 75.8%, 76.6%, and 75.7% (the last ~757k of the 1M-token window the
guard measures against). an
overflowed lane returns no verdict, so that spend bought naught.

### where the money sits

prompt-side, by roughly two orders of magnitude. output is priced 3× the input rate, but a
review's output is a verdict of a few thousand tokens against a prompt of hundreds of
thousands. the cache lever (answer 1) acts on ~all of the bill; the output rate acts on ~none of
it.

the meter reports `input` / `cache.set` / `cache.get` / `output` disjointly, so the split is
read per run rather than asserted here.

### the number that compounds

```
39 runs  ×  ~757k prompt tokens  ×  $0.22/1M  ≈  $6.50
```

that line is arithmetic over a measured token count and a published rate, not a metered figure.
it is offered for scale only; `rhx review._.cost --of tree` reports the metered figure wherever
the logs are. one stone. one ladder. prompt-side alone. uncached.

at the cache rate the same repeated prefix costs `$0.007/1M` — the shared portion drops ~97%.

## .what the logs can answer, and what they cannot

### they DO record the cache

`stepReview.ts` already writes `tokens.inputCacheCreation` and `tokens.inputCacheRead` into
`metrics.realized.json`. the cache hit rate is measurable today, with no new field. the meter
reads exactly those.

### what they cannot answer

| gap | why | state |
|---|---|---|
| how much a cache COULD have served | a hit rate alone cannot part a cold replica from a prompt with little to share | closed. `metrics.compiled.json` carries `prompt.chars`, `prompt.cacheable` (the prefix a cache could serve), and the full `inputs` composition; `metrics.realized.json` holds the tokens and cost alone, and names its compiled peer. a large prefix beside a low rate points at the pin; a small one points at the layout |
| which replica served a request | no artifact records a replica id, and none can: the vendor returns none | open, and not ours to close. only the vendor can prove a pin was honored |
| what a cache WRITE cost | structurally absent, not omitted. the deepseek line fills its cache as a side effect of the read path and bills no write, and the rate card prices `set` at `$0` | not a gap. a `cache.set: 0` is not a defect signal for this brain |
| the grove's actual dollars | `.log/bhrain/review/` is git-ignored ephemera, local to the machine that ran the review. no corpus exists in this tree | run `rhx review._.cost --of tree --at <tree>` where the reviews ran |

the meter is proven against fixture corpora that hold all three run grades
(`getAllReviewRunMeters.integration.test.ts`), so its arithmetic is verified independent of any
one machine's logs.

## .the fix, shipped

| # | the change | where | clamped by |
|---|---|---|---|
| 1 | the static head rides as a brief, so a system message exists and the affinity pin gets a key | `stepReview.ts` | `reviewPromptCacheAnatomy` case4 |
| 2 | every instruction item is unconditional, so no clause ahead of the rubric can differ | `compileReviewPrompt.ts` | `reviewPromptCacheAnatomy` case1 `[t0]` |
| 3 | `## output format` hoisted above `## rules`, into the block all nine lanes share | `compileReviewPrompt.ts` | `reviewPromptCacheAnatomy` case2 `[t0]`, case3 |
| 4 | `metrics.compiled.json` records the cacheable/per-round split and the full section composition | `stepReview.ts`, `getOnePromptComposition.ts` | `getOnePromptComposition.test.ts` |
| 5 | targets are ordered least-recently-touched first, so the tail's break lands late | `getAllTargetsByCacheStability.ts` | its own 9-case suite |

#5 pays on every lane. the target leads the tail (lever B), so it is the first variable block
whether or not a lane binds `--conversation`, and the two prompts reach it before they diverge.
the order then decides how far into the target the shared prefix runs: the stable N−1 targets
sit ahead of the one the driver repaired, and the break lands at that one.

every clamp was red against the prior layout, so the teeth are proven in the failed direction
(`rule.require.clamp-edge-cases`).

### #5 — the target order, and why it is not arbitrary

within the target corpus the prefix ends at the first file whose bytes or position changed, and
which file that is depends entirely on the order:

| order | where the break lands |
|---|---|
| alphabetical | at the edited file's alphabetical position — uncorrelated with whether it was edited, so the break is uniform over the corpus and its expected position is the middle |
| by stability | a file the driver edits becomes the newest, so it sorts to the end. repair has temporal locality — a driver repairs what the reviewers flagged, and the reviewers re-flag what was just repaired — so the files that move are already near the tail, and the break lands late |

same break mechanism, later expected break position. and the sort is stable under the edit
operation, which is the property that matters and is easy to lose: edit a tail file and the
order does not move at all. only an edit to a file in the stable head reorders its peers, and
that is the case this order exists to make rare.

ties break on path, so a fresh clone — where every mtime is the checkout stamp — still yields
one deterministic order rather than whatever order the filesystem enumerated.

## .the two-round measurement — a lever moved a figure, on a live grove

> measured 2026-09-24 · `rhachet-roles-bhrain` @ `beav/feat-review-cost-meter` · stone
> `5.1.execution.from_vision`, rounds i001 → i002 · instrument: `rhx review._.cost --of tree
> --trace`

every figure above this line is either a byte clamp or a single-run probe. neither can answer
the question the whole cache argument rests on: does a second round, on a real guard, against a
live brain, actually cache more than the first? a byte clamp cannot, because it measures the
prompt and never the provider. a single-run probe cannot, because a rate needs two rounds to
have a step. this is the first measurement here that differences two rounds of one stone, with
a driver's repairs between them.

### the round marginal — near-identical prompt mass, 28.7% less spend

| round | runs | prompt | cached | cost |
|---|---|---|---|---|
| i001 | 18 | 9.1M | 0.0% | $2.099072360 |
| i002 | 17 | 9.0M | 28.5% | $1.497197412 |

the prompt mass is the control that makes this readable: 9.1M vs 9.0M is within 1%, so the
$0.60 is a cache effect and not a smaller corpus. a share alone could not have shown that — a
change that raises share while it grows the prompt raises the bill and still reads as a win.

### the per-lane step — 6 of 9 lanes moved, 3 did not

| lane | i001 | i002 |
|---|---|---|
| `arch-hazards-behavior` | 0.0% | 39.1% |
| `arch-hazards-maintenance` | 0.0% | 39.1% |
| `arch-smell-scopeleaks` | 0.0% | 39.2% |
| `behavior-intent-coverage` | 0.0% | 39.5% |
| `ergo-friction-hazards` | 0.0% | 39.1% |
| `mech-failhides` | 0.0% | 39.0% |
| `arch-opport-decomposition` | 0.0% | 0.0% |
| `repo-rules` | 0.0% | 0.0% |
| `mech-decode-friction` | 0.0% | 0.0% |

the six that moved land within 0.5pp of each other, which is what a shared-prefix effect looks
like: they bind the same corpus and differ only in rubric, so the prefix each recovers is the
same fraction of the same targets.

the three that did not are the honest half, and they are not noise. each is marked "warm and
cached naught" by the instrument — a prior run existed for that lane, so a cache existed, and
the request did not reach it. `arch-opport-decomposition` reads 0.0% across all five of its runs
on this tree.

that is the clock defect, not a layout defect. a lane whose rounds are spread past the ttl meets
an evicted prefix however perfect its bytes — which a separate eviction measurement found
independently, and the reason a warmer was tried at all. a layout lever cannot repair a lane that
simply arrives too late.

### the warmer's own poke, measured

| lane | runs | prompt | cached |
|---|---|---|---|
| `dogfood-warmer` | 1 | 3.5k | 100.0% |

a poke is an ordinary completion that hits, and it hit in full. that is the LRU premise stated
as a measurement rather than a citation: a read refreshes residency, so a poke is worth what it
claims to be worth.

### what this measurement does NOT establish

- it is one stone on one tree, not a grove-wide realized rate. the grove figure is still owed
- the three cold lanes are diagnosed, not repaired — the warmer was the lever aimed at them, and
  on real guard rounds it repaired none, because its window closed before the next round (below).
  the lever left is a shorter pause between rounds
- `cache.set: 0` throughout: every brain metered here bills cache writes at nil while it serves
  real reads, so the write term is a measured zero rather than an absent one

### the warmer on real guard rounds — it did NOT pay for itself

measured 2026-09-26 on `rhachet-roles-bhrain` @ `beav/feat-review-cost-meter`, via the warmer
section of `rhx review._.cost --of tree` (`getOneWarmerValue`):

| figure | value |
|---|---|
| poke spend | $1.74 over 181 pokes, 128 hit — a floor: a ledger faulted |
| reviews that followed a warmed run | 37 |
| amount their cache saved | $0.00 — every one read 0.0% from cache |
| net | -$1.74, verdict "loss" in all nine live lanes |

the loss is certain, never a sample artefact. the amount saved is an upper bound on what a
warmer bought, and even that bound is zero.

re-measured 2026-09-27 over 22 lanes: pokes cost **$3.68**; the 94 reviews that followed a warmed
run saved **at most $1.40** — an upper bound that credits the warmer with every cache read, even
the pin's. net **-$2.28**, a loss on 18 of 22 lanes. so the warmer was retired 2026-10-14 — its
code, flag, and terms archived at `.behavior/v2026_09_20.review-cost-meter/archive/warmer/`.

the pokes hit and the reviews did not, and the cause is the clock, not the prefix. the poke
ledgers settle it: a poke after the first reads 94.9% of its prompt back, so the prefix and the
pin both hold. what fails is the window. a warmer retires at +45m; the next guard round arrived
1h29m and 3h05m after the round that spawned it, and the decay census measures reach at zero
past 66m. in both gaps the ledgers were read for, the follower landed on a cache the warmer had
already let go. the other 35 were never timed one by one.

a byte diff or a pin mismatch would also read 0.0%, so the cost figure alone cannot rule them
out. the ledger read does: a mismatched poke would not hit its own prefix at 94.9%. a window
wide enough to span a guard cadence of 1h–3h costs a poke each ~45m of every pause, which is the
spend the measurement already showed to exceed the save. the poke survives in one place it pays:
a prime, sent once before a pour of partitions (`rule.require.prime-the-shared-prefix-before-a-pour`).

## .the corpus study — rules vs diffs vs files, over 67 trees

> a dated record. it cannot be re-run. the instrument below — `rhx review.corpus` — was deleted
> 2026-09-21, because it estimated the prompt from declared guard globs where the renderer
> decides what is actually sent, so its figures drifted the moment a lever changed the renderer.
> the study stands as the evidence that justified `isTargetDiffSent`; the tool does not stand.
>
> the verdict, with its argument: `.behavior/v2026_09_20.review-cost-meter/.fulcrums/inventory.of=fulcrums.case=F3-review-corpus-estimates-a-prompt-we-no-longer-send.md`
> what measures composition today: `metrics.compiled.json`, written per real run by
> `setInputArtifacts` — the rendered prompt rather than a projection of it.

a hit rate says how much of a prompt repeated. it cannot say what the rest was made of, so it
cannot name the next lever. the corpus study answered that: it read every `.behavior/**/*.guard`
the repo declared, expanded each lane's own binds, and reported the char budget per section.

measured 2026-09-19 over this tree: 67 trees, 648 peer lanes — every guarded review session the
repo had ever declared, against a live diff of 40 files.

| section | chars | share | cacheable? |
|---|---|---|---|
| rules | 5,606.3k | 2.5% | yes |
| refs | 13,074.9k | 5.9% | yes |
| diffs | 86,815.8k | 38.9% | re-paid each round |
| files | 117,456.2k | 52.7% | re-paid each round |

the rubric is 8.4% of the bill. the subject is 91.6%. every cache repair above acts on the
8.4%; the rest is untouched.

three corrections the first run of this study needed, each of which inflated it by orders of
magnitude, and each now clamped:

| the miss | what it did | the clamp |
|---|---|---|
| read `--paths-with` as the subject | reported `src/**` — the whole repo — for every lane, and totalled 3.7 billion chars | every lane must bind a range (`bind.rangeOfDiffs !== null`) |
| dropped `--paths-wout` | counted a test corpus 7 of 9 lanes explicitly exclude | the exclusions are applied per lane |
| dropped `--join intersect` | unioned where the lane intersects | no lane may report more targets than the diff holds |

### the finding — 27.2% of every prompt is a file sent twice

`renderPushTarget` sends a `<target.diff>` block and a `<target.file>` block for every target.
split by how each file changed:

| change kind | diff chars | body chars | the relation |
|---|---|---|---|
| new | 60,709.8k | 56,302.8k | the diff is the whole body with `+` prefixes — it is larger than the body it duplicates |
| edited | 26,106.0k | 61,153.3k | a real delta, 43% of its context |

for an edited file the pair is right: a few hunks plus the context they sit in. for a new file
the diff carries no information the body lacks, and the `+` prefix per line plus the hunk
headers make it cost more than the thing it repeats.

60,709.8k chars — 27.2% of every review prompt in this repo — is a new file transmitted twice.

the same finding reads 39.7% at the per-prompt denominator, and both figures are on record
because each answers a different question:

| the figure | the denominator | what it answers |
|---|---|---|
| 27.2% | all 648 lanes' chars, new + edited together | "what share of the whole corpus is this waste?" |
| 39.7% — `792.7k` redundant | one prompt's chars, against the live 40-file diff | "what share of the prompt I am about to send?" |

the second is the one that justified the lever, because a lever acts on one prompt at a time.
it is quoted verbatim in `F3`, from the last run of the tool before it was deleted:

```
├─ new:    diff   792.7k  body   743.3k  ← the diff IS the body
└─ redundant: 792.7k  (39.7% of every prompt)
```

and the true figure today is ~0%, because `isTargetDiffSent` shipped: `renderPushTarget` drops
a new file's diff and sends the body alone. that is what makes these numbers a record rather
than a reading — they describe a prompt this repo no longer sends.

## .the grove mine — where the tokens actually went, on this machine

the corpus study measures declared scope: what a lane would load if it ran. this measures
realized spend: what the grove actually paid. `rhx review._.cost --of grove` walks every
worktree on the machine and reads each run's `metrics.realized.json`.

```sh
rhx review._.cost --of grove --limit 20
```

walked 2026-09-20 — 20 trees, 19 with review logs, 3,594 runs:

| grade | runs | share | what it means |
|---|---|---|---|
| `metered` | 2,560 | 71.2% | metrics present; every figure below is built from these alone |
| `refused` | 952 | 26.5% | died at validation before the brain — nil spend is a fact |
| `unknown` | 82 | 2.3% | a prompt compiled, no metrics — spend unrecorded, never zero |

| axis | tokens | share of read |
|---|---|---|
| input | 773,082,258 | 96.8%, at full rate |
| cache.set | 3,159,093 | 0.4%, free |
| cache.get | 22,469,890 | 2.8%, at 1/31.4 the price |
| output | 20,163,873 | — |

total measured spend: $150.21, over this walk's corpus. the `$151.85` cited under `.the law is
declared once` is the same grove read later, after more runs had landed.

### the lab diagnosis holds against production

the anatomy test measured a ~97% shared prefix that cached 0.0%, and named the cause: no system
prompt, so no affinity key, so no replica pin. the grove's realized rate is 2.8% over 2,560
runs. that is the same defect, at scale, in money. the repair measured 3.3% → 78.8% in the lab;
the grove has not yet run under it.

### the behavior routes, ranked

| route | billable | runs |
|---|---|---|
| `.behavior/v2026_09_09.feat-prescribed-brain-per-stone` | 176,295,212 | 306 |
| `.behavior/v2026_09_08.feat-require-commit-sponsor` | 106,408,300 | 210 |
| `.behavior/v2026_09_09.fix-hook-fork-storm` | 75,933,818 | 152 |
| `.behavior/v2026_09_03.feat-absorb-handler-invoke-test-util` | 51,878,347 | 127 |
| `.behavior/v2026_09_04.feat-telepath-role` | 46,850,223 | 98 |
| (no route — a hand or `review.by` run) | 27,315,187 | 1,759 |

the route is recovered from the `--output` path, which the guard writes under
`<route>/.reviews/peer/`. it survives nowhere else in the log corpus — the log dir name carries
only a clock, a pid, and a uuid.

1,759 runs — nearly half of all runs — carry no route at all. those are hand `rhx review` and
`review.by` calls. they are only 3.5% of billable mass, so they are cheap per run, but they are
unattributable: no route, no stone, no lane. a spend this instrument cannot aim a cut at.

### one stone is two thirds of the bill

| stone | billable | share | runs |
|---|---|---|---|
| `5.1.execution.from_vision` | 515,203,916 | 66.6% | 903 |
| `1.vision` | 121,647,625 | 15.7% | 593 |
| `5.3.verification` | 78,157,597 | 10.1% | 195 |
| `3.3.1.blueprint.product` | 33,917,026 | 4.4% | 144 |
| (no guard identity) | 27,315,187 | 3.5% | 1,759 |

a cut aimed anywhere but `5.1.execution` is aimed at a third of the problem.

### the reviewer axis is flat — and that is what it tells us

| lane | billable | runs |
|---|---|---|
| `repo-rules` | 67,572,676 | 122 |
| `arch-hazards-behavior` | 62,550,052 | 117 |
| `arch-hazards-maintenance` | 61,066,249 | 114 |
| `arch-smell-scopeleaks` | 60,628,060 | 114 |
| `mech-decode-friction` | 60,587,312 | 116 |
| `arch-opport-decomposition` | 60,160,609 | 115 |
| `mech-failhides` | 58,539,452 | 112 |
| `ergo-friction-hazards` | 57,155,019 | 102 |
| (three more lanes, each 47M–57M) | the rest of the ~660M | — |

the table shows the top eight of eleven, with the remainder counted — not named — in its last
row: the three slugs fall outside the top-eight cut the measurement kept. eleven is the
GROVE's count of distinct lane slugs, over every guard and stone it mined — wider than the 9 L1
lanes one stone binds (cause 4), since the guards it mined do not all bind one lane set. eleven lanes sit between 47M and 68M on ~110 runs each — within 30% of one another. that
flatness is no coincidence: each lane reads the same subject corpus and differs only in its
rubric, which the corpus study measured at 8.4% of a prompt. ~660M of the grove's 773M billable
tokens is one corpus, re-read eleven times. lever F now has a number, and it is the largest one
in this brief.

### cost and tokens disagree by 6x — the brain is a lever of its own

`(no guard identity)` spent $24.79 on 27.3M billable; `3.3.1.blueprint.product` spent $4.94 on
33.9M — more tokens, one fifth the cost. the ratio is not prompt shape at all; it is which brain
the lane was pointed at. a rate card spread that wide makes brain choice comparable in magnitude
to every prompt lever here, and no prompt work touches it.

## .the levers, enumerated

ranked by measured mass, not by ease. each names what it would save and what it would cost.

| # | the lever | what it saves | what it risks | state |
|---|---|---|---|---|
| A | drop the `<target.diff>` for `changeKind: 'new'` | 27.2% of every prompt, removed outright | the reviewer loses the `@@` hunk headers it is told to read line numbers from — but a new file's line numbers are just its own | shipped — `isTargetDiffSent` |
| B | swap the tail to `target` then `conversation` | +31.1pp cacheable → ~30% of the prompt bill at the 96.8% cache discount | the target stops to be the last block the reviewer reads | shipped — the +31.1pp is banked; its attention cost is unmeasured, see below |
| C | send the diff only, no body, where the diff covers most of the file | up to the body of every new file — a further ~25% | a reviewer that must quote `snippet.code` from the clean body has no clean body | open |
| D | prune `--refs` to the rules actually cited | ≤5.9%, the whole refs budget | a rubric that needs its define loses it | open |
| E | fix the 142 broken globs | naught — it raises cost | these lanes grade against rubrics they never load. the fix is correctness, and it costs more tokens | a defect, surfaced (`.dream/v2026_09_19.fix.142-guard-globs-…`) |
| F | one lane reads the corpus, N rubrics ride one prompt | ~660M of 773M grove billable tokens — the largest lever measured. 11 lanes grove-wide (9 on one stone's L1) re-read one corpus; the rubric that differs is 8.4% of a prompt | one verdict per rubric is what the tallier counts; a merged lane breaks the per-lane budget and the per-lane `.taken`. and one brain that grades 11 rubrics at once may grade each one worse | measured on the grove. large, invasive |
| I | point cheap lanes at a cheaper brain | the grove's $/token spread is 6x across lanes — a rate no prompt lever touches | a weaker brain misses defects. this is a per-lane quality call, not a global one | surfaced by the grove mine |
| J | cut the 952 `refused` runs (26.5% of all runs) | no tokens — they never reached a brain. it buys wall-clock and orchestration, never money | naught; a refusal is already free. the win is latency and noise | open, cheap |
| G | order targets least-recently-touched first | live since B shipped — it is what makes B pay | none | shipped, and live |
| H | cap the conversation to the last N rounds | the conversation's growth, unbounded today | it would break the prefix at the cap each round rather than extend it — the append-only order is exactly what makes it cacheable | counter-productive. do not |
| K | scope `$conversation` to the lane's own slug | on a 20-lane guard at round 7, 77% of a prompt (1.52M chars, 387 files) — and the nine timeouts it caused | a lane no longer sees a neighbour's settlement, so a shared concern is answered twice | shipped (`enumRouteGuardReviewPeerConversationFiles`, `slug`) |

A and B compose and do not overlap. A removes bytes; B moves bytes from `$0.22/1M` to
`$0.007/1M`. they act on different halves of the same problem.

### how the levers rank once the grove is the denominator

the corpus study ranked by share-of-one-prompt. the grove mine ranks by share-of-the-actual-bill,
and the order changes:

| rank | lever | grove mass | what it acts on |
|---|---|---|---|
| 1 | F — N rubrics, one read | ~85% of billable | the corpus, re-read 11× |
| 2 | the affinity pin (shipped) | 96.8% of read moves toward cache | the rate, not the bytes |
| 3 | I — brain per lane | a 6x $/token spread | the price, not the bytes |
| 4 | A — no diff for new files | 27.2% of a prompt | the bytes |
| 5 | B — tail order | +31.1pp cacheable | the rate |

F and the pin are near-orthogonal, and both dwarf A and B. F cuts the corpus reads from 11 to 1;
the pin makes whatever remains cacheable. the two together attack 96.8% of the bill from
opposite sides, and neither was the lever this branch set out to build.

none of F, I, or J is a byte question, so none is clamped by a byte test. each changes what a
brain reads, which brain reads it, or whether a lane runs at all — all three are quality calls
that need an A/B over a real corpus, exactly as A and B do.

H is the trap worth a name. a conversation that grows without bound looks like the obvious cut,
and a cut would destroy the one property that makes round 2 → 3 cache at all: that round N's
conversation is a byte-prefix of round N+1's. a window that slides has no stable prefix.

K is not H. H cuts along the round axis and slides; K cuts along the lane axis and does not. a
lane's own slice is still append-only and oldest-first, so round N's slice stays a byte-prefix
of round N+1's. K removes the other lanes' bytes, which were never this lane's to grade.

### lever B, measured — the tail order

`reviewPromptCacheAnatomy.test.ts` case5, over a 12-target corpus where the driver repairs one
file per round and `getAllTargetsByCacheStability` sorts it last:

| tail order | cacheable bytes | share |
|---|---|---|
| conversation, then target (prior) | 15,287 | 50.7% |
| target, then conversation (shipped) | 24,663 | 81.8% |

the flip HAS shipped, so a layout still labeled "conversation-first" names what we no longer
send — the same expiry the three-state table above documents, in a row rather than a column.

the prior figure sits within one byte of case1's round 2 → 3 under the head repair (15,287 vs
15,288), where the
corpus was half the size. the prior order's cacheable bytes do not grow with the corpus at
all — the conversation gates them, so every byte of target sits behind a block that moves every
round. the larger the corpus, the worse the prior order does, and the corpus is 91.6% of the
bill.

the flip reorders bytes and rewrites none, clamped in case5 `[t1]`.

it is not a free win at every corpus shape. case1 — one target, revised every round — went the
other way, 81.9% → 70.1%. the crossover is stated above: target-first wins iff the unchanged
target mass exceeds the accumulated conversation.

and G is why the flip pays more than the table alone says. `getAllTargetsByCacheStability`
already sorts the repaired file last, so once the target leads the tail, the stable N−1 targets
sit ahead of the one that moved. G was built for exactly this, and pays from the flip on.

what the flip left open. the prior order was deliberate — the compiler's note gave two reasons,
and the measurement refutes exactly one of them:

| the stated reason | the measurement |
|---|---|
| "the conversation only appends, so conversation-ahead keeps a longer prefix alive" | false. it caps the prefix at the conversation's end, so the target is never reached |
| "the target is the block the reviewer must weigh most heavily" | untouched. recency in a prompt affects attention, and no byte count can speak to that |

the cache argument won, and the flip shipped. the attention argument is not answered by it: that
is a brain-quality question, and only an A/B over a real corpus can settle it. the magnitude is
banked; the safety is not measured.

### what A cost, and what it banked

shipped as one predicate, `isTargetDiffSent`, read by both `renderPushTarget` and the census: where
`changeKind === 'new'`, the `<target.file>` block is sent alone. the instruction block already told
the reviewer a diff may be absent ("each changed target may carry a `<target.diff>` block"), so no
prompt rewrite was owed. the 27.2% is banked, not available — a reader who ranks the next lever
starts from the prompt without it.

unmeasured: whether verdict quality holds without the `+` markers on a new file. that is a
brain-quality question, and no figure in this brief can answer it — it needs an A/B over a real
corpus. the mass is measured; the safety is not.

## .see also

- `rule.require.name-the-shared-prefix-as-the-cache-anchor` — the rule this measurement produced
- `domain.terms/term=prompt.cache.shared-prefix._.choice._.md` — the term, and why it is a relation
- `src/contract/cli/review._.cost.ts` — one command over the `breadth` axis: `--of run|tree|grove`
- `src/domain.operations/review/meter/` — the `run` and `tree` operations, and the prefix instrument
- `src/domain.operations/review/grove/` — the grove mine (realized spend, every tree on the machine)
- ~~`src/contract/cli/review.corpus.ts`~~ — the corpus study (declared scope); deleted 2026-09-21
- `src/domain.operations/review/meter/reviewPromptCacheAnatomy.test.ts` — the snapped offsets
- `philosophy.a-review-budget-balances-perfection-with-pragmatism` — why the ladder is wide
