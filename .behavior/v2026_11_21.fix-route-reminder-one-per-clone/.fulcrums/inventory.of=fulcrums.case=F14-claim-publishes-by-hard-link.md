# F14 — the handle claim publishes by hard link, with no `wx` fallback

- **fork**: (a) temp file, then `fs.link` (EEXIST = lost); any other link fault is a write fault · (b) the same, plus a fallback to an exclusive `wx` create on `EPERM` / `ENOTSUP` / `EOPNOTSUPP` · (c) the `wx` create alone, as before
- **taken**: (a). the handle home sits in the clone's own git worktree (`.agent/.cache/…`), and a git worktree lives on a local dev fs (ext4, apfs, btrfs, xfs), all of which take hard links. (c) reopens the torn handle that wedged the clone (i005 blocker.1). (b) adds a branch that no test on this host can reach, and on `EPERM` it cannot tell "no hard links" from a permission fault, so it would mask a real one. a link fault surfaces loud through the sync's fault path, which names the io fault, so a host without hard links is seen at once rather than guessed at
- **rework**: clean — the fallback is one catch arm in `claimExclusiveWrite`; no caller reads how the claim publishes
- **confidence**: 80% — a clone run from a FAT or some network mount would never arm its reminder, and none such host is known to run a clone
- **where**: `5.1.execution.from_vision` · round i006 · enroll-impl-behavior-intent nitpick.10 (item 10)
