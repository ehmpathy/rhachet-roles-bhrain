# F231 — a worktree hash oracle replaces one a dirty tree breaks

- raised 2026-10-12, by `mech-test-intent` (nitpick.1), at 5.3 i003
- rework: **clean** — a hermetic temp-repo case would restore a HEAD oracle
- status: 🟡 **BEST-GUESSED — disputed**
- confidence: **85%**

## .the fork, stated fairly

`getGitBlobHashes` read its expected hash from `git ls-tree HEAD`. the oracle now reads it from
`git hash-object` over the worktree file.

| option | the claim |
|---|---|
| **A — worktree oracle** | `tsconfig.json` is modified on this branch, so the HEAD oracle failed a correct hash of the worktree content. that is a fixture defect, not a code defect |
| **B — restore the HEAD oracle** | an oracle that changed beside the code it checks can drift to agree with it |

## .taken, and why

**A.** both oracles are git's own blob hash, never this repo's code. so the oracle stays as
independent as before. the old oracle ran `git ls-tree`, the same command the code runs for a
committed, unchanged file. a HEAD oracle needs a file the suite can rely on to be clean, and this
tree has none (`.gitignore`, `package.json`, and `jest.unit.config.ts` are dirty too).

## .rework, and why

**clean.** a new case on a `genTempDir({ git: true })` repo with one committed file would restore a
HEAD oracle. that is a new case, not a nitpick fix.

## .confidence, and why it is not higher

a strict reader prefers an oracle that shares no command with the code under test. the temp-repo
case would give them that.

## .where

`src/domain.operations/review/getGitBlobHashes.integration.test.ts`

## .verdict

— (awaits the council)
