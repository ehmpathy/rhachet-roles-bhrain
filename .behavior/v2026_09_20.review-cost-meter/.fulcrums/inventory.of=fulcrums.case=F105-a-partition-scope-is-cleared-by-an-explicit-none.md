# F105 — a partition scope is cleared by an explicit `none`

## .the fork

each `route.guard.partition` declaration replaces the whole set for its scope, and the
`--set`/`--del` verbs are gone. so no verb remains to clear a scope: to drop one reviewer's
override (so it falls back to `@all`), or to clear `@all` itself.

- (a) `--partition none` — an explicit empty set, which deletes the scope
- (b) a `--del` flag beside `--partition`
- (c) no verb; a hand edit of `$route/.route/partitions.json`

## .taken — (a), and why at the time

- it keeps one verb shape: a declaration names the whole set, and `none` is a whole set
- (b) re-opens the two-verb surface the whole-set settlement closed
- (c) sends the driver to a file the tool owns, past its shape check
- `none` cannot collide with a real partition, since a real one is `<slug>=<globs>` and needs an `=`

## .rework — clean

one flag value, parsed in one CLI entry, and one branch in the pure replace op. no caller
depends on it yet.

## .confidence — 85%

the wisher was asked and drove on with no answer. the residual is a preference for a named
`--clear` flag over a sentinel value.

## .where

`src/contract/cli/route.ts` (`routeGuardPartition`) ·
`src/domain.operations/route/guard/partition/asRouteGuardPartitionsReplaced.ts`

## .verdict

— (awaits the council)
