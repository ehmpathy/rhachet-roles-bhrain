# F173 — the aws backup refusals are pinned at integration, not by an acceptance snapshot

- raised 2026-10-07, by `ergo-friction-hazards` nitpick.1 at 5.1 i017
- rework: **clean** — one new acceptance case, if the council wants it
- status: 🟡 **BEST-GUESSED — integration clamp, no acceptance snapshot**
- confidence: **75%**

## .the fork, stated fairly

`rhx reflect.snapshot.backup` refuses two ways a human can hit: `aws cli not found` (the shell
exits 127) and `aws credentials not found` (sts refuses). the lane asks for an acceptance case
that snaps each refusal's stderr.

| option | the claim |
|---|---|
| **A — clamp at integration** | `backupSnapshots.integration.test.ts` already forces each branch as a fact of the block (an impossible `AWS_PROFILE`; an empty `PATH`). each now asserts the class (`ConstraintError`, so exit 2) and the whole fix sentence, so a reword or a dropped fix line goes red |
| **B — snap at acceptance** | invoke the skill with a scoped env and `toMatchSnapshot()` the stderr |

## .taken, and why

**A.** both refusals carry the aws cli's own stderr as metadata, and that text is the host's
(the cli version, the shell that reports a 127). the backup's source dir sits under the HOME-rooted
reflect storage, so an acceptance case must also seed a real HOME path or redirect HOME. an
"absent cli" acceptance case must strip from PATH every dir that holds `aws` while it keeps
`bash`, `node`, and `rhx` — on a host where `aws` sits in `/usr/bin`, that is not possible. a
snapshot that changes per host is a flake, which `rule.require.snapshots` does not ask for.

## .rework, and why

**clean.** if the council prefers B, it is one `given` in
`blackbox/reflect.snapshot.backup.acceptance.test.ts`, with a mask over the metadata `stderr`
field and a HOME redirect; no production code moves.

## .confidence, and why it is not higher

a mask over the metadata line plus a HOME redirect could make B stable on hosts that have the aws
cli; the "absent cli" variant is the one with no portable form.

## .where

`src/domain.operations/reflect/snapshot/backupSnapshots.ts` ·
`src/domain.operations/reflect/snapshot/backupSnapshots.integration.test.ts` ·
`blackbox/reflect.snapshot.backup.acceptance.test.ts`

## .verdict

(open)
