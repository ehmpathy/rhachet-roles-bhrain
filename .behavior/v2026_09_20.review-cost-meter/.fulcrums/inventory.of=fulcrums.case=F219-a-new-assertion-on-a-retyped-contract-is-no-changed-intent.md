# F219 — a new assertion on a retyped contract is no changed intent

## .the fork

mech-test-intent (5.3, i001, partition review-cli) raised blocker.1: case13 of
`review.parseReviewArgs.test.ts` asserts `options.rules` equals `['r.md']`, and the lane read that as
an extant scalar assertion `'r.md'` swapped to an array — a test-intent violation.

- **concede** — revert the assertion to a scalar
- **dispute** — the assertion is new, and the array is the contract

## .taken — dispute, and why at the time

- the hunk that holds case13 is all additions on this branch (`git diff main`: `@@ -126,4 +125,455`).
  main holds no case13, so no extant expectation changed
- `--rules` was multi-valued on main already: its help reads `glob pattern(s)`, and the arg check
  tests `Array.isArray(options.rules)`. main typed it `string` and cast to it — a type that lied
- this branch types it `string[] | undefined` (`review.ts:327`), and every consumer reads
  `options.rules ?? []`. the assertion clamps the truthful type

## .rework

clean — one assertion line, and the type it rests on.

## .confidence

90% — the diff and main's own check settle it. the 10% is whether a reader holds that a type fix
owes a note in the PR body; it does not change behavior.

## .where

`src/contract/cli/review.parseReviewArgs.test.ts:379` · `src/contract/cli/review.ts:327`

## .verdict

unruled — awaits the council.
