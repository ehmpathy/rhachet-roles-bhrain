# F1: a guard fault exits 1, so its notice is seen

## .the fork

when memory.guard cannot run (skill not linked, cli absent, import or guard throws, deadline passed), what does the hook exit with?

- **exit 0 + a stderr line** — the wish's literal text, and the issue's fix shape.
- **exit 1 + a stderr line** — a non-block error in claude code.

both let the call proceed. they differ in who sees the line.

## .taken: exit 1

claude code docs (read 2026-11-01): "Claude never sees stderr from a hook that exits 0"; it goes to the debug log. a non-0, non-2 exit renders a `<hook> hook error` notice with the first stderr line, and "your hook didn't stop the action." so exit 0 keeps the flow and silently loses the one line the wish asks for — the line that is the whole mitigation of fail-open. exit 1 keeps both.

## .rework: clean

one exit constant in the hook command and one in `memory.guard.sh`, plus the clamp assertions. no caller, contract, or later stone depends on the choice.

## .confidence: 85%

high that exit 1 serves the wish's intent (never halt, name the fault). held below 93% because it departs from words the wisher wrote outright, in the outcome and in three clamps (caseA, caseA2, caseD: "exit 0"). the clamps are kept in spirit: "allowed" is asserted as "not exit 2, the call proceeds".

## .where

`1.vision.yield.md` `.the contract`; `1.vision.experience.case=_.md` row 31; `case=6`.

## .verdict

ruled 2026-11-01 by the director at the `1.vision` approval: **exit 1 holds.** stderr on exit 0 never reaches the human. seed `S1`.
