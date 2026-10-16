# F103 — a clean fixture must be clean by the rubric's own rule

## .the fork

`mech-test-intent` @ 5.3.verification i002, nitpick.3: the learner acceptance clean case widened
its scope — the target now ships with its glossary in view. the reviewer reads the change as a
broadened scope to make a flaky case pass.

- (a) concede it — restore the old `src/clean.ts` scope
- (b) dispute it — the old fixture was dirty by the rubric's one rule
- (c) halt for a human

## .taken — (b), and why at the time

the term-aggregation rubric makes a declared operation whose terms are not itemized a blocker. the
old `src/clean.ts` declared two operations and held no glossary, so a reviewer that rejected it read
the rule correctly, and `exit 0` pinned a coin flip. the fixture now meets the rubric's definition
of clean, with the glossary in scope so the reviewer can see it. the detect case still proves the
rubric bites on a dirty file, and now also asserts a non-zero blocker count. the rationale sits on
`PATHS_OF_CLEAN` (`review.by.learner.acceptance.test.ts:22–31`).

## .rework — clean

a restore is one constant; the cost is a flaky case back in the suite.

## .confidence — 90%

the rubric text is unambiguous. the residual is that the council may want a second clean case with
zero declared operations, as a narrower proof.

## .where

`blackbox/review.by.learner.acceptance.test.ts:22–31`

## .verdict

— (awaits the council)
