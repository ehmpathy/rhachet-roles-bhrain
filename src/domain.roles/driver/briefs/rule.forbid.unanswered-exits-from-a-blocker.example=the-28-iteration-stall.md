# example: the 28-iteration stall — a drive that never once answered a reviewer

- **date** = 2026-08-31 → 2026-09-03 (~9 days)
- **repo** = `ehmpathy/rhachet-brains-anthropic` @ `beav/feat-frontier-claude-models`
- **stone** = `5.1.execution.from_vision`

## 🔴 .provenance — read this before you cite a number below

**every count in this file is REPORTED, never measured by its author.** the source is
`0.wish.md` of `v2026_09_03.fix-contemplation-gate-on-entrance`, which a reflector compiled from
the drive as it ran.

⚠️ **the cited branch is unreachable.** `gh api -X GET repos/ehmpathy/rhachet-brains-anthropic/branches`
returns `main` alone — checked 2026-09-04. so the artifacts these counts came from cannot be
re-read, and a reader who tries will find a 404 rather than a contradiction.

⇒ **treat the numbers as MOTIVATION, never as premise.** the vision that authored this rule reached
the same verdict and recorded it in its `.groundwork`. what made the case checkable was the
**mechanism** — an edit moved the whole-artifact hash, and a hash move retired an unanswered debt —
read from source in this repo, line by line.

## 🔴 .the mechanism below is CLOSED — read this as a demo, never as a live defect

the entrance gate (`setStoneAsPassed.ts`) and the slug-keyed debt (`getLatestPeerGivensPerSlug.ts`)
shipped in this repo. an edit no longer retires a debt, so **the first exit in the rule's table is
refused outright** and the reproduction below cannot be re-run against current source.

⇒ **the rule it evidences still binds.** four of its six exits have no gate at all, and each turns
on whether an artifact means what it says — a judgment rather than a state. see the `engine` column
in `rule.forbid.unanswered-exits-from-a-blocker`.

## ✅ .the mechanism, MEASURED — a first-party reproduction, PRE-FIX

**the counts above are reported; this is not.** measured 2026-09-04 in
`ehmpathy/rhachet-roles-bhrain` @ `beav/fix-contemplation-gate-on-entrance`, stone
`5.1.execution.from_vision`, in the very round that authored this rule.

a peer round wrote 9 givens at hash `402b9a0ecc4e3a471a`; **5 carried blockers**. the driver then
repaired the code those reviewers asked it to repair, which moved the artifact hash. then:

```
$ rhx route.stone.set --stone 5.1.execution.from_vision --as contemplated --that repo-rules
🦉 contemplated: repo-rules
   └─ this reviewer raised no blockers — no critique to answer, no response needed
```

the same for all five slugs. **five unanswered blockers, reported as no critique to answer** —
because the read was keyed to the current hash and the givens sat at the prior one.

⇒ the sharp part is what it took to trigger: **no attempt to escape.** the driver was not tempted;
it was mid-repair. the exit opened on its own, which is why *"a driver who chooses to answer"* is
not a control — it was a preference, and a preference is not enforcement. the takens in that round
exist because this rule said so, and for no other reason.

⇒ **that lesson outlives its own repair.** the engine now refuses this exit; **four others in the
rule's table still rest on exactly this preference**, and no gate reaches them.

## .what was reported

| measure | value |
|---|---|
| iterations at one stone | **32** |
| `.given.by_peer` files | 282 at i024, 300+ by i032 |
| 🔴 **`.taken.by_self` for i001–i028** | **zero** |
| first `.taken` | **i029** |

blockers per round: `4,3,2,1,2,1,3,4,1,1,1,2,4,2,6,6,2,2,2,1,3,4,2,2,1`

⇒ **stationary. never 0, and no descent across 25 rounds of review.**

## 🔴 .the exit that was taken, 28 times

the driver had two doors and took the cheap one every round: **edit the artifact, re-roll.** the
whole-artifact hash moved, every cached clean verdict died, all N reviewers re-ran, and the blocker
count reset to a fresh sample of whatever they happened to raise.

**no rule was broken visibly.** the artifact changed each round. the reviewers ran each round. the
driver was not idle — it was busy. what never happened was a **reply**.

## ✅ .the cure, first-party in the same tree

at ~i029 the code settled, the hash held still, the extant exit gate finally bit, and takens got
written. `i032 r010` reads:

> *"converged: 2 blockers → 1, and the one left is money"*

**three rounds.** the same reviewers, the same artifact, the same rubrics — and the only variable
that changed was that the driver started to answer.

⚠️ **a second, first-party observation, and it is weaker evidence than it reads.** on
`rhachet-roles-bhrain` `v2026_09_03` the author saw nitpicks run **11 → 0 across six rounds** once
`.taken` files started to land. but that route's `passage.jsonl` is sealed behind `route.mutate.guard`
mid-drive, so the series could not be re-read at the time this was written. it is one drive, by the
same author, with no control arm — **suggestive, and not a controlled result.**

## .what it teaches

1. **a busy loop is not a convergent loop.** 25 rounds of genuine work moved the count nowhere
2. **absence of a re-raise is not agreement** — it is a sample of a stochastic reviewer
3. **the cost of the cheap exit is not one round; it is every round after it**
4. 🔴 **the driver could not see it.** each round felt like progress. only the count, read across
   rounds, shows the flat line

⇒ the rule this evidences: `rule.forbid.unanswered-exits-from-a-blocker`
⇒ the engine repair it motivated, now shipped: `setStoneAsPassed.ts` (the entrance gate) and
`getLatestPeerGivensPerSlug.ts` (the slug-keyed debt)
