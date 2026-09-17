# F048: `blackbox/review.failfast-flags.acceptance.test.ts` exists — this lane cannot see it

## the fork

r009 i012 nitpick.2 claims the acceptance file that repairs review()'s three new
validation rejections is "absent from the target". it is not absent — it was added
this round and passed locally (`rhx git.repo.test --what acceptance --against local
--env test --mode apply --scope 'path://blackbox/review.failfast-flags.acceptance.test.ts'`,
10 passed).

the file lives at `blackbox/review.failfast-flags.acceptance.test.ts`. this lane's own
guard bind is:

```
--paths-with src/domain.operations/route/**, src/contract/**, src/domain.objects/**
```

`blackbox/` matches none of the three globs, so the lane's own scope excludes the file
by construction — the claim is a fact about the BIND, never about the repository.

## the taken

dispute, with this entry as `--why`.

## why disputable

the file's presence is directly checkable (a directory read, or a re-read of the
guard's own `--paths-with` line), and the lane's own scope prints above the point in
its own given. the claim is falsified by evidence this lane itself emits on every
round.

## rework

**clean.** no code change, no reversed decision — the file already exists and is
already green.

## confidence

95%. a scope-boundary miss on a lane's own printed bind is close to a mechanical check,
never a judgment call.
