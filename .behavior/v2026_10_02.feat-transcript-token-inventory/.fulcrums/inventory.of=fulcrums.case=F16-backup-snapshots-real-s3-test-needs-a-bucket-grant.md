# F16 — a real-S3 test for `backupSnapshots` needs a bucket this repo does not own

## .the fork

i001 r003 (`mech-external-contracts`, blocker.1) asks for an integration test that runs a real
`aws s3 sync` against a real bucket and asserts the uploaded result. two choices:

- **A** — concede, and write that test now
- **B** — dispute: the gap is real, but its close needs a grant no driver can make; hand it up

## .taken — B, and why at the time

- the gap predates this branch. on `main` the file already closed with *"actual s3 sync test
  requires real bucket access"*; this branch touched the file only to remove two `skipIf` bypasses
  (5.3 self review 2/8), which made two error cases run on every host
- no bucket in this repo is ours to write to: `rhx grepsafe --pattern 's3://' --path src` names
  only `s3://test-bucket` (a placeholder, AccessDenied on this host) and the cli usage example
- a bucket is infrastructure (`rule.prefer.terraform`), and its credential is a keyrack grant. both
  are human-owned (`rule.always.spend-own-levers-before-escalation`)
- a `.taken` converges an argument, never an absence (`rule.always.raise-a-blocker-a-taken-cannot-close`).
  to concede commits to a fix i am not permitted to make

## .rework — clean

once a bucket and a keyrack key exist: one `given` in `backupSnapshots.integration.test.ts` that
syncs a temp dir of two files into `s3://<bucket>/<run-id>/`, asserts `fileCount = 2` and
`totalBytes`, then deletes the prefix. one file, no prod change.

## .confidence — 80%, and why it is not higher

the reviewer's rule says *"lack of credentials is not an excuse. get them, or fail the gate."* if
the council reads this file as within the wish's scope, the gate holds until the bucket exists;
the handoff names that ask either way.

## .where

- `src/domain.operations/reflect/snapshot/backupSnapshots.integration.test.ts`
- `5.3.verification.handoff.v1.to_foreman.md` — the bucket + key ask

## .verdict

open — for the council.
