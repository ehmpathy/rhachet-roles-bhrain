# F18 — reminder copy moves with its peer concessions

## .the fork

three reminder strings changed in this pr, each with the assertion that pinned it:

- `CIRCUIT-BROKEN` → `circuit-broken` (and `will NOT re-spawn` → `will not re-spawn`)
- `no daemon was ever registered` → `no daemon is registered`
- the hint `auto-resolves` → `auto-derives`

a test-intent review reads any changed criterion as a blocker. the choice:

- **A.** revert the strings, so each old assertion holds as written
- **B.** keep the new strings, with each assertion moved to match

## .taken

**B.** each change answers a peer concern already absorbed on this route, and each serves a rule the old copy broke:

- the caps: ergonomist i001 nitpick.1, `rule.forbid.shouts` (no shouted words in output a human reads)
- `ever registered`: behavior-intent i006 nitpick.3. a clone that held a daemon, then lost it, was told it never had one; `is registered` is true in both cases
- `auto-resolves`: the term blocklist (`resolve` is a forbidden term in this org)

the criterion under each assertion is unchanged: the same state still yields a line that names it. `not.toContain('ever registered')` in cli case14 t1 guards against a regression to the old, false copy.

## .rework

clean. three string literals and their assertions; no caller parses these lines.

## .confidence

80%. the copy is a human's to approve, and only peers have ruled on it.

## .where

`src/contract/cli/route.reminder.ts`; cli case2, case13, case14, case16; acceptance case13.

## .verdict

open: for the council.
