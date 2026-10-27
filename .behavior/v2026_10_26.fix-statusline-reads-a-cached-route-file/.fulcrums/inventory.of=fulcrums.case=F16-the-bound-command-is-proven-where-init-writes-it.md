# F16 — the bound command is proven where the init writes it (5.3 mech-test-intent i003 blocker.1 disputed)

## .the fork
- a: the node acceptance suite keeps a derivation of its command from `init.claude.status-line.jsonc`, so it tracks what the init binds
- b: the node acceptance suite pins the node command a node-era seat still runs; the current bound command is proven by the suite that owns it

## .taken, why
b. the init no longer binds a node command, so a derivation from the init's config would now yield the bash reader and the node suite would test a command it does not own. the current bound command is clamped in `src/domain.roles/driver/inits/init.claude.status-line.survives-layout.integration.test.ts`: it asserts `statusLine?.command` equals `COMMAND_OF_STATUS_LINE` and runs that exact command under bash, three repaints snapped. `route.status.line.integration.test.ts` covers the reader itself. a regression in what init binds turns that suite red, not this one. no current file declares the node command, so the pin cannot drift from a source.

## .rework
clean: a derivation could be restored in one test file, no caller touched.

## .confidence
95%. the coverage moved, it was not dropped; the files that hold it are named above.

## .where
`src/contract/cli/routeStatusLine.acceptance.test.ts` header `.note`.

## .verdict
open — disputed in i003.
