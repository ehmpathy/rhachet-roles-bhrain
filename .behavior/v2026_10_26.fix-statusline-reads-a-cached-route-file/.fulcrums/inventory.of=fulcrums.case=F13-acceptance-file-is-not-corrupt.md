# F13 — the acceptance file is not corrupt

- **the fork:** mech-external-contracts (5.3 i001 r003, blocker.1) reports that
  `src/contract/cli/routeStatusLine.acceptance.test.ts` is merge-corrupted: a truncated `.replace(`
  in case17, `+`-prefixed diff lines in the source, and `setRouteBind` / `MESSAGE_OF_MULTI_BIND`
  code spliced in from another test. (a) concede and repair; (b) dispute with the file's own bytes
- **taken:** (b). the file holds none of it:
  - `rhx grepsafe --pattern '^\+|setRouteBind|MESSAGE_OF_MULTI_BIND|case17' --path src/contract/cli/routeStatusLine.acceptance.test.ts`
    finds no `+`-prefixed line, no `setRouteBind`, no `MESSAGE_OF_MULTI_BIND`; it finds only the
    four intact case17 blocks (`case17`, `case17b`, `case17d`, `case17c`)
  - the suite compiles and runs: `rhx git.repo.test --what acceptance --against local --env test --mode apply --scope 'path://routeStatusLine'`
    → `92 passed, 0 failed, 0 skipped`, exit 0, run after the review and again after this round's edits
  - the spliced code the reviewer quotes is `setRouteBind.integration.test.ts` case6 (its multi-bind
    pointer mark). the reviewer's prompt holds both diffs back to back; it read the boundary between
    them as one file
- **rework:** clean — no code changes either way
- **confidence:** 99%. the doubt: none in the file; only in why the reviewer joined the two diffs
- **where:** `src/contract/cli/routeStatusLine.acceptance.test.ts`
