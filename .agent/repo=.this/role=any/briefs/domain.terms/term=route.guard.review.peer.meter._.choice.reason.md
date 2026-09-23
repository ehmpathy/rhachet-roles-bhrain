# domain.term.choice.reason: meter

## .etymology

**meter** — from greek *metron*, *"a measure"*. the english noun names the INSTRUMENT that records
a quantity as it accrues: a gas meter, a taxi meter, the dial on a utility box. the sense fits
exactly — a reviewer spends rounds, the meter records the spend, and a spent meter is the fact the
gate reads.

it was **adopted, never coined**. the ledger on disk is `reviewPeerMeters.jsonl`, the domain object
is `RouteStoneGuardReviewPeerMeter`, and the operation namespace is `peer/meter/`. the word was
already this repo's word for `{ slug, level, rounds, budget }`
(`rule.always.reuse-pavement-before-improvise`).

### why not the peers

| the candidate | why it was refused |
|---|---|
| 🔴 **lane** | it is a **declared forbidden synonym of `reviewer`** (`term=route.guard.review.reviewer._.choice._.md`), so a type named `Lane` ships a banned synonym into a contract, where `rule.forbid.domain-term-synonyms` bites hardest |
| **counter** | it names one number. a meter carries four fields and a level, and the gate reads two of them together |
| **tally** | already taken, for a DIFFERENT concept in this same subsystem — the `tallier` sums concerns stone-wide. one word over two concepts is `rule.forbid.domain-term-ambiguity` |
| **usage** | corporate-generic, and it reads as the spend alone. the budget is half of what a meter holds |
| **ledger** | the ledger is the FILE, which holds many meters. a meter is one row's worth |

## 🔴 .the pull toward `lane` is real, and it is a symptom of a RECORDED gap

a designer who needs the word for *"one run of one reviewer"* reaches for `lane` every time, because
`reviewer` carries both the role and one run of it and the run-sense **has no word of its own**.
`term=route.guard.review.reviewer._.choice.reason.md` records that gap, with its measured evidence.

⇒ **`meter` does not close it.** a meter is the SPEND RECORD of a run, never the run. what the
design that produced this cluster actually needed was the spend record, so it took the shape it
holds rather than the word it wanted — which is the right move, and does not discharge the gap.

🟡 **no new dispute is owed.** the `lane` dispute was raised and settled in 2026-09 (it took the
INCONSISTENCY repair — one concept, two words, settled on `reviewer`), and a resolved dispute
re-opened would be a second index over one question.

## .the meter-vs-verdict line

the distinction this term exists to hold, and the one the budget gate turns on:

| the read | asks | a reviewer at 8/8 that just RAN |
|---|---|---|
| `verdict === 'exhausted'` | was it SKIPPED for budget this generation? | **no** — it ran, so `rejected` |
| `rounds >= budget` | has it a round left to spend? | **yes, it is dry** |

⇒ the verdict form requires `!hasReviewForCurrentHash`, and `getAllReviewPeerMeterStatuses` forbids
its relaxation for a real reason: it would unlock the level above a pass early. but that narrower
read refuses a grant in exactly the cell the budget gate exists to permit — the reviewer that spent
its last round to RAISE a concern and has none left to CONFIRM the repair.

🔴 **so the two reads must not be collapsed, and the predicate that needs the second is named `dry`
rather than `exhausted`** precisely so no reader takes it for the verdict
(`computeBudgetGrantRefusal.ts`, `hasReviewerRunDry`).

## .disputes

none raised on `meter` itself. the adjacent `lane` dispute is recorded at
`term=route.guard.review.reviewer._.choice.reason.md` and is RESOLVED.

## .evidence

- **the cue that fired** — i002/r001 n1. this diff declared `computeBudgetGrantRefusal`, which takes
  a `BudgetGrantMeter`, and `rule.require.domain-term-itemization` binds every word that composes a
  declared operation
- **the word was argued IN CODE before it was itemized.** `computeBudgetGrantRefusal.ts`'s docblock
  carries the `lane`-is-forbidden argument and the meter-vs-verdict table in full. ⇒ this cluster
  moves an argument from a comment to the glossary, which is where a reader looks for it
- **five candidates were enumerated before the word was kept**, per
  `rule.require.enumerate-before-you-name`, and two of the five (`lane`, `tally`) were refused
  because they are already spoken for in this same subsystem
