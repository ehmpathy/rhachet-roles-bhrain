# inventory.of=fulcrums

| case | title | rework | risk | status | confidence |
|---|---|---|---|---|---|
| F1 | when-written rides the file mtime, not a json field | clean | — | best-guessed | 85% |
| F2 | refreshInterval 60 reads the wish's "at most once a minute" | clean | — | best-guessed | 80% |
| F3 | stale and unknown states speak in words, no new glyph | clean | — | best-guessed | 90% |
| F4 | where the reader finds the file (beside the route vs a per-branch path) | dirty | low | settled — ruled by the director, seed S1: beside the route | — |
| F5 | pr #700's node entry: retire, or keep | clean | — | answered by logic — keep | 95% |
| F6 | stale test: include the `$route` dir mtime, or only `.route/` ledgers | clean | — | answered by code — ledgers only | 95% |
| F7 | how two writers of one route converge (lock-free re-check vs a short mutex) | clean | — | best-guessed — lock-free re-check | 85% |
| F8 | case 2 reads whole, not truncated (experience-coverage i003 blockers disputed) | clean | — | disputed — file quoted | 95% |
| F9 | the per-branch pointer gets its own file, not pr #700's cache record | clean | — | best-guessed — own file | 90% |
| F10 | the multi-bind is marked in the pointer, not written into a status file | clean | — | best-guessed — pointer mark | 92% |
| F11 | the bound command clears `BASH_ENV` | clean | — | measured — cleared | 95% |
| F12 | the bench clamp plants its probe in the live cache dir (5.3 ergo nitpick.2 disputed) | clean | — | disputed — the bench's subject is the live tree | 90% |
| F13 | the acceptance file is not corrupt (5.3 mech blocker.1 disputed) | clean | — | disputed — file grepped, suite 92/0 | 99% |
| F14 | the route-complete line keeps its shape (5.3 ergo-blemishes nitpick.3 disputed) | clean | — | disputed — shipped on main, cataloged | 95% |
| F15 | the one repo-wide skip (thinker `stepDiverge`) is held from main, not fixed here | clean | — | best-guessed — another role's product fix, dream linked | 85% |
| F16 | the bound command is proven where the init writes it (5.3 mech-test-intent i003 blocker.1 disputed) | clean | — | disputed — survives-layout asserts and runs `COMMAND_OF_STATUS_LINE` | 95% |
| F17 | each repaint is the act of its own when (5.3 ergo-contract-snapshots i003 nitpick.2 disputed) | clean | — | disputed — i002 blocker settled act-under-when | 90% |
| F18 | the fallback line keeps the status line's "state, fix" grammar (5.3 ergo-blemishes i003 nitpick.3 disputed) | clean | — | disputed — one grammar for the surface, copyable command | 90% |
| F19 | a subdir seat keeps the one fallback line (5.3 enroll-verif-snapshot-blemishes i004 blocker.1 disputed) | clean | low | disputed — cataloged case 34, flagged for the commander | 75% |
| F20 | a route outside `.behavior/` with no pointer reads blank until its next move (5.3 enroll-verif-snapshot-blemishes i004 blocker.2 disputed) | clean | — | disputed — no repo walk per repaint; help text repaired | 88% |
| F21 | an inferred tally is not a verdict (5.3 enroll-verif-test-intent i004 all six disputed) | clean | — | disputed — a malfunction; its one named point is F16 | 90% |

F4's risk is graded in its entry: a wrong pick would ship rework, never a wrong line. it involves no
credential and no prod write.
