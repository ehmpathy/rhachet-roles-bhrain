# F34 — the clean fixture repair and the host-count cure are test repairs, not intent changes

- **the fork:** two test inputs moved at 5.3. (a) revert both and accept the red · (b) keep both,
  each with its cause on record
- **taken:** (b).
  - `codebase-mechanic/src/clean.ts`: three paragraph comments restated the line below them
    (`// return the computed total` above `return total;`), a true positive against the
    rubric's redundant-comment rule. a fixture named `clean` must be clean on its face, so the
    three became intent comments of equal length; 1178 bytes kept, so the 23 suites that share
    the fixture keep their token estimates. the rubric is unchanged
  - `review.join-intersect` / `review.rules-only-default`: each counted the files a host's
    `roles link` wrote, so `since-main` read the host. a helper now commits the link output.
    `[case2]` is named *intersect mode with empty diffs*, so `files: 0` is its intent and `7` was
    the leak; `[case1]` still covers a non-empty intersect (`targets: 1`, only `dirty.ts`)
- **rework:** clean — a revert of each
- **confidence: 85%**
- **where:** `blackbox/.test/assets/codebase-mechanic/src/clean.ts`, `blackbox/.test/setTempRepoCommit.ts`,
  the two `.snap` files; `5.3.verification.yield.md` names each
