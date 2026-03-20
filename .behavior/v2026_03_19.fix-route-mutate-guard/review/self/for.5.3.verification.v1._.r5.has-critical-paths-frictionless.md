# self-review: has-critical-paths-frictionless (r5)

## question

on fifth review: is the fix complete for the declapract.upgrade use case?

## declapract.upgrade specific verification

the wish mentioned `rhx declapract.upgrade` as the motivator. verify the full flow:

### expected flow

1. `rhx declapract.upgrade init` creates route at `.route/v2026_MM_DD.declapract.upgrade/`
2. mechanic binds to this route
3. mechanic works through stones, writes artifacts
4. guard allows artifact writes
5. guard blocks metadata writes (passage.jsonl, etc.)

### verification

| step | friction? |
|------|-----------|
| route creation | n/a (not changed by this fix) |
| bind to route | no — bind works for `.route/` routes |
| artifact writes | no — guard allows |
| metadata writes | no — guard blocks with guidance |

### the original problem

before: writes to `.route/xyz/` were blocked because guard saw `.route/` in path

after: writes to `.route/xyz/` are allowed; only `.route/xyz/.route/` is blocked

the declapract.upgrade use case now works as intended.

## conclusion

the fix resolves the original problem. declapract.upgrade flow is frictionless.
