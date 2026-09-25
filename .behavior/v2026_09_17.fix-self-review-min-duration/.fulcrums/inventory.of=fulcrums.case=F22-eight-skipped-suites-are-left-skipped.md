# F22 — eight skipped suites are left skipped, against the verification stone's own letter

- **raised**: 2026-09-23, at `5.3.verification`
- **rework**: clean
- **status**: OPEN
- **confidence**: 80%

## .the fork, stated fairly

the `5.3.verification` stone's mandate carries a clause with no hedge in it:

> **zero skips** — *"if you detect it, you fix it."*

the scan detected **15** hits. eight of them are genuine, live skips: llm-backed suites, each
deferred by a prior traveler because the brain call is slow, costly, or non-deterministic. **not one
of them lives in a file this round touched.**

| option | what it does |
|---|---|
| **A** | **resolve all eight now.** the stone's letter, taken literally |
| ✅ **B** — taken | **catch a dream, raise this fulcrum, and hand the call up.** the round's diff stays scoped; the work is on record with its shape |
| **C** | resolve the two cheapest and defer six |
| **D** | argue the stone's clause down — *"zero skips" means zero NEW skips* — and record naught |

## .what was taken, and why at the time

**B.** the SAFE/CLEAN test (`rule.always.fix-forward-under-scouts-honor`) fails **both** questions:

| question | answer |
|---|---|
| **SAFE?** | 🔴 no — the eight belong to roles this round never opened. a `when.repeatably` conversion changes what each asserts and how long it takes; a deletion changes coverage for a subject the drive has not read |
| **CLEAN?** | 🔴 no — it ripples into files, roles, and a ci scope this diff never intended to open |

⇒ a deferral that fails both owes a **dream** (the work) and a **fulcrum** (the judgment). both are
filed: `.dream/v2026_09_23.fix.eight-llm-suites-are-skipped-and-no-gate-counts-them.md`, symlinked at
`$route/dreams/`.

## 🔴 .the rework, and why it is CLEAN

the deferral is reversible at zero cost to this round's deliverable. naught here hardens against the
eight suites; no caller leans upon their absence. a council that rules **A** re-opens eight files in
another round and this round's diff is untouched.

## 🔴 .the tension a council must actually rule on

it is not *"are eight skips acceptable?"* — plainly they are not. it is a **conflict between two
rules this repo ships**, and the drive resolved it alone:

| the rule | what it says here |
|---|---|
| the verification stone's letter | **REMOVE the skip. no exceptions.** an exception clause is what turns a gate into a suggestion |
| `rule.always.fix-forward-under-scouts-honor` | a change that ripples into an untouched role is a **smuggled refactor**, and its own enforcement block grades that a **blocker** |

⇒ **both are absolute and they point opposite ways**, and the drive took the second. ⚠️ a reader who
grants the first is entitled to call this row a violation rather than a deferral, and the entry states
that plainly rather than treatment of the second rule as though it obviously dominates.

🟡 **the general form, which outlives this instance**: *a stone's zero-tolerance clause is scoped to
the stone's own diff, or it is not — and no artifact in this repo says which.* a verification stone
that inherits a repo-wide defect either owns the whole repo or owns its round. this round assumed the
second.

## 🔴 .the half the drive believes is the real deliverable

resolve the eight and the ninth lands next quarter unremarked, because **no gate counts them.** there
is no lint rule, no ci step, and no guard that tallies skipped suites — the count is reachable only by
a hand grep whose output must then be hand-classified.

and the grep **over-reports by 62%** on this repo: 13 of its 15 hits are innocent (2 excluded by
`jest.integration.config.ts:29-34`, 2 complementary-predicate pairs, 2 prose false positives, plus 7
more that resolve on a read). ⇒ so the only instrument available is one that cries wolf twice for
every real hit, which is a good account of how eight accumulated with no round that flagged them.

🔴 **and the toll is larger than the file count reads.** the integration run states it directly —
`tests: 1185 passed, 0 failed, **63 skipped**` — so the eight are *suites* and the real count is
**63 cases**. ⇒ the grep under-states by ~8× while it over-states hits by 62%; **the one instrument
available is wrong in both directions at once.**

⇒ the dream's part 2 is what makes part 1 stay fixed: **surface the runner's own `skipped` field and
let a guard assert it is zero.** `git.repo.test` already computes it and discards it, so the repair
needs no grep, no four-class filter, and no config knowledge. **a council that rules A without it
buys one clean scan and no guarantee.**

## .why 80% and not higher

the drive is confident the ripple is real and the dream is the right record. it is **less** confident
that a verification stone may scope its own zero-tolerance clause to its own diff, because no artifact
says it may. ⇒ the 20% is that clause, not the cost estimate.

## .the verdict, once ruled

_(unrecorded — open)_

## .see also

- `.dream/v2026_09_23.fix.eight-llm-suites-are-skipped-and-no-gate-counts-them.md` — the work, with the
  four-class table and the config cite
- `rule.always.fix-forward-under-scouts-honor` — the test this deferral was graded against
- `rule.always.catch-dreams-for-followups` — why a dirt deferral owes both artifacts
- `rule.require.repeatable-for-llm-tests` — the pattern eight of these suites want
