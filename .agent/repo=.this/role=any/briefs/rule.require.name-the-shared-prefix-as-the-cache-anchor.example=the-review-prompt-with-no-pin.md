# example: the review prompt that shared 97% and cached 0.0%

- rule    = `rule.require.name-the-shared-prefix-as-the-cache-anchor`
- repo    = `ehmpathy/rhachet-roles-bhrain`
- branch  = `beav/feat-review-cost-meter`
- dated   = 2026-09-18, measured on a since-retired brain provider

the occurrence the rule was written from. it is the sharpest instance of **obligation 3** —
the pin — because the prompt itself was nearly ideal and the hit rate was zero regardless.

## .the chain — six hops, and no buggy link in it

`rhx review` built the entire prompt as one user message and passed `role: { briefs: [] }`:

| # | where | what happened |
|---|---|---|
| 1 | `src/domain.operations/review/stepReview.ts` | `ask({ role: { briefs: [] }, ... })` — the brief set is empty |
| 2 | `rhachet/.../castBriefsToPrompt.js` | `[].map(...).join('\n\n')` → `''` |
| 3 | the brain adapter's atom | `askInput.role.briefs ? await castBriefsToPrompt(...) : undefined` — `[]` is truthy, so this RUNS and yields `''` |
| 4 | the brain adapter's atom | `if (systemPrompt)` — `''` is falsy → **no system message is pushed** |
| 5 | the adapter's affinity key | `if (!input.systemPrompt) return null` |
| 6 | the adapter's request | no affinity key → **no replica pin sent** |

hop 3 is the one that reads wrong at a glance: an empty array is not "no briefs" to the
adapter — it is a system prompt of `''`, which every later hop then treats as absent.

## .why no component was at fault

the adapter's assumption — no system prompt means no shared prefix worth a pin — is sound for
a caller whose repeated block lives in the system message. `rhx review` was not that caller:
its ~97% repeated block sat in the user message, where no pin could see it.

both halves were locally correct and the composition cached naught. that is the shape the rule
exists to catch: an obligation nobody owns, between two components that each behave.

## .the layout defects that sat beside it

each is a clean instance of obligation 1 or 2, and each was measured over the same fixtures:

| the defect | obligation | the cost |
|---|---|---|
| an instruction item appended only when a conversation existed, ABOVE the whole rubric | **2** | round1→round2 prefix broke at byte **534** — **3.3%** shared |
| `## output format` — 1.7kb byte-identical on EVERY review ever run — placed BELOW the variable target | **1** | re-paid at full input rate, on every review |

the repair for each: the conversation instruction became unconditional — one line, worded to read
correctly with or without a conversation — so naught variable sits above the rubric; and
`## output format` was hoisted above `## rules`, into the static head, so it rides the prefix.

## .after the repair, same fixtures

| transition | before | after |
|---|---|---|
| round1 → round2 | 534 bytes, **3.3%** | 13,057 bytes, **78.8%** |
| round2 → round3 | 13,255 bytes, 82.7% | 15,288 bytes, **81.9%** |
| `## output format` offset | 14,332 | **3,612** |

each share is the shared prefix over the LATER prompt's total bytes: round 2's for the first row
(16,036 before, 16,568 after), round 3's for the second (~16,030 before, ~18,670 after — round 3
carries one more turn of conversation). these are the "after the head repair" column of `research.review-cost-and-cache`, which
is the record of every state this layout has passed through, the tail flip included. the clamps are `reviewPromptCacheAnatomy.test.ts`, and every one
of them was red against the prior layout (`rule.require.clamp-edge-cases`, ehmpathy/mechanic).

## .and the pin itself, proven against a live brain — 2026-09-20

the table above is measured over fixtures, which proves a layout and not a rate. the pin was
then probed directly: two calls, same 58k-token head, same model.

| run | input tokens | cache.get | cost |
|---|---|---|---|
| A — cold | 58,156 | 0 | $0.013919 |
| B — same head | 1 | 58,155 | $0.005413 |

99.998% of the prompt served from cache, and ~97% off the input spend. obligation 3 is
therefore proven end to end: the pin is sent, the replica is reached, and the prefix is
served.

## .what is still not proven

a hit rate is a property of what the vendor does with the bytes, and the probe above is a
two-call probe with one head. it does not say what an 11-lane grove realizes over many rounds,
where heads differ per lane and the corpus churns between rounds.

the residual, narrowed: `.dream/v2026_09_18.verify.the-cache-repair-is-clamped-by-layout-but-unmeasured-live.md`
— its "is the pin live?" half is closed by the table above; its "what does the grove realize?"
half is open, and only `rhx review._.cost --of grove` after a real multi-round run can close it.

## .see also

- `rule.require.name-the-shared-prefix-as-the-cache-anchor` — the rule this instances
- `research.review-cost-and-cache` — the full measurement, the rate card, and the cost drivers
