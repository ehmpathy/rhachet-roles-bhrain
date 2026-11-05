# measurement.after — the review cache on the cured layout, as the meter reads it

read 2026-11-05 via `rhx review._.cost --of tree` (this tree) and `rhx review._.cost --of grove`
(text, and `--json` for its `byDay` series, scratch at `.temp/grove.after.json`). every figure is
the meter's own; the one derived figure (USD per token) states its arithmetic.

## .the sample — like kind, and what it is not

| figure | value |
|---|---|
| rounds | `5.1.execution.from_vision` i001 · i002 · i003 — the nine level-1 rubric lanes, as the guard ran them |
| runs | 27, all metered, brain `openrouter/deepseek/flash`, provider `Relace` |
| layout | corpus-first: each run's `input.prompt.head.md` opens its first block with `## target` (line 83), the rubric in the tail |
| meet | unrecorded on these runs — the meet record landed in 5.1 i004–i005, after they ran |
| prompt | 11.2M tokens · $0.349010 |

🟡 **one stone, one tree, three rounds.** the 5.1 rounds i004–i006 ran the two enrolled lanes, which
the meter does not log; no other tree runs the cured build yet. a larger sample waits on a release.

## .per brain

| brain | runs on the cured layout | cached |
|---|---|---|
| `openrouter/deepseek/flash` | 27 | **21.8%** |
| `openrouter/deepseek/pro` · any anthropic brain | 0 | — no run on the cured layout; their before figures stand (`measurement.before.md` § per brain) |

## .the split, per round

| round | runs | prompt | cached | cost |
|---|---|---|---|---|
| i001 | 9 | 3.7M | 11.5% | $0.122108 |
| i002 | 9 | 3.7M | 12.6% | $0.109610 |
| i003 | 9 | 3.8M | 40.5% | $0.117292 |

prefix census, this tree: 16 served · 3 missed · 0 lapsed · 3 self-cached · **0 over-reach** (353 on
the before corpus) · 0 unshared. the most any cache could serve: 81.0% of prompt chars.

## .the mechanism figure — what only the cure can explain

a first round has no prior, so whatever it reads from cache came from a peer lane this round.

| | first-round cache share | why |
|---|---|---|
| before — the old head | ≈0.4% possible; grove days 11-03 · 11-04 read **0.3% · 0.2%** | lanes shared only instructions + output format (0.3% + 0.1% of chars); the rubric led, and differs per lane |
| after — i001 | **11.5%** | lanes share the corpus in the head, so a peer's send can serve it |

⇒ the cure opened the cross-lane path. how much of it lands is set by the replica: `behavior-intent-coverage`
read 95.8% of its prompt from cache while its peers read ~9–10%, which is one replica hit and eight misses —
the unpinned route (C2, `ehmpathy/rhachet-brains-openrouter#34`).

## .the cross-lane hit rate p — the vision's research question

read off `rhx review._.cost --of tree --trace`. the 5.1 level holds one group of 8 lanes on one
corpus (`mech-decode-friction` drops tests, so it heads alone). each round's poke is the one
`(no guard identity)` run, ~400k prompt, 0.1% cached; its pid names the lane that led the meet.

| round | leader (sent the poke) | leader's own read | followers that read ≥95% |
|---|---|---|---|
| i001 | `mech-failhides` | 1.4% | 1 of 7 — `behavior-intent-coverage` 96.4% |
| i002 | `arch-hazards-behavior` | 3.8% | 1 of 7 — `behavior-intent-coverage` 95.8% |
| i003 | `arch-hazards-maintenance` | 96.7% | 1 of 7 — `behavior-intent-coverage` 95.2% |

- **p ≈ 3 / 21 = 14.3%** of follower lanes met the primed replica, against a **13%** break-even for
  N = 8 (`1.vision.yield.md` § the poke's break-even). the group cleared it, narrowly
- the three pokes cost $0.009311; the three follower hits read ~1.2M tokens from cache, ≈ $0.044 at
  the derived rate below — the prime paid for itself ~4.7× over these rounds
- the leader read its own poke in 1 of 3 rounds: even the lane that warmed the replica lands on
  another one most of the time. the same lane hit as follower in all three rounds, so the hits
  cluster, which a pin keyed on the head (C2) would make the rule
- no group of 5, 3, or 2 lanes ran on the cured build, so those break-evens are unmeasured

## .the delta, in tokens and USD/day

the baseline is the same week on the same instrument: every grove run 2026-11-01 → 11-04, all on the
pre-cure build (805 runs; 113,488,732 fresh + 5,284,070 cache.get = 118.8M prompt tokens; **4.4%** cached).

| figure | value |
|---|---|
| cache share | 4.4% → 21.8%, **+17.4pp** |
| grove prompt volume | 118.8M / 4 days = 29.7M prompt tokens/day |
| tokens moved fresh → cache, per day | 0.174 × 29.7M = **5.2M tokens/day** |
| price of a fresh input token | $0.037/M — this tree's billed $0.463291 over 10.1M fresh + 2.5M cached + 0.77M output, at the rate card's ratios (cache read 1/31.4 of input, output 3×; `research.review-cost-and-cache` § the rate card) |
| saved per token moved | $0.037/M × (1 − 1/31.4) = $0.036/M |
| **USD/day, this grove** | 5.2M × $0.036/M = **≈ $0.19/day** (the grove spends ≈ $1.81/day: $58.02 over 32 days) |
| **USD/day, the fleet — est.** | × 27.6 (the wish's ~$50/day ÷ this grove's $1.81/day) ≈ **$5/day, est.** |

## 🔴 .what the delta cannot claim

- **the baseline moves more than the cure does.** the window 2026-10-25 → 10-31 ran the same old
  layout and cached 59.6%; the next four days cached 4.4%. a 55pp spread with no layout change is the
  replica, not the prompt. against the 10-25 window the cured rounds read 37.8pp LOWER. so the sign
  of a daily delta is the route's, and three rounds cannot part it from the layout's share. the
  mechanism figure above is the claim this sample settles; the USD/day row is an extrapolation of it
- **the USD rate is derived, not read.** the realized record's per-part cost is a rate-card
  projection beside a billed total, and they do not reconcile (one run: parts $0.188, billed
  $0.0168), so the meter prices no cache discount off it (`isRunCostBreakdownReconciled`; caught as
  `.dream/v2026_10_05.reseed.openrouter-cost-breakdown-is-a-rate-card-beside-a-billed-total.md`)
- the pin (C2) and the anthropic cache marker (C7) are dispatched, not cured here; until C2 lands,
  each cross-lane hit is chance
