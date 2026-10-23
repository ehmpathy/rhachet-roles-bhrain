# F122 — the misclassified unit suite waits on the integration harness

- raised 2026-10-07, by peer lane `behavior-intent-coverage-route` nitpick.1 at 5.1 i012
- rework: **dirty** — a harness change that ripples into ~44 suites, and into the keyrack contract
- status: 🟡 **BEST-GUESSED — dispute it**
- confidence: **85%**

## .the fork, stated fairly

`setStoneAsFeedbackAbsorbed.test.ts` is named at unit grain while its `genScene` writes a temp
route to disk and runs `git init` — a filesystem and git boundary
(`rule.forbid.unit.remote-boundaries`, `rule.require.test-coverage-by-grain`).

| option | the claim |
|---|---|
| **A — rename this suite to `.integration.test.ts` now** | the grain is honest at once |
| **B — repair the harness first, then reclassify the whole class in one sweep (taken)** | the rename alone turns a green suite into one that cannot run locally |
| **C — rewrite the suite onto injected fakes** | the boundary leaves; but the suite clamps a REAL route on disk, which is the property it exists to prove |

## .taken, and why

**B.** `jest.integration.env.ts:96` calls `keyrack.source({ env: 'test', owner: 'ehmpath', mode:
'strict' })` for every integration suite, so a suite that calls no brain still demands the brain
keys. a rename under that harness converts a green, local test into one that fails at setup on any
host without an unlocked keyrack. the defect predates this behavior: the same `genScene` and
`fs.mkdtemp` sit on `origin/main`, and ~44 unit suites share the pattern. the suite's own docblock
names the misclassification and the order of repair.

the work is caught: `.dream/v2026_09_04.fix.unit-suite-crosses-the-fs-boundary-repo-wide.md`.

## .rework, and why

**dirty.** the cure is a harness change (a per-suite keyrack demand, or a split jest project for
suites that need no keys) and then a ~44-file rename. both reach past this behavior's diff.

## .confidence, and why it is not higher

- a lighter harness cure may exist (skip the strict source where a suite declares no brain), which
  would make A cheap for this one suite — not measured
- the reviewer graded it a nitpick; a council may prefer A for this file alone, with the class
  left to the dream

## .where

`src/domain.operations/route/stones/setStoneAsFeedbackAbsorbed.test.ts` (docblock at the head) ·
`jest.integration.env.ts:96`

## .verdict

— (awaits the council)
