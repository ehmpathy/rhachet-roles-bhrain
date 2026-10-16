# domain.term: verdict

term.chosen   = verdict
term.kind     = noun
term.boundary = prompt.cache.warmer   # what a warmer earned, as read from its own records
term.synonyms.forbidden:
- outcome
- result   # for a warmer's earned value only; `ReviewRunResult` owns the word for one review run's output
- score
- status   # for a warmer's earned value only; `PassageReport.status` and `GuardPeerMeterStatus` own the word for a lifecycle state

## .what

the one row a reader acts on when they ask *"did the warmer pay for itself?"* — derived from the
warmer's poke costs and the reviews that followed a warmed run, never from a projection.

## .the positions — a closed set, itemized here rather than one cluster each

| position | glyph | the claim it makes |
|---|---|---|
| `unproven` | 🌙 | no priced review has followed a warmed run yet, so no claim is possible |
| `loss` | ⛔ | settled: the pokes cost more than the most the cache could have saved |
| `maybe` | 🟡 | the net is at or above zero, against an upper bound on what was saved |

🟡 `awaited` is **not** a position. it is a settle state of one warmed run (`WarmerPairSettle`),
rendered as a count on its own `awaited:` row with no glyph. the net weighs settled pairs alone,
so no awaited run can move a verdict.

the positions live inside this cluster, deliberately, and the test that parts them from the
itemized `warm`/`cold` and `metered`/`refused`/`unknown` is **whether a position composes a name
outside its own derivation**:

| closed set | a position appears in… | so |
|---|---|---|
| `warm` / `cold` | `CacheGrade`, `getOneCacheGrade`, the bucket caveat, the census row | itemized, one cluster each |
| `metered` / `refused` / `unknown` | `ReviewRunGrade`, the grade census, the honesty rows at three breadths | itemized, one cluster each |
| `unproven` / `loss` / `maybe` | `WarmerValueVerdict` and its one derivation (`asWarmerValueVerdict`) — no other dobj, dop, or row | held here |

⇒ the day a verdict position enters a second name, it earns its own cluster. the census row in
`inventory.of=gaps._.md` watches for that.

## .refs

- `src/domain.operations/review/getOneWarmerValue.ts`   # `WarmerValueVerdict`, `asWarmerValueVerdict`
- `.agent/repo=.this/role=any/briefs/domain.glyphs/catalog.of=glyph.axis=warmer.md`  # the glyph per position

## .reason

- `term=prompt.cache.warmer.verdict._.choice.reason.md`
