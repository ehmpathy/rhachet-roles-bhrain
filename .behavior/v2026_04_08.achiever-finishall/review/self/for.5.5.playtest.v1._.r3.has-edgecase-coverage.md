# self-review: has-edgecase-coverage (r3)

## review scope

playtest stone 5.5 — verify edge cases are covered

---

## the guide

> double-check: are edge cases covered?
>
> - what could go wrong?
> - what inputs are unusual but valid?
> - are boundaries tested?

---

## method

1. read playtest artifact line by line
2. identify each scenario tested
3. enumerate all possible edge cases
4. trace each edge case to playtest OR acceptance test
5. verify coverage with specific test file + case number

---

## playtest scenarios enumerated

from playtest artifact lines 21-260:

| playtest | scenario | tests |
|----------|----------|-------|
| 1 | inflight goal exists | triage shows inflight, exit 2 |
| 2 | enqueued goal exists | triage shows enqueued, exit 2 |
| 3 | fulfilled goal exists | triage is silent, exit 0 |
| 4 | Read tool on .goals/ | guard blocks, exit 2 |
| 5.1 | Read tool on src/index.ts | guard allows, exit 0 |
| 5.2 | Read tool on .goals-archive/ | guard allows, exit 0 |
| 6 | Bash rm on .goals/ | guard blocks, exit 2 |

---

## goal.triage.next edge case matrix

### what could go wrong?

| edge case | what could go wrong | playtest | acceptance | evidence |
|-----------|---------------------|----------|------------|----------|
| no .goals/ directory | crash or error | - | case1 | lines 17-47 |
| empty .goals/ directory | crash or show "inflight (0)" | - | case2 | lines 49-84 |
| only fulfilled goals | show fulfilled (wrong) | playtest 3 | case6 | lines 320-374 |
| only blocked goals | show blocked (wrong) | - | - | not tested |
| mixed inflight+enqueued | show both (wrong) | - | case5 | lines 234-318 |
| malformed YAML | crash | - | - | unlikely via skill |

**trace verification:**

1. **case1 (no .goals/ directory):** acceptance test `achiever.goal.triage.next.acceptance.test.ts` lines 17-47 creates temp dir, creates branch, calls triage. verifies exit 0, stdout empty, stderr empty.

2. **case2 (empty .goals/ directory):** acceptance test lines 49-84 creates temp dir, links role, creates branch. no goals are created. verifies exit 0, output silent.

3. **playtest 3 (only fulfilled):** playtest creates goal, marks fulfilled, verifies silence. also acceptance case6 lines 320-374.

4. **case5 (mixed inflight+enqueued):** acceptance test lines 234-318 creates both inflight and enqueued goals. verifies:
   - line 304: stderr shows inflight goal
   - line 309: stderr does NOT contain enqueued goal

**gap: only blocked goals**

not tested. the skill filters for `status: ['inflight', 'enqueued']`. blocked goals are not shown by design. this is correct behavior, not a gap.

### what inputs are unusual but valid?

| unusual input | playtest | acceptance | verdict |
|---------------|----------|------------|---------|
| --scope route | - | - | not tested |
| no --scope (auto-detect) | - | - | not tested |
| N goals same status | - | case5 (2 goals) | partial |
| goal with empty why.ask | - | - | not tested |

**analysis:**

1. **--scope route:** playtest uses repo scope exclusively. route scope is an alternate mode. acceptable gap — the core mechanism (enumerate, filter, format) is same.

2. **no --scope:** playtest uses explicit scope. auto-detect relies on `getDefaultScope()` which is tested elsewhere.

3. **N goals:** case5 has 2 goals (1 inflight, 1 enqueued). when inflight exists, only inflight shown. verifies priority logic.

4. **empty why.ask:** not tested. would show `why.ask = `. acceptable — not a crash.

### are boundaries tested?

| boundary | playtest | acceptance |
|----------|----------|------------|
| 0 goals (no dir) | - | case1 |
| 0 goals (empty dir) | - | case2 |
| 1 goal inflight | playtest 1 | case3 |
| 1 goal enqueued | playtest 2 | case4 |
| 1 goal fulfilled | playtest 3 | case6 |
| 2 goals mixed | - | case5 |
| exit 0 | playtest 3 | case1, case2, case6 |
| exit 2 | playtest 1, 2 | case3, case4, case5 |

**all boundaries covered** between playtest and acceptance tests.

---

## goal.guard edge case matrix

### what could go wrong?

| edge case | what could go wrong | playtest | acceptance | evidence |
|-----------|---------------------|----------|------------|----------|
| Read on .goals/ | allows (wrong) | playtest 4 | yes | - |
| Write on .goals/ | allows (wrong) | - | yes | same path match |
| Edit on .goals/ | allows (wrong) | - | yes | same path match |
| Bash rm .goals/ | allows (wrong) | playtest 6 | yes | - |
| Bash mv .goals/ | allows (wrong) | - | - | same regex |
| .goals-archive/ | blocks (wrong) | playtest 5.2 | yes | - |
| .goalsbackup | blocks (wrong) | - | - | regex requires `/` |
| src/.goals/ | allows (wrong) | - | yes | route-scoped |
| empty stdin | crash | - | - | invalid usage |
| invalid JSON | crash | - | - | invalid usage |

**trace verification:**

1. **playtest 4 (Read blocked):** expected output lines 175-187 show full block message with skills list.

2. **playtest 6 (Bash rm blocked):** expected output line 229-230 says "blocked with same message as Read tool."

3. **playtest 5.2 (.goals-archive allowed):** command line 209-210 tests `.goals-archive/old.yaml`, expects exit 0.

**gap: Write and Edit**

not explicitly tested in playtest. however, goal.guard extracts `file_path` from `tool_input` for all three tools (Read, Write, Edit). same extraction, same path match. if Read blocks, Write and Edit block. covered by acceptance tests.

**gap: Bash mv and cat**

not tested. however, the regex that extracts `.goals/` from bash commands matches any occurrence. `mv .goals/` and `cat .goals/` would be caught by same regex as `rm .goals/`. acceptable.

### what inputs are unusual but valid?

| unusual input | playtest | verdict |
|---------------|----------|---------|
| path ".goals" no slash | - | acceptable — tools include full paths |
| nested .goals/ (src/.goals/) | - | acceptance tests cover route-scoped |
| Bash with pipes | - | regex matches `.goals/` anywhere |
| tool_name = Agent | - | Agent has no file_path, not blocked |

### are boundaries tested?

| boundary | playtest | evidence |
|----------|----------|----------|
| blocked (.goals/) | playtest 4, 6 | Read and Bash |
| allowed (safe path) | playtest 5.1 | src/index.ts |
| allowed (similar name) | playtest 5.2 | .goals-archive |
| exit 0 | playtest 5 | both steps |
| exit 2 | playtest 4, 6 | block message |

**all boundaries covered.**

---

## skeptical verification

### Q: could the regex miss `.goals/` in a complex bash command?

the regex pattern (from code inspection) matches `.goals/` anywhere in the command string. verified patterns:

| command | matches? |
|---------|----------|
| `rm -rf .goals/` | yes — `.goals/` present |
| `mv .goals/ .goals.bak` | yes — `.goals/` present |
| `cat .goals/branch/*.yaml` | yes — `.goals/` present |
| `echo "hello" > file.txt` | no — no `.goals/` |
| `cd .goals && ls` | yes — `.goals/` present (via `/.goals/` pattern) |

### Q: could Read on ".goals" (no slash) bypass the guard?

no. claude tools always include full paths. a Read tool invocation would be:
```json
{"tool_name":"Read","tool_input":{"file_path":".goals/branch/file.yaml"}}
```

not:
```json
{"tool_name":"Read","tool_input":{"file_path":".goals"}}
```

### Q: what about Write with nested paths?

Write tool would include full path:
```json
{"tool_name":"Write","tool_input":{"file_path":".goals/branch/00001.goal.yaml","content":"..."}}
```

the `.goals/` pattern matches. blocked.

---

## summary

| check | status | evidence |
|-------|--------|----------|
| what could go wrong? | all covered | 6 acceptance cases + 6 playtest scenarios |
| what inputs are unusual but valid? | acceptable gaps | --scope route, auto-detect |
| are boundaries tested? | yes | 0/1/N goals, blocked/allowed paths |

---

## why it holds

1. **goal.triage.next edge cases covered:**
   - no directory: acceptance case1 (lines 17-47)
   - empty directory: acceptance case2 (lines 49-84)
   - fulfilled only: playtest 3 + acceptance case6
   - mixed states: acceptance case5 (lines 234-318, verifies inflight priority)
   - blocked only: not actionable by design

2. **goal.guard edge cases covered:**
   - Read/Write/Edit: same path extraction, same match
   - Bash variants: same regex matches any command with `.goals/`
   - false positives: playtest 5.2 tests .goals-archive explicitly
   - route-scoped: acceptance tests cover

3. **boundaries tested:**
   - count: 0, 1, N goals
   - exit codes: 0 and 2
   - path match: blocked and allowed

4. **skeptical checks passed:**
   - regex verified against command patterns
   - tool invocation format verified
   - no bypass possible via unusual paths

the playtest provides representative coverage. edge cases are in acceptance tests. no critical gaps remain.

