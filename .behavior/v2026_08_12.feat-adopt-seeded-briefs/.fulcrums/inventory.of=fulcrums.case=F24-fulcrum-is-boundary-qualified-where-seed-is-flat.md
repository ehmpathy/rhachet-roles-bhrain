# fulcrum F24 — `fulcrum` took a boundary path where its closest precedent took none

| field | value |
|---|---|
| **the fork** | A: `term=fulcrum._.choice._.md`, flat, as its closest precedent `term=seed` is · B: `term=route.fulcrum._.choice._.md`, boundary-qualified |
| **taken, and why** | **B.** `rule.require.boundary-qualified-terms` demands the full ancestry path *always*, and a fulcrum is plainly a route concept — `.fulcrums/` sits at the route root, and `route` is a declared term that reaches the root |
| **rework** | **clean** — two file renames plus the `.refs` lines that cite them; the boot glob matches either shape |
| **status** | ✅ **SETTLED 2026-08-31** — the premise dissolved; see below |
| **where** | `.agent/repo=.this/role=any/briefs/domain.terms/term=route.fulcrum._.choice._.md` |
| **confidence** | **~88% → ~96%** |

## .why the confidence is not higher — the precedent went the other way

`term=seed` is the closest analogue this glossary holds, and it is **flat**, with
`term.boundary = UNSETTLED`. its `.seeds/` dir sits at the route root exactly as `.fulcrums/` does.

so a reader who compares the two finds one route-scoped occurrence set qualified and its twin not,
and the reason is **not** visible from the filenames.

⇒ the reason is real and it is recorded in seed's own `.reason`: seed sits in the unsettled
`en-` externalization family, where two candidate boundaries fit and neither is settled. `fulcrum`
has no such contest — one word answers *"of WHAT?"*. **but that asymmetry is legible only to
someone who opens both reason files**, which is the cost of the call.

## .the second-order risk, as forecast

if a later round settles the externalization family and renames `term=seed` → `term=route.seed`,
this call is retroactively correct and costs no rework. if it settles the other way — seed's
boundary turns out to be `knowledge` or `externalize` rather than `route` — then two peer
occurrence sets sit on **different axes**, and a reader has to learn both.

## ✅ .SETTLED 2026-08-31 — and by a THIRD outcome neither branch predicted

`term=artifact` was paved, and `seed` settled on it: **`term=artifact.seed`** — not `route.seed`,
and not the `en-` family's `knowledge.`/`externalize.` fork either.

⚠️ **and the reason the forecast missed is the same defect this round measured twice.** the risk
section above assumed seed's boundary was **open**, because the cluster's header said
*"the externalization family shares one gap"*. it was a **copy-paste**: `seed` is a **noun**, the
family is **verbs**, and its own `.reason` file carried no boundary section at all. a gap claimed
from **adjacency** was never a gap (`rule.require.enumerate-before-you-name`).

⇒ **F27's class again, at one more remove** — a claim inherited from an adjacent document and
never checked against the cluster's own `.what`.

## ✅ .the two sets DO sit on different axes — and that is now the correct outcome

| the set | its term | why |
|---|---|---|
| `.fulcrums/` | `route.fulcrum` | a fulcrum is a fork **on a route**. it cannot exist outside one |
| `.seeds/` | `artifact.seed` | a seed is raw source material. a standalone `$topic.kind=seed.md` lives outside every route — the `.seeds/` home is where a route happens to keep them, never what the word means |

⇒ so the asymmetry the original call flagged as its cost is **real and correct**, and it is now
**legible from the filenames** rather than only from two reason files. that is what raises the
confidence: the reader who compares `route.fulcrum` to `artifact.seed` learns the distinction from
the names, which is the one lesson the flat form could not teach.

## .what settled it

- `term=artifact` paved, 2026-08-31 — three clusters were blocked on one absent ancestor
- ✅ the grep test the original entry named: `term=route.*` returns `route.fulcrum` beside
  `route.stone`, `route.guard`, and `route.guard.rung`. **the slice works**
