# F92 — per-partition verdicts merge by sum, into one output

## .the fork

S33 open: how per-partition verdicts merge back into one given for the lane.

| option | for | against |
|---|---|---|
| **a. one `--output` file, one section per partition, counts summed; stdout emits the two numeric lines ONCE** | the guard's contract is unchanged — it reads one stdout and one report | a partition's verdict is not separately gated |
| b. one given per partition | finer debt | the guard keys debt by lane slug; N givens per slug breaks the absorb grammar |

## .taken

**a.** each partition is its own run (own log dir, own meter row, tagged `partition` in its args), so
cost stays attributable. the lane's report concatenates each partition's review under a
`## partition: <name>` header, and the stdout tally is the sum. a concern keeps its partition header,
so a driver can still address it by ordinal within the merged given.

🟡 stdout of a partitioned run prints ONE final summary — the per-partition summaries go to stderr
— so the guard's count regex cannot double-read.

## .rework

**clean** — the merge is one transformer over N formatted reviews.

## .confidence

70% — a per-partition gate may be wanted later; it would add, not replace.
