# self-review r1: has-pruned-yagni

## what was requested

from vision:
> move write and hash from node to shell

from criteria:
- capture snapshot with large staged diff succeeds
- capture snapshot with small staged diff succeeds (behavior unchanged)
- capture snapshot with empty staged diff succeeds
- both staged and unstaged diffs captured

from blueprint:
- refactor `setSavepoint.ts` so diff content never enters node
- apply mode: shell redirect to file, hash/size from file
- plan mode: shell pipes for hash and size (no files written)

---

## what was implemented

### additions

| change | justification |
|--------|---------------|
| shell redirect for apply mode | explicitly requested in blueprint |
| shell pipes for plan mode | explicitly requested in blueprint |
| portable hash fallback `(sha256sum \|\| shasum)` | macos compatibility, noted in blueprint |
| `fs.mkdirSync` before shell redirect | noted in blueprint § implementation detail |

### removals

| change | justification |
|--------|---------------|
| removed `crypto` import | no longer needed (hash via shell) |
| removed `computeHash` function | no longer needed (hash via shell) |
| removed `maxBuffer` usage | never used, removed dead path |

### unchanged

| element | justification |
|---------|---------------|
| `Savepoint` interface | explicitly unchanged per blueprint |
| `setSavepoint` signature | explicitly unchanged per blueprint |
| `generateTimestamp()` | explicitly retained per blueprint |
| `fs.writeFileSync(commitPath, ...)` | explicitly retained (small, no buffer issue) |

---

## yagni checklist

| question | answer |
|----------|--------|
| was each component explicitly requested? | yes |
| is this the minimum viable implementation? | yes |
| are there "future flexibility" abstractions? | no |
| are there "while we're here" features? | no |
| is there dead code? | no (removed `computeHash`) |
| are there unused imports? | no (removed `crypto`) |

---

## conclusion

implementation matches vision, criteria, and blueprint exactly. no extras added. dead code removed.

r1 complete.
