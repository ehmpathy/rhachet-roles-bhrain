# seed S20 — cure the review tool, never route around it in one guard

archived verbatim, before distillation (`rule.always.archive-the-wishers-words-verbatim`).

## .the utterance

> can we fix the parser instead ?

> otherwise other users will have that same defect

> cure the review tool

## .settled

- a defect met in a shared tool is repaired **in the tool**. a workaround written into one
  guard protects one lane and leaves every other user of the tool on the defect
- the defect was not where it was first blamed. the parser and the enumerator honor a brace in
  the extension slot (`'**/*.{ts,sh,md,snap}'`) exactly; the two scope blocks rendered only the
  deprecated `--paths` flag, so a supplied `--paths-with` read `paths: (none)`. the render lied,
  and the lie named the wrong culprit

## .what prompted it

the driver narrowed the `repo-rules` lane by hand in the guard and wrote a note that blamed the
parser for the brace drop.

## .landed in

- `src/domain.operations/review/asReviewScopePathLines.ts` — one render for both scope blocks
- `stepReview.integration.test.ts` `[case3][t1]` — clamp, proven red under the old render
- `enumFilesForReviewSubjects.integration.test.ts` `[case3]` — the brace-in-extension clamp
