# domain.term: grade

term.chosen   = grade
term.kind     = noun
term.boundary = review        # what a review instrument says about its OWN measurement
term.synonyms.forbidden:
- status       # for a measurement's trust only; `PassageReport.status` and `GuardPeerMeterStatus` own the word for a lifecycle state
- state
- quality
- confidence   # a degree on a scale; a grade is a closed set of positions. forbidden for every family too (`review.grade.honesty`)
- level        # for a measurement's trust only; `route.guard.level` owns the word for a peer-review ladder rung
- flag

## .what

a **grade** is what an instrument says about the measurement it just made — never about the
subject it measured. it answers *"can this figure be trusted, and how far?"*

the figure and its grade are two values, and both render. an instrument that emits a
number alone has hidden the one fact a reader needs: whether the number is a measurement, a
fact, or an absence dressed as a measurement (`rule.forbid.failhide`).

## .the three families, each a CLOSED set

`grade` is the genus. each family names the instrument it qualifies, and its positions are
exhaustive — a fourth cannot be coined without the reader beside the union turned red.

| family | the instrument | the closed set |
|---|---|---|
| **honesty** | the `meter`, over a run's spend | `metered` · `refused` · `unknown` |
| **attribution** | the census, over a prompt's inputs | `attributed` · `unattributed` |
| **cache** | the cache-share read, over a run's prefix | `warm` · `cold` |

### where each family's clusters live — two namespaces, on purpose

every POSITION sits under this genus: `review.grade.honesty.*`, `review.grade.attribution.*`,
`review.grade.cache.*`. the three branch segments root HERE — this cluster is the declared head
of `review.grade.attribution` and `review.grade.cache`, so neither names an absent root.

the family WORD is a separate question, and only `honesty` is a word this genus owns:

| family | its positions | where the family word itself is itemized | why there |
|---|---|---|---|
| honesty | `review.grade.honesty.*` | `term=review.grade.honesty` | the word names this grade alone |
| attribution | `review.grade.attribution.*` | `term=review.attribution` | the word names the census act, of which the grade is one read |
| cache | `review.grade.cache.*` | `term=prompt.cache` | the word names the provider's cache, which the grade only observes |

⇒ a family whose word means more than its grade keeps that word at its own subject; its grade
positions still branch from this genus.

the three are peers, never a hierarchy. a run can be `metered` and `unattributed` and
`cold` at once, and each states a different truth. to fold them into one word leaves no way to
say "we priced it, and we cannot vouch for what bought it" — which is a common and important
state.

## .the law every family obeys: a nil that is a fact is not a nil that is an absence

this is the one claim that makes `grade` worth a word at all, and it recurs in every family:

| the instrument | the fact nil | the absence nil |
|---|---|---|
| honesty | `refused` — the brain charged naught. renders `$0` | `unknown` — we could not price it. renders absent |
| attribution | — | `unattributed` — the rows may hide an input with no row |
| cache | `cold` — measured, and it served naught | a bucket with no metered run is graded `null`, never `cold` — it has no rate to qualify |

`$0.00` and "we do not know" must never render alike, and the grade is what keeps them
apart. a sum over a corpus excludes every `unknown`, and the count of what it excluded renders
beside the total — so the denominator a reader divides by is stated rather than assumed.

## .a grade records; it rarely refuses

a grade exists precisely where a throw would be wrong: it qualifies runtime data the caller
cannot control. the review census throws on a negative residual (arithmetically impossible, so
a code defect at every scale) and grades a large one (a corpus shape, measured at 70.8% on
293 small targets — a throw there would kill every review of a repo shaped that way).

throw on what is impossible; grade what is merely unvouchable. an instrument that flattens
the two becomes the outage it was built to study.

## .refs

- src/domain.operations/review/getOneAttributionGrade.ts        # `AttributionGrade` — `attributed` / `unattributed`, itemized at `term=review.grade.attribution.attributed`, `.unattributed`
- src/domain.operations/review/asAttributionGrade.ts            # `asAttributionGrade` — reads the grade back off disk
- src/domain.operations/review/getOneGradeCensus.ts             # the count beside a sum
- src/domain.operations/review/meter/getOneCacheGrade.ts        # `warm` / `cold` — itemized at `term=review.grade.cache.warm`, `.cold`
- src/domain.operations/review/meter/getOneReviewRunMeter.ts    # `ReviewRunGrade` — the honesty family, itemized at `term=review.grade.honesty` and its `.metered`, `.refused`, `.unknown`
- src/domain.operations/review/meter/getOneAccountedCost.ts     # the absent/zero law over a set of runs
- src/domain.operations/review/getOnePromptComposition.ts       # `attribution` rides on the composition

## .reason

- `term=review.grade._.choice.reason.md`
