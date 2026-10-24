# inventory.of=fulcrums — fix-status-line-cpu

axis: `case` (occurrences, declared as they arise).

| case | title | rework | status | confidence |
|---|---|---|---|---|
| `F1-fingerprint-of-stat-over-named-inputs` | freshness = stat of the named render inputs + a 30s max age | clean | best-guessed | 85% |
| `F2-node-fast-path-not-sh` | the fast path stays a `node -e` command, not a pure-sh cat | clean | best-guessed | 80% |
| `F3-cache-keyed-per-branch-in-agent-cache` | one cache file per branch under `.agent/.cache/` | clean | best-guessed | 90% |
| `F4-patch-pin-openrouter-0.1.4` | re-pin openrouter to 0.1.4 and slim the patch to the speed waiver | clean | best-guessed | 92% |

gaps: none owed.
