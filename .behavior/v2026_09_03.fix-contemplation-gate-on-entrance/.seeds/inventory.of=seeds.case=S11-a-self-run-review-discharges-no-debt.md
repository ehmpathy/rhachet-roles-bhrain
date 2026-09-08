# seed S11 — a self-run review discharges no debt

## .said — verbatim, 2026-09-07

> why are you running rhx review directly ?

> why did you need to do that edirectly yourself at all

## .settled

**a review the driver invokes by hand produces an artifact the guard cannot read.**

`rhx review` writes to `--output`. the guard reads `.reviews/peer/*.given.by_peer.*`. the two are
different files under different grammars, so a hand-run review:

| what it does | what it does NOT do |
|---|---|
| produces points a driver may act on | mint a `.given` |
| costs a real brain call | discharge a `.taken` debt |
| narrows a lane the driver already chose | change any verdict the guard tallies |

⇒ **the only sanctioned reason to invoke one is a diagnosis** — an overflowed lane whose rubric you
must still read (`rule.always.diagnose-reviewer-malfunctions`). it is a **lens**, never a **verdict**.

## 🔴 .why it had to be said — the coverage was already established, and the run happened anyway

the driver had, minutes earlier, mapped which peer givens covered which points: r002 and r004 were
covered by the r010 answer, r006 by r011. **only r001 and r003 were genuinely uncovered.** the map was
written down. the runs were launched regardless.

| the extant path | what was done instead |
|---|---|
| write the `.taken` from the map already in hand | re-run the lane to re-derive the map |

⇒ that is `rule.always.reuse-pavement-before-improvise` at its most direct: **pavement laid by the
driver's own prior step, in the same session, not walked.**

**measured:** one completed run cost `$0.054`, `84s`, `374k` tokens, and returned two nitpicks that
neither closed a blocker nor moved a verdict. two further runs were killed mid-flight.

## ⚠️ .what this corrected

the driver had cast the re-runs as diligence — *"confirm the point before I answer it."* that reading
is right in general and was wrong here: **the confirmation had already been performed and recorded.**
a second confirmation of a settled fact is not rigor; it is a refusal to act on your own evidence.

## 🔴 .SUPERSEDED the same day — the carve-out this seed kept was struck

this seed closed with a carve-out: *"a lane that returned `constraint` with no verdict genuinely
needs a scoped re-run, because there is no point to answer yet."*
**[S21](./inventory.of=seeds.case=S21-a-lever-that-draws-no-budget-is-an-escape.md) struck it** —
*"they should never … as it defeats the budget system."*

⚠️ **the correction is left visible rather than swept**, because the gap between the two seeds is
itself the lesson. this seed settled a **mechanism** — a hand-run review mints no `.given`, so it
discharges no debt. that is still true. what it did **not** settle is whether the act is
*permitted*, and a reader who holds the mechanism will still reach for the act unless the seed
answers that too.

⇒ 🔴 **and one did.** hours after this seed was written, its own author filed the hand-run review
as a **driver-owned lever** in `rule.always.spend-own-levers-before-escalation` — with this page
open. the carve-out above is the sentence that permitted it.

**the sanctioned answer to a lane with no verdict is `rhx route.mutate.guard`** — narrow that
lane's `--paths-with`, trim its `--conversation`, and let the **guard** run it. the lane then
costs its budget round and mints a `.given` that gates
(`rule.forbid.hand-run-reviews`, `rule.always.diagnose-reviewer-malfunctions`).

## .landed

- three background `rhx review` runs killed
- `review/scoped/i029.r001.repo-rules.src-domain-operations.md` — **deleted 2026-09-07.** its two
  nitpicks were both closed in code first: `nitpick.1` by the `compareStrings` extraction,
  `nitpick.2` by the fail-loud in `asPeerReviewLevelBySlug` plus a unit clamp. ⇒ the findings were
  real and the artifact carried no authority, so the points were kept and the file was not
