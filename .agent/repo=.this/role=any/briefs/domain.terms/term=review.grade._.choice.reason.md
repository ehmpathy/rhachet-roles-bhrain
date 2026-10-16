# domain.term.choice.reason: grade

## .etymology

**grade** is the assessor's word: a grade is assigned by a party who examined the work, and it
qualifies *the examination* as much as the work. that is exactly the sense here — the instrument
grades **its own reach**, never the run.

it was chosen over six candidates, and each rejection names a property the winner keeps:

| rejected | why |
|---|---|
| `status` | names a **subject's** condition, so it reads as a fact about the run rather than about the measurement. and it is already spoken for — `PassageReport.status`, `GuardPeerMeterStatus` |
| `state` | a machine's position in a lifecycle. a grade is not a transition and never advances |
| `quality` | invites a value judgment about the run. `unattributed` says naught about whether a review was good |
| `confidence` | a scalar with no closed set, so it invites `0.87`. every family here is a **closed set of words**, and that is what lets a reader beside the union go red on a fourth |
| `level` | overloaded to exhaustion in this repo — `route.guard.level`, `tool.skill.rung`'s neighbours, a reviewer's l1/l2/l3 |
| `flag` | a boolean's word. one family has three positions, and the two-position families are no boolean either — each pairs a measured fact with a position that says the measure is absent, and a flag reads that absence as `false` |

## .the evidence — the three families were discovered, never invented

the word was coined once and then found to already name two extant shapes. that recurrence is
the argument for one genus rather than three unrelated unions:

| family | when it arose | what forced it |
|---|---|---|
| **honesty** | first, with the meter | a run with no `metrics.realized.json` renders `$0.00` under a naive sum — and `$0.00` is a **claim**. `unknown` is what let it render absent |
| **attribution** | wish bar 2 | `markup` is the RESIDUAL, so the rows sum to `chars` by algebra. the sum proves arithmetic and proves NO coverage, so a second signal was owed |
| **cache** | the trace surface | a lane that served naught is `cold` — a measured fact — and a lane with no metrics is `unknown`. a share of `0.0%` cannot part the two |

⇒ three instruments, discovered a week apart, each of which independently needed *"and here is
how far I can vouch for that."* the third occurrence is what settled it as a domain term rather
than a local convention (`rule.prefer.wet-over-dry`'s rule of three, applied to a WORD).

## .the invariant

> **a figure never renders without its grade, and a sum never renders without its census.**

checkable: `getOneGradeCensus` exists precisely so a total can state what it excluded. a surface
that prints a sum with no count of the `unknown` runs behind it has made a claim about a
denominator it never measured.

## .the second invariant — the closed set is enforced by a READER, not by a cast

`asAttributionGrade` reads a grade off disk and answers `null` for any value it does not know,
because ~2,700 compiled artifacts on disk predate the grade entirely. a cast would read an
absent field as though it were one of the two (`rule.forbid.as-cast`).

⇒ and it answers `null`, **never the clean position**. to default an unstated grade to
`attributed` is the precise absence-reads-as-a-fact defect the whole term exists to refuse.

## .disputes

### dispute: fold the three families into one union — raised 2026-09-24 — status: RESOLVED (keep three)

- raised.by = the driver, at the moment of itemization
- claim = three unions of two-or-three positions is ceremony; one `Grade` union of seven
  positions would be simpler and would let one render helper serve every surface
- counter = the three are **orthogonal**, and a flat union makes the illegal states
  expressible: `metered` + `warm` + `attributed` is one run's honest description, and a single
  union can hold only one of the three at a time. worse, it would let `refused` be read as an
  attribution answer, which is a category error the type system currently forbids
- resolution = keep three closed sets under one genus word. the genus is what earns the term
  entry; the separation is what earns the three unions

## .see also

- `term=review.meter` — the instrument the **honesty** family qualifies; the pair is
  instrument-vs-quantity, and this is the third member: instrument, quantity, and reach
- `term=review.cost` — the quantity a grade qualifies
- `rule.require.distinguish-every-review-input` — the rule the attribution family serves
