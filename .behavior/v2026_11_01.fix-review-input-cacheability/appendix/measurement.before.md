# measurement.before — the review cache, as the grove meter reads it

read 2026-11-01 via `rhx review._.cost --of grove` (text) and `--of grove --json`, over every
tree under `~/git/ehmpathy/_worktrees` on this machine. no hand census; every figure below is
the meter's own. the json snapshot is `.temp/grove.before.json` (gitignored scratch).

## .the corpus

| figure | value |
|---|---|
| trees walked | 66 (42 with review logs) |
| runs found | 2,246 — 1,943 metered · 99 refused · 204 unknown |
| span | 2026-09-21 → 2026-11-01 (29 days with runs) |
| cost, metered + refused | $51.174006 (+204 unknown, unrecorded) |

## .lifetime split of prompt tokens

| term | tokens | share of read |
|---|---|---|
| input (fresh, full rate) | 348,360,406 | 83.0% |
| cache.set (write) | 0 | 0.0% — measured, these brains bill no write |
| cache.get (read) | 71,224,934 | 17.0% |
| output | 43,277,666 | — |

## 🔴 .the lifetime figure is a history, not a state

the per-day series (`byDay`) steps up on 2026-10-25:

| window | fresh input | cache.get | cache rate |
|---|---|---|---|
| 2026-10-06 → 2026-10-24 | — | — | 0.0%–19.3% per day, most days 1%–5% |
| 2026-10-25 → 2026-11-01 (7 days with runs) | 37,299,866 | 54,915,065 | **59.6%** |

per day in the recent window: 85.3% · 60.2% · 40.8% · 88.9% · 45.0% · 69.3% · 44.3%.

⇒ the 0% the wish cites (2026-09-18) predates the step. the waste that stands today is the
~40% of prompt tokens still paid fresh in the recent window, and it swings 41%–89% day to day.

## .the prefix census — did the cache serve what two rounds shared

| verdict | pairs |
|---|---|
| served | 538 |
| missed (shared a prefix, cache served none) | 380 |
| self-cached | 10 |
| over-reach (cache served past the shared prefix) | 353 |
| unshared | 0 |
| unmeasured | 154 |
| total | 1,435 |

🟡 **353 over-reach pairs say the instrument is off**, not the cache. one example pair: shared
prefix 656 chars (186 tokens expected), cache read 15,616 tokens. the provider saw far more
in common than the meter computed, so the meter's shared-prefix figure under-reads.

## .by provider (lifetime, full-rate tokens)

| provider | full-rate tokens | cost | runs |
|---|---|---|---|
| (no provider — unreported) | 235,367,875 | $25.33 | 1,202 (+204 unknown) |
| Relace | 68,684,625 | $9.88 | 372 |
| Morph | 21,251,677 | $1.36 | 175 |
| OpenInference | 9,153,536 | $12.40 | 392 |
| Sail Research | 7,124,251 | $0.95 | 49 |
| Decart | 5,670,484 | $0.68 | 32 |
| Reka | 578,893 | $0.06 | 5 |
| Wafer | 529,065 | $0.51 | 19 |

## .per brain — read 2026-11-05, after cure 0, before cure 1

read via `rhx review._.cost --of grove --limit 20` on the cure-0 build (the `by brain` axis and the
`lapsed` verdict are cure 0 and cure 2). the grove grew since 2026-11-01: 76 trees walked, 49 with
logs, 2,826 runs (2,557 metered · 90 refused · 179 unknown), $57.66 total, 13.1% of prompt tokens
from cache over the life of the grove.

| brain | full-rate tokens | cost | runs | cached | served | missed | lapsed | self | over-reach | unshared | unmeasured |
|---|---|---|---|---|---|---|---|---|---|---|---|
| (no brain — unrecorded) | 217,356,936 | $23.17 | 997 (+62 unknown) | 5.0% | 127 | 160 | 61 | 3 | 102 | 0 | 47 |
| openrouter/deepseek/flash | 215,702,056 | $33.98 | 1,810 (+117 unknown) | 19.9% | 726 | 196 | 86 | 5 | 218 | 0 | 90 |
| openrouter/deepseek/pro | 529,065 | $0.51 | 19 | 14.1% | 2 | 11 | 3 | 0 | 0 | 3 | — |

- the `(no brain — unrecorded)` row is older runs whose `input.args.json` predates the brain field;
  they cannot be split further, and the tool names them rather than guess
- 🟡 **150 of the 517 zero-read pairs are `lapsed`** — the round began past the 66-minute reach of
  its prior, so no cache could serve it. before cure 2 all 517 read as `missed`. the 367 that stand
  are the misses a layout or a pin can still win
- the 3 `unshared` pairs on `deepseek/pro` are brain switches (cure 0): a prompt cache is per
  model, so those rounds could read naught their prior wrote

## .scale against the wish

the wish quotes ~USD 50/day fleet review spend. this machine's grove totals $51.17 over 29 days,
~$1.76/day. either the fleet figure spans machines this grove does not see, or it predates the
input-size cuts the meter's trend shows (prompt tokens/run ↓76.1% over 29 days). the USD/day delta
this route reports is stated against THIS grove, and says so.
