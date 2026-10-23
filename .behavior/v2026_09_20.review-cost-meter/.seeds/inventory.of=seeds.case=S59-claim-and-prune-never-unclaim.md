# S59 — claim and prune, never unclaim

- said 2026-10-15, as a correction: the edit that drops a glob from a held partition set had
  shipped as `--unclaim`

## .said

> whats claim vs unclaim? unclaim is a gross term; why do we need it?

(the answer offered two moves — strike the flag and let the stale-glob cure print a whole
`--partition` re-declaration, or keep it renamed `--release` — and recommended the strike. the
wisher first took the strike, then, mid-edit:)

> oh, how about --prune

> --claim and --prune

## .settled

- the two edits of a held partition set are `--claim` (add a glob into a partition) and `--prune`
  (drop a glob from the partitions that hold it); `--partition` still replaces the whole set
- `unclaim` is not a word of this contract. it read badly, and it overloaded `unclaimed`, which
  already names a changed file no partition holds
- the stale-glob cure stays one paste: the applied tree closes its flag on the `--prune` command

## .landed

- `src/domain.operations/route/guard/partition/asRouteGuardPartitionPruneCommand.ts`
- `src/domain.operations/route/guard/partition/asRouteGuardPartitionPruneRefusal.ts`
- `src/domain.operations/route/guard/partition/asRouteGuardPartitionPrunesOfFlags.ts`
- `src/domain.operations/route/guard/partition/asRouteGuardPartitionsPruned.ts`
- `src/contract/cli/route.ts`
