# F15 — pre-extant thinker test skips outside the changed set are caught, not removed, at 5.3

## .the fork

the 5.3 skip scan over all of `src/` found, beyond the claude-sonnet `describe.skip` already
handed to the foreman: 7 thinker suites under `describe.skip` (+ one `when.skip`), and two `.only`
under `thinker/.scratch` (excluded by jest config, so never run). none of these files is touched
by this branch, and none ran in this stone's suites.

the same scan found a `then.skipIf(!hasAwsCredentials())` pair in `reflect/snapshot/backupSnapshots`.
that pair is NOT part of this fork: it was safe and clean, so it was fixed in this stone (source
check before the credential probe; the probe takes `env: process.env`; the test empties `PATH` so
the absent-credential path runs on any host). see the 5.3 yield, zero-skips section.

- **A — remove the thinker skips here**: un-skip the suites and fund their brain calls, or delete
  dead ones with their steps
- **B — catch them as a dream and leave them for their own change**

## .taken — B, and why at the time

- not clean: each fix needs a paid brain, so an un-skip turns the suite red rather than green
- the thinker call (keep the step and fund it, or delete the step with its suite) is a scope
  decision about another role, outside the token inventory this route builds
- the work is caught with its shape of fix:
  `.dream/v2026_10_22.fix.pre-extant-test-skips-outside-the-changed-set.md`

## .rework — clean

if the council rules A, the change is the listed test files (plus deletion of any dead thinker
step), with no touch to this branch's feature code.

## .confidence — 75%, and why it is not higher

the 5.3 stone reads "zero skips" without a scope bound, so a reader may hold it to the whole
repo rather than to the suites this branch runs.

## .where

- `src/domain.roles/thinker/skills/*/step*.integration.test.ts`
- `.dream/v2026_10_22.fix.pre-extant-test-skips-outside-the-changed-set.md`

## .verdict

open.
