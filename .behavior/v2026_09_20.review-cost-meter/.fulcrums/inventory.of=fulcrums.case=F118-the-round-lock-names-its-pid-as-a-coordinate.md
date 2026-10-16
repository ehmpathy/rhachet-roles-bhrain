# F118 — the round lock names its pid as a coordinate

## .the fork

the guard round lock is one file per live round under `$route/.route/.rounds/`. its name must
carry the stone, the pid, and a nonce. two extant forms:

| form | where it is used |
|---|---|
| `.pid<n>.` — bare | `genLogDirName` (`<stamp>.pid<n>.<uuid>`), the prime nonce (`pid<n>.<uuid>`) |
| `pid=<n>` — a `$key=$value` coordinate | `rule.forbid.itemization-without-coordinates`; every `repo=`/`role=`/`term=`/`case=` name |

## .taken, and why at the time

`pid=<n>` — `<stone>.round.pid=<n>.<nonce>.lock`. the `.rounds/` dir is an itemization of live
rounds, addressed by stone and pid, so the coordinate rule governs it: the axis names itself and
a glob slices it (`*.round.pid=4242.*`). the bare form predates that rule and lives on log dir
names, which no one globs by pid.

## .rework

clean. one transformer (`asStoneGuardRoundLockName`), one parser (`asStoneGuardRoundLock`), and
their tests. no lock file outlives the round that wrote it, so a rename strands no persisted row.

## .confidence — 80%, and why it is low

two forms for one fact in runtime names is itself a drift. a council may prefer one runtime form
over the coordinate rule's reach, which was written for briefs and inventories, not process
artifacts. the r4 self review first claimed a `pid=` precedent in the warmer ledger; a grep showed
none, which is why this row exists.

## .where

`src/domain.operations/route/guard/round/asStoneGuardRoundLockName.ts` ·
`asStoneGuardRoundLock.ts`

## .verdict

awaits the council.
