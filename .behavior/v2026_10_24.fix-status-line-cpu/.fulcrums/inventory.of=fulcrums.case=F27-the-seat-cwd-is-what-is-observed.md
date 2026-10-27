# F27 — a seat's cwd is what the instrument observes

- **the fork:** `rule.forbid.cwd-outside-gitroot` flags each cwd this pr sets. (a) remove every
  one · (b) remove each that can go, keep each whose cwd IS the subject, scoped and inside a
  root the code is meant to see
- **taken:** (b). removed at 5.3: `gen.consumer-patch`'s three `cd` subshells became `git -C`, a
  `find -printf '%P'`, and a `realpath`. kept, each for one reason:
  - `route.status.line.show --unbound` runs node in its own unbound seat: the status line reads
    `process.cwd()` as the seat, by the harness contract, so the cwd is what is measured. the seat
    sits under `.scratch/`, inside this gitroot, so node still finds the package
  - the acceptance suites spawn each skill with a temp repo as its cwd: the skill reads that
    repo as its gitroot. that is the hermetic seat the test owns (`rule.require.hermetic-tests`),
    never a move away from the root a skill resolves against; each skill is called by absolute
    path, so no skill lookup rides the cwd
  - the two `process.chdir` sites are F8, scoped and restored in `finally`
- **against:** the rule's incident was a cwd that broke skill lookup; none of these resolves a
  skill or a glob against the moved cwd
- **rework:** dirty to (a) — the status line would need a `cwd` input it does not have, and each
  bind op too (F8)
- **confidence: 80%**
- **where:** `.agent/repo=.this/role=any/skills/route.status.line.show.sh`,
  `gen.consumer-patch.sh`; the four new `blackbox/*.acceptance.test.ts`
