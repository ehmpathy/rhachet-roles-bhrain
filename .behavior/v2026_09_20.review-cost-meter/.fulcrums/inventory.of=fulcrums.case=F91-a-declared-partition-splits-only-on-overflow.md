# F91 — a declared partition is a permission, and splits only on overflow

## .the fork

| option | for | against |
|---|---|---|
| **a. split only when the whole prompt would overflow** | a run that fits stays ONE prompt — one cache anchor, one cost, the reviewer sees cross-partition context | the run's shape changes with branch size |
| b. always split when declared | predictable shape | every small branch pays N prompts and loses the cross-file view for no gain |

## .taken

**a.** S33's word is *allowed* partitions: the author permits a split, the size decides it. the run
first compiles the whole scope; only a `ReviewContextOverflowError` triggers the split.

🔴 the behavior spec rides EVERY partition (S31): a target under the run's own route dir is shared,
never assigned. the route is recovered from `--output` the same way the meter recovers it
(`asReviewRunIdentity`), so a hand run with no route shares naught.

a partition that still overflows refuses on its own, and its refusal names it — the driver narrows
that prefix further.

## .rework

**clean** — one branch at the compile seam.

## .confidence

80%.
