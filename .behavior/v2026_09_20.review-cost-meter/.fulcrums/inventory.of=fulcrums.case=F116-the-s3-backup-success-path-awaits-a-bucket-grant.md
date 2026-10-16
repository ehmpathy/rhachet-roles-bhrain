# F116 — the s3 backup success path awaits a bucket grant, and is not this stone's to buy

- raised 2026-10-06, by `behavior-intent-coverage` (blocker.2), at 5.1 i008
- re-raised 2026-10-07, by `behavior-intent-coverage` (blocker.1), at 5.1 i013 — the
  "manual smoke" disclaimer it quoted now reads as a named gap with its grant; the sync itself
  still awaits the credential
- re-raised 2026-10-07, by `behavior-intent-coverage` (blocker.1), at 5.1 i014 — new argument:
  "credential difficulty is no exception: get them, or fail the gate", and "this PR touches this
  seam". answered in `.the i014 answer`, below
- re-raised 2026-10-07, by `behavior-intent-coverage` (blocker.1), at 5.1 i015 — no new argument:
  it restates (a) "credential difficulty is no exception" and (b) "a fulcrum is not a
  resolution". both are answered below; `.agent/keyrack.yml` still holds no AWS credential
- re-raised 2026-10-08, by `behavior-intent-coverage` (blocker.1), at 5.1 i024 — no new argument;
  disputed per concern with this fulcrum as its `--why`, so the council rules on it once
- re-raised 2026-10-12, by `mech-external-contracts` (blocker.2), at 5.3 i003 — corrects the claim
  that the sync was byte-identical to main (it quotes its paths and names its env now); the hold on
  the grant stands
- rework: **clean** — one `then` that syncs a temp dir to a real bucket, once a credential exists
- status: 🟡 **BEST-GUESSED — dispute the blocker; the close needs a human grant**
- confidence: **75%**

## .the fork, stated fairly

`backupSnapshots.integration.test.ts` asserts every refusal branch (bad uri, absent source,
absent credentials, absent cli) and carries a note that the real `aws s3 sync` is a manual smoke.

| option | the claim |
|---|---|
| **A — hold the carve-out, dispute** | the note and the absent success case are byte-identical on `origin/main`. this branch REMOVED two `skipIf(hasAwsCredentials())` guards, so every case now runs on every host — coverage rose. no AWS credential nor bucket exists in `.agent/keyrack.yml` (env.test holds only brain keys) |
| **B — add a real s3 call** | `rule.require.external-contract-integration-tests` names credential difficulty as no exception, and the file is in the diff |

## .taken, and why

**A.** the close is not a change the driver is permitted to make: it needs an AWS credential
and a bucket provisioned and granted into the keyrack — a human's grant
(`rule.always.raise-a-blocker-a-taken-cannot-close`). the seam this branch touched is the
credential PROBE, and that seam is now covered on every host. the sync line changed only in how it
quotes its two paths (one single-quoted shell word each) and in the env it names; that argv is
clamped by `[case3][t2]` with a fake `aws`. the real call still needs a bucket grant.

## .rework, and why

**clean.** once a human grants `AWS_*` for a test bucket into `env.test`, one `then` that syncs a
temp dir and lists the prefix closes it.

## .confidence, and why it is not higher

the rule's letter makes no carve-out for a main-born gap in a touched file, so a strict reader
holds B.

## .the i014 answer

- **"get them, or fail the gate"** — the gate is not passed. it is held on this fulcrum for the
  council, and the stone cannot pass while the blocker stands. that IS the failed gate; a driver
  cannot "get" a credential the keyrack does not hold, since a credential grant is a human lever
- **"this PR touches the seam"** — measured against `git diff origin/main`: the branch changed
  the credential PROBE (a `ConstraintError`, `isErrorOfChildExit`, the order of the checks) and
  the immutable fold in `getDirectoryStats`. the `aws s3 sync` call changed in its shell words and
  env only, and `[case3][t2]` clamps that argv; the real call is untested.
  the touched seam is covered on every host now; the untouched one still awaits the grant
- **a test that throws on an absent credential** was weighed and declined: it reddens CI on every
  host that lacks the bucket, and it still makes no real call. it would trade a named gap for a
  permanent red, and buy none of the coverage the rule asks for

## .where

`src/domain.operations/reflect/snapshot/backupSnapshots.integration.test.ts`

## .the ask, as a command a human can run

```sh
rhx keyrack fill --owner ehmpath   # add an AWS test credential + bucket to env.test
```

## .verdict

— (awaits the council)
