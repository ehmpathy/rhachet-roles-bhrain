# F284 — a prune names its partition only when it must

## .the fork

| option | the contract |
|---|---|
| `--prune <globs> --from <slug>`, `--from` required | each drop names its partition; a glob held twice drops from one |
| **`--prune <globs> [--from <slug>]`** ✅ | no `--from` drops the glob from every partition that lists it; one `--from` serves all; one per `--prune` pairs by position |

## .taken, and why

a stale glob matched no changed file, so its drop from every holder can orphan naught — the
whole-set check still refuses any drop that would. a required `--from` makes the driver look up the
slug the stale flag already printed, and blocks the paste-ready cure from one line: the cure the
applied tree prints names no `--from`, so it drops the stale glob wherever it sits. `--from` stays
for the one case that needs it — a shared-context glob several partitions hold on purpose, where
the driver means to drop it from one.

the cure is offered only on an applied tree. on a plan the glob is not yet held, so the cure is to
drop it from the `--partition` flags the driver is about to send.

## .rework — clean

`--from` turns required by one branch in `asRouteGuardPartitionPrunesOfFlags` and one line in the
cure command. no persisted shape changes.

## .confidence — 85%, and why not higher

the `.dream` that seeded this settled the contract with a `--from`. that reads as a required
`--from`; this keeps it optional, on the argument above. if the dream meant it required, flip the
default.

## .where

- `src/domain.operations/route/guard/partition/asRouteGuardPartitionPrunesOfFlags.ts`
- `src/domain.operations/route/guard/partition/asRouteGuardPartitionsPruned.ts`
- `src/domain.operations/route/guard/partition/asRouteGuardPartitionPruneCommand.ts`
- `src/contract/cli/route.ts` — `routeGuardPartition`, its flags and `--help`

## .verdict

the verb is settled by S59: `--prune`, never `--unclaim`. the `--from` default stays open.
