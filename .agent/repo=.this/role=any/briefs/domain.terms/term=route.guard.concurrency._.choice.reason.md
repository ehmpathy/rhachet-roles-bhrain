# domain.term.choice.reason: route.guard.concurrency

## .etymology

`concurrency` is the standard term of art for *how many things run at once*, and it is the word the
wisher reached for unprompted in seed **S1**: *"each level can specify the concurrency"*.

it was weighed against `parallelism`, the word the wish's own branch name carries
(`feat-peer-review-parallelism`), and lost to it on nothing — it won on a **measured collision**.

## 🔴 .evidence — `parallel` is not a matter of taste; it is occupied

| the extant use | what `parallel` means there |
|---|---|
| `blackbox/…peer-budget-parallel-l1…` | **reviewers that sit at the same level** — a position fact |

⇒ two l1 reviewers are `parallel` in that sense whether they run one at a time or ten at a time.
**the word is a claim about the ladder, never about the clock.** to reuse it for simultaneity would
put one word over two concepts on a surface that already carries the first.

⚠️ **that is a harder reason than the readability argument the fulcrum first offered.** the original
case for `concurrency` was *"it reads plainer"* — a preference. the collision is a fact, and it is
what raised the entry to 95%.

## .the rejected candidates, and the row each breaks on

| candidate | why it is forbidden |
|---|---|
| `parallelism` / `parallel` | **occupied** — see above |
| `bottleneck` | names the **constraint**, so it cannot name a count. and `with-bottleneck` already owns it for the mechanism — see `term=route.guard.concurrency.group._.choice.reason.md` |
| `throughput` | a **rate** — things per unit time. ours is a **standing count**, with no time term in it |
| `fanout` | names the **act of dispatch**, not the ceiling on it. a fanout of 11 under a ceiling of 10 is the exact case this term must describe, and the word cannot state both halves |

## ⚠️ .the sibling collision this cluster exists to prevent

three allowances live on this ladder and every one reads naturally as *"an amount you may spend"*:

| term | unit | a spent one is |
|---|---|---|
| **concurrency** | simultaneous runs | a wait for a slot |
| **budget** | review rounds | `exhausted`, a terminal verdict |
| **timeout** | milliseconds | `Exceeded timeout`, a defect or a hang |

`term=route.guard.budget._.choice._.md` already records the budget/timeout half of this collision,
measured 2026-09-02. **this cluster adds the third leg** — and the hazard is symmetric: a
`*_CONCURRENCY` const that in truth bounds rounds, or a `budget` key that in truth bounds
simultaneity, ships the overload into a contract.

## .disputes

### dispute: parallelism — raised 2026-09-03 — status: RESOLVED (keep `concurrency`)

- raised.by  = the record itself — the wish's branch name speaks `parallelism`
- claim      = the wish's own word should be the contract's word
- counter    = a wish speaks loosely by design; and `parallel` is measurably occupied in this repo
                for *same-level*, so the reuse is an overload rather than a preference
- resolution = keep `concurrency`; record `parallel` and `parallelism` as forbidden synonyms.
                the wish's word remains the term's **etymology**, which is where a loose word belongs

## ⚠️ .the open state — settled at the vision, not yet ruled by the council

this word sits on fulcrum **F5** of `v2026_09_03.feat-peer-review-parallelism`, **open at 95%**. it
was carried into the glossary ahead of the council because:

- the **argument** decays with the round; the **verdict** does not
- the rework is clean — one yaml key, no callers, nothing built

⇒ if the council rules otherwise, this cluster is renamed and the loser recorded here as a dispute.
**the evidence above stands either way**, which is what makes it worth a file now.

## .evidence

- discovery: the collision was found by a grep of this repo for `parallel`, during self-review r1 of
  the `1.vision` stone. **it was not reasoned about — it was looked up**, which is the distinction
  `rule.always.reuse-pavement-before-improvise` draws
- invariants: `concurrency` bounds **a group**, never a level and never a reviewer. a bound is a
  property of a set — *"this reviewer has concurrency 10"* states no fact, because 10 of *what set?*
