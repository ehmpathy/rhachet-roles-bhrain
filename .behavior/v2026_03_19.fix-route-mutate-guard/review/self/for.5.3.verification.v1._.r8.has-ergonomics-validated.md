# self-review: has-ergonomics-validated (r8)

## question

on eighth review: does input/output match what was planned?

## repros absence

no repros artifact was created for this fix. the ergonomics were defined in the wish and blueprint directly.

## ergonomics validation

### guard input/output

**planned (from wish)**:
- allow writes to `.route/xyz/` when bound to that route
- block writes to `.route/xyz/.route/` (metadata)

**implemented**:
- guard allows `.route/xyz/artifact.md` → exit 0
- guard blocks `.route/xyz/.route/passage.jsonl` → exit 2

match confirmed via [case7] and [case8] tests.

### blocker path

**planned (from wish)**:
- blocker files go to `$route/blocker/`, not `$route/.route/blocker/`

**implemented**:
- `getBlockedChallengeDecision.ts` writes to `$route/blocker/`
- `stepRouteDrive.ts` writes to `$route/blocker/`

match confirmed via unit test assertions.

## conclusion

no ergonomics drift. implementation matches the planned design from wish and blueprint.
