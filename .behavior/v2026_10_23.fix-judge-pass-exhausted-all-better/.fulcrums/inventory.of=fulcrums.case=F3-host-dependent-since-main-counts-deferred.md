# F3 — host-dependent `since-main` file counts in two acceptance suites are deferred

## .the fork

two review acceptance suites (`review.rules-only-default`, `review.join-intersect`) pin file
counts read off `--diffs since-main`. on this host they fail (7 cases); in CI they pass.

- **A** — fix it in this route: make the suites hermetic (a temp repo with a fixed base) so the
  counts cannot vary with the host's branch state
- **B** — defer it to its own route, with a dream

## .taken — B, and why

- the defect predates this branch and touches none of the stance key, the judge, or its halts
- the fix is not small: each suite must build its own git fixture with a fixed merge-base, and
  every pinned count and snapshot in both suites changes with it. that ripples into files this
  fix does not open — DIRTY, per `rule.always.fix-forward-under-scouts-honor`
- CI is the gate for this PR, and both suites are green there, so no harm ships from the deferral

## .rework — clean

the deferral blocked naught. its dream held the shape of the fix until the 5.3 cure retired it.

## .confidence — 80%, and why it is low

the ripple estimate is a best guess from a read of the two suites, not a measured attempt.

## .where

`blackbox/review.rules-only-default.acceptance.test.ts`, `blackbox/review.join-intersect.acceptance.test.ts`.

## .verdict

B was taken at 5.1, then reversed at 5.3 to A: the verification stone forbids a failure carried
forward, and the cure proved small once measured, so the 5.1 ripple estimate (the 80% above) was
wrong in the cheap direction.

- the cause, read off the run's own `input.scope.debug.json`: every `since-main` target in a clean
  temp repo was a file `roles link` wrote — `.agent/.actors/…` and `.agent/readme.md` — and that
  set varies by host (`settings.of.grove.json` lands only inside a grove) and by run (the root
  `.gitignore` negation; case1 of `rules-only-default` had already met it, 8 targets vs 7)
- the cure: `blackbox/.test/setReviewerRoleLinked.ts` links the role and commits what it wrote into
  the base, so a diff range holds only the test's own edits. used at the 7 sites of the two suites;
  case1's prior ad hoc commit folded into it
- proof: both suites green, 39 + 54 passed; every snapshot count moved to the value its test's own
  comment claims (empty diffs → 0, union → the 2 `src` files, exclusion → `src/newfile.ts`)
- the 43 other `roles link --role reviewer` sites pin no diff count and stay untouched; the dream is
  retired by this cure
