# F93 — a split run meters its whole attempt as `refused`, at $0

## .the fork

when a partitioned lane overflows, the whole attempt compiled a prompt, sent naught, then split.
its own log dir still exists. what does the meter say about it?

| option | for | against |
|---|---|---|
| **a. the whole attempt meters as `refused`, $0; each partition meters as its own run** | truthful — the whole attempt sent no brain request, so a nil is a FACT. the partitions carry the real spend | the tree census shows one extra `refused` row per split lane, which reads as a failure at a glance |
| b. the whole attempt meters as the SUM of its partitions | one row per lane round | double-counts — the partitions already meter themselves, so the tree total would be 2× the spend |
| c. the whole attempt writes no log dir | no extra row | the overflow evidence (`tokens.expected.md`, the locus) is lost, and it is what a driver reads to tune the partitions |

## .taken

**a.** the meter law is that `unknown` renders absent and a known nil renders `$0`; a split whole
attempt is a known nil. its log dir keeps the expected-token census the driver tunes partitions by.
each partition run is tagged `partition` in its args, so a census can tell a split from a true
refusal when one is wanted.

## .rework

**clean** — a later census can fold a `refused` row whose peer partition rows exist into a
`split` state, with no change to what is written on disk.

## .confidence

70% — the `refused` row is honest, but a reader of `--of tree` may misread it as a failed lane
until a `split` state names it.
