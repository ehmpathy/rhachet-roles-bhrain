# F2 · a run with no clone is not a refusal

## .the fork
- **A (wish option)** — no clone → `ConstraintError`, exit 2, no write
- **B (wish option)** — bind every actor in the repo
- **C (taken)** — no clone needed; write the repo actor's file (F1), which every actor derives from

## .taken, and why at the time
`rhx init --roles` runs role inits from the caller's shell (`getRolesLinkedFromFound` →
`execRoleInits`), which throws on a nonzero exit. A would fail every human `rhx init --roles
driver`. C reaches the same end as B, via rhachet's own derivation, with no loop over actor dirs
whose files rhachet rewrites anyway.

## .rework
clean.

## .confidence — 92%
moot if F1 is overruled; then A's breakage of `rhx init` is the live question.

## .where
`init.claude.status-line.sh` — no whoami call at all.

## .verdict
— (open)
