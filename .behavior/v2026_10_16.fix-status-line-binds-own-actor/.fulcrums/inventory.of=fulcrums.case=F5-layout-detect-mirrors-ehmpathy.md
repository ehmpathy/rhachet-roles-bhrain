# F5 · pick the target by layout, as the ehmpathy permissions init does

## .the fork
- **A (taken)** — split if `settings.json` is a link or `settings.of.repo.json` exists; else old → `settings.json`
- **B** — always `settings.of.repo.json`; drop the old layout

## .taken, and why at the time
reuse pavement: `rhachet-roles-ehmpathy@1.39.5 init.claude.permissions.sh:52-55` already settled
this exact detect, and noted that a linked `.claude` dir alone is not a split signal (rhachet 1.48
links it on the old layout too). B would write a file an old-layout claude never reads.

## .rework
clean.

## .confidence — 85%

## .verdict
— (open)
