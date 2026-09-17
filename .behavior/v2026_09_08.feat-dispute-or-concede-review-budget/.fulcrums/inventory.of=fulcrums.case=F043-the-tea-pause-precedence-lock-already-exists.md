# F043 — the tea-pause precedence lock already exists

## the fork

`enroll-impl-behavior-intent` (r010, i008) states: *"no acceptance test asserts that precedence
holds. this is the single highest-consequence surface in the whole design ... and a future
refactor could silently reorder the two checks ... with zero test to catch it."*

## taken

dispute. `stepRouteDrive.integration.test.ts` `[case14]` — *"an undeclared concern, on a driver
already past the tea-pause threshold"* — asserts exactly this: with the stuck-driver count past
threshold and an undeclared concern still open, the stance prompt renders, both `--as conceded`
and `--as disputed` are taught, and the emit does NOT contain `you must choose one` (the
tea-pause menu's own header string). in isolation: 79/79 passed, this case among them.

## why disputable

a future reorder of the two checks would flip this exact assertion from pass to fail — that IS
the regression lock the reviewer asks for.

## rework

clean. no code or test changes owed.

## confidence

95% — verified by an isolated test run, dated 2026-09-16.
