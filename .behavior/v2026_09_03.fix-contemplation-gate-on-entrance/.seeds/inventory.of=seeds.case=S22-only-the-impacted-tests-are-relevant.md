# seed S22 — only the impacted tests are ever relevant

## .said

> and they should never ever be encouraged to run `--thorough` tests. since only the impacted
> tests are ever relevant

> and enrule so infact they are never done

> and dispatch the test one into rhachet-roles-ehmpathy as well

## .settled

> **a wider test run is not a stronger one. the tests your change impacts are the only tests that
> carry evidence about your change.**

the bare invocation already computes that set — `--changedSince <trunk tip>`, diffed against the
**merge-base**, so the selection is this branch's own changes and no more. `--thorough` deletes
that bound.

⇒ **it is a subtraction dressed as an addition.** it removes the one piece of knowledge the run
held about your work, and returns suites whose verdicts are facts about `main`.

**the cost is a diagnosis, not a budget.** 100 suites and one red hands you a haystack; 3 suites
and one red hands you the defect. ⇒ **the narrower run is the more informative one** — which is
what makes the wide run forbidden rather than merely wasteful.

## 🔴 .the same defect, on a second surface

it is `--paths-with` with no `--diffs` bound, in a different coat: **112** targets against a delta
of **21** files, and every item it raised named code that predates the branch.

⇒ **a scope flag that drops its bound returns plausible observations about work that is not
yours.** there the drop was silent and therefore a defect; here it is the flag's whole purpose.

## ⚠️ .*"enrule so in fact they are never done"* — the escalation is the point

the first instruction alone (*"never encouraged"*) is satisfied by deletion of the recommendation.
the second raises it: **a recommendation removed still leaves the act available.**

⇒ so the artifact is a **forbid at blocker strength**, and its enforcement fires on the
recommendation as well as the act — *"a brief, readme, skill, or comment that recommends it =
blocker"* — because **the recommendation is how the flag survives**.

## 🔴 .the tool recommends it, at the worst possible moment

`git.repo.test.sh:1431-1435`, on a run that selected zero tests, prints
*"use `--scope` and `--thorough` to target tests directly"*.

⇒ **half right.** zero-selected means the change detection missed the file you edited.
`--scope 'path://<file>'` **names** it, so the next run reports which one. `--thorough` runs all
of them and never reports it.

⚠️ **a tip printed by the tool carries the tool's authority, and it is met at the exact moment a
rule against the flag is hardest to recall.** ⇒ this is why the dispatch was ordered in the same
breath as the rule: the brief is rung 1 and cannot outrank the surface it governs.

## .landed

- `.agent/repo=.this/role=any/briefs/rule.forbid.thorough-test-runs.md` (+ `.md.min`) — new
- `.agent/repo=.this/role=any/briefs/rule.prefer.scoped-tests-locally.md` (+ `.md.min`)
- `.dream/v2026_09_07.reseed.the-zero-selected-tip-recommends-thorough.md`
- `ehmpathy/rhachet-roles-ehmpathy#663` — the dispatch, both asks in one task
