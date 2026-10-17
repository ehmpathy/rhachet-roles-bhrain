# F16 · the report trees stay inline in each init

## .the fork
- (a) leave each report tree inline in `init.claude.status-line.sh`, one echo block per outcome
- (b) lift one in-file `emit_report status= rows…` renderer, and make the outcome functions return codes

## .taken, and why at the time
(a). each outcome (configured, already configured, skipped, removed, not configured, malfunction)
prints a different row set and a different stream (stdout or stderr), and every tree is snapped, so
a reader sees the exact bytes beside the outcome that prints them. a renderer would take the rows as
arguments and move the bytes away from the branch that names them. the outcome functions end in
`exit 0` by design: each is a terminal outcome, and its name says so (`warn_not_configured`,
`skip_for_foreign`).

## .rework
clean — a renderer is one function plus its call sites; the snapshots pin the bytes, so a lift that
changes none stays green.

## .confidence — 70%, and why it is not higher
the headers repeat about seven times, and the rule of three is met. a wisher who weighs repeat over
locality would take (b). the real home for the shared shape is a rhachet primitive for init reports,
which two filed dreams already ask for.

## .where
`src/domain.roles/driver/inits/init.claude.status-line.sh`.

## .verdict
open — for the wisher
