# domain.term.reason: education.pursuit.ledger

## .etymology

a ledger reconciles two columns: what is owed and what is paid. the pursuit's ledger reconciles
the plot (the courses owed) against the disk (the courses taken), and names the difference: the
open, the owed, the strays. the word carries the reconciliation, which is the concept's whole job.

rejected:
- `status`, `state` — a single value; the ledger is a set of reconciled lists
- `progress` — implies a fraction toward an end; a revised plot can grow the owed list
- `tally` — a count; the ledger names each course, not how many

## .evidence

- three readers once each derived "every course done" on their own and could disagree: a judge
  could pass a pursuit that `pedigree set` then refused. one ledger, read by all three, closes it
- journey `[case4][t1]`: a plot that drops an open course leaves a stray; the pursue judge holds
  and `pedigree set` refuses, both off the same ledger

## .invariants

- owed = plotted − exited, in plot order
- strays = held on disk − plotted
- an open course, plotted or stray, blocks graduation
