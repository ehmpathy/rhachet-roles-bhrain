# F18 — the fallback line keeps the status line's "state, fix" grammar (5.3 ergo-blemishes i003 nitpick.3 disputed)

## .the fork
- a: reword the fallback to `status line reader not found; run rhx init --roles driver`, and wrap the command in the help
- b: keep `status line reader not found, rhx init --roles driver`, and print the bound command whole

## .taken, why
b. every degraded line on the status line reads `state, fix`: `status unknown, rhx route.drive` is the shipped form, cataloged in the vision. one grammar for one surface; a status line is a single short row, so the verb is cut on purpose. the long help row is the literal command the init binds; a human copies it, and a wrap would break the copy. the same string is pinned by `COMMAND_OF_STATUS_LINE`, so a reword is a contract change across the init, its snapshots, and every bound seat.

## .rework
clean in code, dirty in reach: the string lives in bound seats' settings until each re-runs init.

## .confidence
90%.

## .where
`src/domain.operations/route/statusLine/asStatusLineHelp.ts` note; `COMMAND_OF_STATUS_LINE`.

## .verdict
open — disputed in i003.
