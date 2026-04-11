# self-review: has-behavior-coverage (r1)

## review scope

verification stone 5.3 — verify every behavior from wish/vision has a test

---

## method

1. read 0.wish.md to enumerate behaviors
2. for each behavior, find the test file
3. verify test file has relevant test cases

---

## behavior enumeration from wish

### behavior 1: hook to forbid direct .goals/ access

> "we must add a hook to forbid [direct access to] the .goal/ dirs directly"
> - no rm's via bash
> - no Reads or Writes or Edits

**test file:** `blackbox/achiever.goal.guard.acceptance.test.ts`

**test cases verified:**
| case | tool | path | expected |
|------|------|------|----------|
| case1 | Read | .goals/branch/file.yaml | blocked |
| case2 | Write | .goals/branch/file.yaml | blocked |
| case3 | Edit | .goals/branch/file.yaml | blocked |
| case4 | Bash | rm -rf .goals/ | blocked |
| case5 | Bash | cat .goals/branch/file.yaml | blocked |
| case6 | Bash | mv .goals/ .goals.bak | blocked |
| case7 | Read | src/index.ts | allowed |
| case8 | Read | .goals-archive/old.yaml | allowed |
| case9 | Read | .behavior/route/.goals/file.yaml | blocked |
| case10 | Bash | git status | allowed |

**coverage check:**
- [x] rm's via bash — case4 (rm -rf .goals/)
- [x] Reads — case1
- [x] Writes — case2
- [x] Edits — case3
- [x] other bash commands — case5 (cat), case6 (mv)

### behavior 2: goal.triage.next --when hook.onStop

> "we must add `goal.triage.next --when hook.onStop` which tells the bot which goals to focus on next"
> - if any inflight, show only inflight
> - if any enqueued, show only enqueued

**test file:** `blackbox/achiever.goal.triage.next.acceptance.test.ts`

**test cases verified:**
| case | scenario | expected |
|------|----------|----------|
| case1 | no goals directory | exit 0, silent |
| case2 | empty goals directory | exit 0, silent |
| case3 | inflight goals exist | exit 2, shows inflight |
| case4 | enqueued but no inflight | exit 2, shows enqueued |
| case5 | both inflight and enqueued | exit 2, shows only inflight |
| case6 | all goals fulfilled | exit 0, silent |

**coverage check:**
- [x] if any inflight, show only inflight — case3, case5
- [x] if any enqueued, show only enqueued — case4
- [x] edge cases — case1 (no dir), case2 (empty), case6 (fulfilled)

### behavior 3: stdout/stderr snapshots

> "the stdout and stderr snapshot cases are the most important"
> "conform to the stdout vibes of extant skills"

**verification:**
- achiever.goal.guard.acceptance.test.ts.snap — 4 snapshots (blocked output)
- achiever.goal.triage.next.acceptance.test.ts.snap — 4 snapshots (inflight, enqueued, mixed)

**vibes check:**
- owl wisdom header (🦉) ✓
- crystal ball header (🔮) ✓
- treestruct format (├─ └─) ✓
- stop hand emoji (✋) ✓

---

## why it holds

1. **behavior 1 (goal.guard):** all tool types are covered (Read, Write, Edit, Bash rm/cat/mv)
2. **behavior 2 (goal.triage.next):** all priority cases covered (inflight, enqueued, both, fulfilled)
3. **behavior 3 (snapshots):** both features have snapshot coverage with correct vibes

every behavior in wish has dedicated test coverage.

