# F9 — the pointer gets its own file

- **the fork:** pr #700's node cache record already sits at `branch=<flat>.json` and holds a
  `route` field. (a) the bash reader reads that record's `route`; (b) the writers write a distinct
  pointer, `branch=<flat>.route`, in the same dir, whose one line is the route path
- **taken:** (b). the node record is written only by the node reader on a miss, it may hold
  `route: null` for an unbound seat, and its age rule is the node path's own. a shared file would
  give two writers with two contracts one set of bytes. a plain one-line file is also the cheapest
  bash read: `read -r` and no parse
- **rework:** clean — one path transformer and the reader's one read change
- **confidence:** 90%. the doubt: two files per branch in one dir may read as a duplicate to a
  later reader. each carries a `.what` header that names its owner
- **where:** `src/domain.operations/route/statusLine/file/asRouteStatusLinePointerPath.ts`
- **raised for the council (i004, enroll-impl-arch-defects):** (c) the pointer under `$git_dir`,
  keyed by the raw branch path as git's refs layout is, with the flag name on a second line. it
  survives a cache wipe and a fresh worktree, and drops the bash `sanitizeBranchName` twin and its
  parity test. the no-pointer fallback (reader case4b) now covers the fresh-worktree read, so (b)
  holds until the commander rules; a move to (c) reworks the path transformer and the reader's one
  read, a clean rework
