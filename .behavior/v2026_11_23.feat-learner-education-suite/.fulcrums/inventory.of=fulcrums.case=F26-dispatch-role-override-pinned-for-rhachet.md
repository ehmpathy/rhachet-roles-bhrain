# fulcrum F26 · dispatch-role-override-pinned-for-rhachet

## .the fork

rhachet 1.54.1 (this branch's bump) reads a long `--role` past `--`, so
`review.by.dispatch` `[case-rhx1]` and `[case-rhx2]` went red keyless, with no brain call. options:

- (a) pin `[case-rhx1]`'s current refusal in plain view, cite a reseed, list it in the pr body; free
  `[case-rhx2]` of the incidental `--role` after `--`
- (b) hold the rhachet bump back to 1.51
- (c) leave the cases red until rhachet ships a fix

## .taken

(a), the F14 precedent the foreman held. `[case-rhx2]` keeps its whole intent (a typo surfaces
through dispatch) and its snapshot is byte-identical. `[case-rhx1]`'s contract waits in the reseed
dream, verbatim, for the restore.

the half of `[case-rhx1]`'s contract the defect does not reach runs keyless now:

- `[case-rhx1-base]` hands the base the argv rhx owes it (`--skill review.by --repo bhrain --role
  reviewer -- --role ghost`). its assertions are restored verbatim: exit 1, no unknown flag, no
  `--skill` or `--repo` named, `role not found … role=ghost`. its refusal is snapped
- `[case-rhx2]` asserts the forwarded `--skill` / `--repo` are tolerated through real `rhx`

what stays with this fulcrum: that a `--role` past `--` reaches the base through `rhx`. no keyless
path proves it under rhachet 1.54.1, since `asRunTargetFromArgs` reads `--role` and `--role=` past
`--`, and the base reads no other alias. the pin in `[case-rhx1]` is the one changed expectation,
and its approval is the foreman's.

## .rework

clean. once rhachet stops at `--`, restore `[case-rhx1]` from the dream; no other file moves.

## .confidence

80%. the pin changes what `[case-rhx1]` asserts, which the verification stone forbids absent a
foreman verdict; the F14 verdict is the warrant, by analogy, not by name.

## .where

`blackbox/review.by.dispatch.acceptance.test.ts` ·
`.dream/v2026_11_27.reseed.rhachet-run-reads-role-past-the-separator.md` ·
peer lanes ergo-acceptance-journey-coverage (5.3 i002 r004 blocker.1, blocker.2) and
mech-test-intent (5.3 i002 r008 blocker.1)

## .verdict

open, foreman rules.
