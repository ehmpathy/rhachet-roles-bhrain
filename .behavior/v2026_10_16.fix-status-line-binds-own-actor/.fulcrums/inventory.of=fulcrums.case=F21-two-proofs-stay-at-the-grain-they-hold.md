# F21 · two proofs stay at the grain they hold: the reach note is not framed by the real cli, and the bound command is not run

## the fork
- (a) hold both at their grain: the reach note is pinned in the init suite, and the bound `node -e` command is
  pinned as a literal there and as a whole by the help acceptance suite
- (b) add two acceptance cases: `rhx init --roles driver` with `CLAUDE_CONFIG_DIR` set to a peer actor's brain
  dir (snap the framed reach block), and a case that reads `statusLine.command` from `settings.of.repo.json`,
  runs it in the fixture, and snaps the output

## .taken, and why at the time
(a), on both.

**the reach note.** the init reads `CLAUDE_CONFIG_DIR` from its own env. rhachet passes its env to each init
child, which the real-cli `[case4]` journey shows for `HOME` and `PATH`; the one new fact (a nested subtree
inside rhachet's gutter) is a render of rhachet's frame, which F18 holds as captured. the cost of (b) is a
fixture with a peer actor plus a live session env, for a note that is a fail-safe line.

**the bound command.** `routeStatusLine.acceptance.test.ts` runs the same `node -e` shape against the built
package (48 cases), and `package.json` exports `./cli/route`. the init suite pins that the `.jsonc` command is
the literal the acceptance suite runs. a case that reads the command back from the settings file and runs it
would pin the join of the two; the join is two equal literals.

## .rework
clean — two acceptance cases, no change to prod code.

## .confidence — 70%, and why it is not higher
the join of the two literals is the unproven part. a drift in one of them without the other would pass today.
a clamp that compares the two literals directly would close that at unit grain, and it is the better fix if the
wisher wants (b).

## .where
`blackbox/driver.init.status-line-survives-enroll.acceptance.test.ts`,
`src/contract/cli/routeStatusLine.acceptance.test.ts`,
`src/domain.roles/driver/inits/init.claude.status-line.jsonc`.

## .verdict
the bound command is now run, not copied: `routeStatusLine.acceptance.test.ts` reads `statusLine.command` from
`init.claude.status-line.jsonc` and swaps only the import specifier for the absolute file url (it throws if the
command no longer imports `rhachet-roles-bhrain/cli/route` via `node -e`). 48 passed. the reach note stays at the
init-suite grain (held).
