# F282 — a diff keeps the fulcrum summary and drops its cases

| field | value |
|---|---|
| rework | clean |
| status | 🟡 BEST-GUESSED 2026-10-14 |
| confidence | 75% |
| where | `src/domain.operations/isTargetPolluter.ts` — `DIRS_OF_ROUTE_ARTIFACT_SUMMARY_ONLY` |

## .the fork

| option | what a `--diffs` lane reads from `.fulcrums/` |
|---|---|
| A — keep all (the prior allowlist) | the summary and every case file |
| **B — keep the summary only (taken)** | `.fulcrums/*._.md`; every case file is a polluter |
| C — keep the summary plus the cases a dispute cites | B, plus each case path named by a passage absorption's `fulcrum` |

## .taken, and why at the time

B. this route's `.fulcrums/` held 187 case files, 17.0% of a lane's target mass, and a lane
graded each one as code. the summary carries one row per case with its status, so a lane that
must know a call was reserved reads it there. the seed that settled the narrow names C as the
destination; B is the half that ships with no new contract.

a glob that names a case file by path still keeps it (`getAllTargetsAskedForByName`), so a guard
that wants a case read can say so.

## .rework, and why clean

one constant and one predicate branch. a revert to A restores `'.fulcrums'` to the whole-dir list;
the clamp in `isTargetPolluter.test.ts` [case7] goes red on that revert (proven: 3 failed).

## .confidence, and why it is low

a lane that disputes a concern with a fulcrum case as its ground now reads only that case's
summary row, not its argument. no measured round has shown whether the row alone suffices. C
closes the gap and is caught as a dream (`admit-dispute-cited-fulcrum-cases`).

## .verdict

(unruled)
