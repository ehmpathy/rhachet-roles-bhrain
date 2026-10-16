# F83 — the per-directory locus stays at `--of run`

- rework = 🟢 **clean** — an additive fold and one more render block; no contract a caller holds moves
- confidence = 🟡 **85%**
- raised.by = r012 repo-rules-review-ops (nitpick.1), at i053

## .the fork

r012 asks the `--of tree` and `--of grove` by-input census to carry a per-directory locus, so a
reader can name a directory to prune without a drop to `--of run`
(`rule.require.report-both-cost-levers-with-trend-and-locus`, obligation 4).

the locus is computed by `asPromptSectionChars`, and that reader takes the **rendered prompt** —
`input.prompt` — as its input. the tree and grove folds read `metrics.compiled.json`, which records
each named input's chars and no per-path mass. so a roll-up locus means one of:

| option | what it yields |
|---|---|
| A — read every run's rendered prompt at tree/grove | a megabyte-scale read per run, across thousands of runs, for a roll-up — the cost the vision struck |
| B — record the locus into `metrics.compiled.json` from now on | a forward fix: new runs carry it, every extant run does not, so the roll-up locus covers a share that shifts round by round |
| C — keep the locus at `--of run`, state the bound | the by-input census ships at all three breadths; the address of a directory is one `--of run` away, and the help says so |

## .taken — C

- the vision yield settled this cell: *"the per-directory locus stays at `--of run`: it needs a read of each rendered prompt, which a roll-up does not pay for"* (`1.vision.yield.md`, item 3 of the struck-corpus section)
- the help states it beside the breadths: *"the per-directory rows need a read of each rendered prompt, so they stay at --of run"*
- the rule's own boundary admits it: the test is whether a reader can act, and the census names which input to prune at every breadth, beside its unread count

## .why confidence is not higher

option B is real and cheap for new runs. a reader may hold that a partial locus, labelled with its
coverage the way the census already labels its unread count, beats none. that is a later round's
lever, and a clean one.

## .verdict

🟡 BEST-GUESSED 2026-10-02 as C; REVERSED 2026-10-03 to B, clean. a reviewer re-raised the locus at i054, and option B proved cheaper than read: the compiler already holds each target path and its chars at compile time, so `metrics.compiled.json` now records a `locus` row (`asCompiledLocus`), and the tree and grove census sums it with its coverage stated (`from N of M read runs`). a run older than the record reads as absent, never as zero. the filename keeps the slug of the fork as raised.
