# fulcrum F5 — `concurrency` is the word

**rework** — clean · **status** — open · **confidence** — 95%

## .why this is a fulcrum at all

the wish raised the name question directly — it records that `mutex` was floated for the
concurrency-of-one case and then argued against, and hands the choice back:

> the word is yours to settle in-repo, per this repo's own term rules.

a word that lands in a published guard schema spreads to every `.guard` in this repo and
downstream, so it is worth the row even at high confidence.

## .the enumeration — instances before the word

per `rule.require.enumerate-before-you-name`, list every instance the word must cover **before**
the word is chosen. the concept: *the maximum number of peer reviews that may be in flight at one
time, at a given level.*

| # | the instance |
|---|---|
| 1 | `l1` — no bound at all (unbounded) |
| 2 | `l3` — exactly 1 (serialized) |
| 3 | `l2` — some N, where `1 < N <` member count |
| 4 | a level with one member — the bound is moot but must still be expressible |
| 5 | the default, when no declaration is written |

## .the candidates, against the list

| candidate | covers | verdict |
|---|---|---|
| `mutex` | **2 only** | 🔴 **too narrow** — breaks on rows 1 and 3. and it names a cross-scope lock, where this is a per-level bound. rejected (the wish's own argument holds) |
| `parallelism` | 1, 2, 3, 4, 5 | ⚠️ reads wrong at the row that matters most: *"parallelism: 1"* is an oxymoron — one at a time is not parallel |
| `bottleneck` | 1–5 | 🔴 **too wide** — it names the *mechanism*, and `with-bottleneck`'s own `Bottleneck` carries **both** concurrency and velocity (rate). `bottleneck: 1` would be a lossy shorthand for a two-property object |
| `lanes` / `width` | 1–5 | 🔴 **collides** — this repo already uses *lane* for a single reviewer run (*"an overflowed lane"*, `rule.always.diagnose-reviewer-malfunctions`). a second sense is `rule.forbid.domain-term-ambiguity` |
| **`concurrency`** ✅ | **1, 2, 3, 4, 5** | covers every row; `concurrency: 1` reads correctly; excludes its neighbours — it names neither the rate limit (`velocity`) nor the run order (`level`) |

## .taken, and why at the time

**`concurrency`.**

three independent supports, which is why the confidence is high:

1. **the enumeration** — it is the only candidate that covers all five rows *and* discriminates
   against its neighbours. `parallelism` covers the rows but misreads at row 2; `bottleneck`
   covers them but is the genus, not the differentia.
2. 🔴 **it is the wisher's own word, verbatim** — *"each level can specify the concurrency."* that
   is the etymology, and it is already on record (`.seeds/`).
3. **it matches the extant contract** — `with-bottleneck`'s `genBottleneck({ concurrency })` uses
   exactly this word for exactly this property, and its unbounded default is `concurrency:
   Infinity`, which is row 1. to adopt the word is to make the guard schema and the primitive
   speak one vocabulary (`rule.always.reuse-pavement-before-improvise`).

## .the residual 5%

⚠️ **it is not itemized in `domain.terms/` yet.** `rule.require.domain-term-itemization` binds any
word that composes a declared domain object, and `concurrency` will compose
`RouteStoneGuardReviewLevel` (or whatever F1 settles on). the cluster is owed — carried as a
dream, not done here, because the object it composes is not declared until the blueprint stage.

⇒ the boundary-qualified name will be `term=route.guard.review.concurrency`
(`rule.require.boundary-qualified-terms`) — the answer to *"concurrency, of WHAT?"* is
`route.guard.review`, not the repo at large.

## .rework — clean

a rename across one schema field, one domain object, and the guard files that declare a bound.

## .where

- the wish's `.one caution on a WORD it raised`
- `.seeds/inventory.of=seeds.case=S1-each-level-can-specify-the-concurrency.md`
- `.dream/` — the owed `domain.terms/` cluster

## .the verdict

_open — for the fulcrum council at the end of the route._
