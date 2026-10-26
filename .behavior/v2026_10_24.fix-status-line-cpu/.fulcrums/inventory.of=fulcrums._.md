# inventory.of=fulcrums — fix-status-line-cpu

axis: `case` (occurrences, declared as they arise).

| case | title | rework | status | confidence |
|---|---|---|---|---|
| `F1-fingerprint-of-stat-over-named-inputs` | freshness = stat of the named render inputs + a 30s max age | clean | best-guessed | 85% |
| `F2-node-fast-path-not-sh` | the fast path stays a `node -e` command, not a pure-sh cat | clean | best-guessed | 80% |
| `F3-cache-keyed-per-branch-in-agent-cache` | one cache file per branch under `.agent/.cache/` | clean | best-guessed | 90% |
| `F4-patch-pin-openrouter-0.1.4` | re-pin openrouter to 0.1.4 and slim the patch to the speed waiver | clean | best-guessed | 92% |
| `F5-hit-path-loads-leaf-src-modules` | the hit path loads 18 import-free src modules, not fs + path alone | clean | best-guessed | 80% |
| `F6-renderer-seat-is-the-lazy-module-boundary` | the lazy render ops ride an injected seat whose default composes them | clean | reversed at i002 — inline imports, no seat | 75% |
| `F7-openrouter-test-shape-is-extant` | the openrouter test keeps its extant shape; only the re-pin's move changes | clean | best-guessed | 85% |
| `F8-bind-op-cases-chdir-into-the-temp-repo` | the real bind op cases chdir, scoped, rather than thread a cwd through every bind op | dirty | best-guessed | 85% |
| `F9-degrade-rows-keep-the-fault-prefix` | the error row is qualified; the two exit-0 degrade rows keep the extant prefix | clean | best-guessed | 75% |
| `F10-the-race-racer-may-print-either-line` | the bind-vs-repaint racer may print either valid line | clean | best-guessed | 85% |
| `F11-route-dir-transformer-named-at-one-call` | the route dir join stays a named transformer at one call site | clean | best-guessed | 85% |
| `F12-cache-age-is-the-file-mtime-not-an-at-field` | the cache record stores no `at`; its age is the file mtime, a departure from the vision's letter | clean | best-guessed | 85% |
| `F13-the-error-row-gains-its-class-header` | the status line's error row opens with its class, a departure from the vision's `exactly as today` | clean | best-guessed | 85% |
| `F14-a-degraded-line-is-cached-with-its-row` | a degraded line is cached with its stderr row; each hit prints that row again | clean | best-guessed | 85% |
| `F15-the-consumer-patch-is-regenerated-last` | the consumer patch is regenerated as the last act, with no permanent clamp | clean | best-guessed | 80% |
| `F16-the-subpath-ships-with-its-own-init` | the subpath command has no fallback for an install that lacks the export | clean | best-guessed | 80% |
| `F17-the-cached-step-renders-the-unbound-blank` | the render takes `route: string`; the cached step owns the lookup and maps unbound to the one blank renderer | clean | best-guessed | 85% |
| `F18-absence-catch-per-fs-call-one-predicate` | each sync fs call keeps its absence catch; the allowlist is the one shared predicate | clean | best-guessed | 80% |
| `F19-the-patch-suite-calls-the-real-registry` | the consumer patch suite calls the real registry and the immutable 0.42.1 | clean | best-guessed | 85% |
| `F20-a-miss-takes-no-single-flight-claim` | concurrent misses each render; no lock on the miss path | clean | best-guessed | 75% |
| `F21-the-bind-set-op-owns-its-cache-drop` | `setRouteBind` drops the cache itself, not the cli entry | clean | best-guessed | 80% |
| `F22-a-cache-fault-speaks-on-stderr-alone` | an unreadable or unwritable cache is reported on stderr; the line is unchanged | clean | best-guessed | 80% |
| `F23-a-young-miss-reuses-the-cached-route` | a miss renders the cached route while its own flag stands; the bind glob runs on a cold or aged miss | clean | best-guessed | 85% |
| `F24-the-branch-read-stays-at-its-leaf` | the status line's HEAD read is not lifted to utils until a second consumer | clean | best-guessed | 85% |
| `F25-a-bind-drops-the-cache-by-delete` | a bind drops the cache by `rm`, not an epoch row in every fingerprint; a racer's blank lasts at most the max age | clean | best-guessed | 75% |
| `F26-the-boot-regen-of-the-repo-actor-settings-rides` | the repo actor settings ride the pr as this branch's driver init renders them: one line off main, the subpath command | clean | best-guessed | 90% |
| `F27-the-seat-cwd-is-what-is-observed` | a cwd stays only where it is the seat observed or a hermetic test repo; the `cd` subshells became `git -C` | dirty | best-guessed | 80% |
| `F28-the-key-absent-render-is-rhachets` | the key-absent refusal render is rhachet's; pinned as shipped, reseeded upstream | clean | best-guessed | 85% |
| `F29-the-main-era-gitignore-suites-stay-filed` | the main-era fs unit suites stay filed; a merge into their integration twins is a dream | clean | best-guessed | 85% |
| `F30-the-render-count-clamp-wraps-by-call-through` | the render count reads the cache file's inode per repaint; the race clamp injects `context.renderRoute`. no `jest.mock` | clean | reversed at review, reworked | 90% |
| `F31-transformer-tables-stay-data-driven` | the transformer unit tables stay tables, now emitted through given/when/then | clean | reversed at review, reworked | 95% |
| `F32-an-op-snapshot-pins-the-thrown-error` | the op snapshot pins its thrown fault; the cli pins the qualified row | clean | best-guessed | 85% |
| `F33-faults-injected-at-tool-boundaries` | acceptance faults are injected at a PATH shim or a signal, never in the code under test | clean | best-guessed | 80% |
| `F34-the-clean-fixture-repair-and-the-host-count` | the clean fixture's three restated comments were a true positive; the host-count cure commits the link output | clean | best-guessed | 85% |
| `F35-the-consumer-patch-leaves-role-assets-out` | the consumer patch carries dist `.js` only; a changed init `.jsonc` is left out and named, so an init writes the legacy command until the release | clean | best-guessed | 85% |

gaps: none owed.

note: `case=F14-a-degraded-line-is-never-cached.md` is a symlink to F14's entry, kept because
`.route/passage.jsonl` (append-only) cites that path for an i004 dispute.
