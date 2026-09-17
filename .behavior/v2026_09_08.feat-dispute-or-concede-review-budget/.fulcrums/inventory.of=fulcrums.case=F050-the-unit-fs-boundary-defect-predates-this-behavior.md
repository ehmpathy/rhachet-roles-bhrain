# F050 — `setStoneAsFeedbackAbsorbed.test.ts`'s fs-boundary misclassification predates this
behavior and is correctly deferred to an extant, repo-wide dream

## .the fork

r9 (mech-test-scope-purity) flags `setStoneAsFeedbackAbsorbed.test.ts` as a `rule.forbid.unit.
remote-boundaries` violation — a unit-named suite whose `genScene` helper writes a real temp
route to disk (`fs.mkdtemp`, real `git init`, real fs writes). the rule is correctly cited. two
paths:

- **A — concede and fix now**: rename to `.integration.test.ts`
- **B — dispute**: the pattern predates this behavior (the same `genScene` shape, with the same
  `fs.mkdtemp`, sits on `origin/main` — roughly 44 unit suites in this repo share it), and the
  prescribed destination already exists (`setStoneAsFeedbackAbsorbed.integration.test.ts`) but
  cannot run locally: `jest.integration.env.ts:96` demands five brain keys of every integration
  suite, and neither suite calls a brain. a rename right now converts a green test into a dead
  one under this harness constraint.

## .taken

**B.** disputed, with this fulcrum as the argument. the file's own header comment already
carries this argument in full and points at the pre-behavior dream:
`.dream/v2026_09_04.fix.unit-suite-crosses-the-fs-boundary-repo-wide.md` — confirmed extant via
`globsafe`, dated 2026-09-04, four days before this behavior (v2026_09_08) dispatched.

## .why disputable

the reviewer is correct that the rule is violated, and correct that the file is new (so "it
predates my diff" is not, on its own, a full defense — a driver could still be asked to fix a
pattern they merely copied). a reader could reasonably want the harness fixed and the suite
put in its correct place as part of this very PR, rather than left to a separate dream.

## .rework

**clean.** no code in this behavior's own feature (the dispute/concede mechanism) depends on
this test's classification. a later move costs a rename plus a harness fix, neither of which
touches this behavior's shipped logic.

## .confidence

85%. the two facts that ground it are independently verified, not asserted: the pattern's
pre-behavior existence (checked against `origin/main`'s copy of the same `genScene` shape) and
the dream's extance and date (checked via `globsafe`, dated before this route dispatched). the
residual uncertainty is whether a reviewer would weigh "already broken, ~44x" as sufficient
grounds to defer a NEW file's instance of an old pattern, rather than require this PR fix its own
copy regardless of scale.
