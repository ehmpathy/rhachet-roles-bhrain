# F19 — a seat whose cwd drifted into a subdir keeps the one fallback line (5.3 enroll-verif-snapshot-blemishes i004 blocker.1 disputed)

## .the fork
- a: anchor the bound command at the repo root (`git rev-parse` per repaint, or an absolute path baked at init), or name the cwd in the fallback text
- b: keep the relative command and its one fallback line; a drifted cwd is a cataloged alterpath (case 34)

## .taken, why
b, for this pr. the harness runs the status line from the project dir, where the settings that bind it live, so the relative path holds for the seat the wish describes (case 1). a cwd that drifted below the root is case 34, cataloged `sharp` and snapped in survives-layout case4: the line is not silent, it names a fix. option a has a cost each way: `git rev-parse` adds a process to every repaint, against a wish whose subject is per-repaint cost. an absolute path breaks when a worktree moves. a reworded fallback changes `COMMAND_OF_STATUS_LINE` in every bound seat's settings (see F18). the harm the reviewer names is a wasted `rhx init` for a drifted seat; it ships no wrong line and no lost state.

## .rework
clean in code (one constant, one template, its snapshots); dirty in reach, since bound seats hold the string until each re-runs init.

## .confidence
75%. below 93% because the harness cwd for a session started in a subdir was not measured here. flagged for the commander: if such sessions are common, the fallback should name the cwd.

## .where
`init.claude.status-line.jsonc` · `COMMAND_OF_STATUS_LINE` · catalog case 34.

## .verdict
open — disputed in i004, flagged for the commander.
