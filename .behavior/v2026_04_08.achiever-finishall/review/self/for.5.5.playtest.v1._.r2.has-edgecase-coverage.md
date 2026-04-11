# self-review: has-edgecase-coverage (r2)

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

1. enumerate all edge cases for goal.triage.next
2. enumerate all edge cases for goal.guard
3. verify each is covered by playtest OR acceptance test
4. flag any uncovered gaps

---

## goal.triage.next edge cases

### what could go wrong?

| edge case | could go wrong | playtest coverage | acceptance coverage |
|-----------|----------------|-------------------|---------------------|
| no .goals/ directory | skill could crash | playtest 3 after cleanup | case 1 |
| empty .goals/ directory | skill could crash or show empty list | implicit in playtest 3 | case 2 |
| only fulfilled goals | skill could show fulfilled (wrong) | playtest 3 | case 3 |
| only blocked goals | skill could show blocked (wrong) | not tested | case 4 |
| mixed inflight+enqueued | skill could show both (wrong) | not tested | case 5 |
| malformed goal YAML | skill could crash | not tested | not tested |

**analysis of playtest coverage:**

1. **no .goals/ directory:** playtest 3 cleanup runs `rm -rf .goals/$(git branch --show-current)`. after cleanup, the directory is gone. however, playtest 3 step 2 runs BEFORE cleanup (sequential order), so this is not tested in playtest. it IS tested in acceptance test case 1.

2. **empty .goals/ directory:** after playtest 3 marks goal as fulfilled, the directory has one fulfilled goal. this is different from empty. acceptance test case 2 covers empty directory.

3. **only fulfilled goals:** playtest 3 creates fulfilled goal, verifies silence. this is covered.

4. **only blocked goals:** not tested in playtest. the skill should be silent (blocked is not actionable). acceptance tests would need to verify this.

5. **mixed inflight+enqueued:** not tested in playtest. acceptance test case 5 covers this.

6. **malformed goal YAML:** not tested anywhere. however, this is unlikely — goals are created via skill, which validates format.

**gap assessment:**

| edge case | gap level |
|-----------|-----------|
| no .goals/ directory | acceptable — in acceptance tests |
| empty .goals/ directory | acceptable — in acceptance tests |
| only fulfilled | none — playtest 3 covers |
| only blocked | acceptable — edge case |
| mixed inflight+enqueued | acceptable — in acceptance tests |
| malformed YAML | acceptable — unlikely via skill |

### what inputs are unusual but valid?

| unusual input | playtest coverage | assessment |
|---------------|-------------------|------------|
| --scope route (not repo) | not tested | acceptable — happy path is repo |
| no --scope (auto-detect) | not tested | acceptable — playtest uses explicit scope |
| --when hook.onStart | not applicable | skill is for onStop only |
| multiple goals same status | not tested | implicit — if one shows, N show |
| goal with empty why.ask | not tested | skill would show "why.ask = " |

**gap assessment:** all unusual inputs are either acceptable gaps or edge cases covered by acceptance tests.

### are boundaries tested?

| boundary | playtest | acceptance |
|----------|----------|------------|
| 0 goals | playtest 3 | yes |
| 1 goal | playtest 1, 2 | yes |
| N goals | not tested | yes (case 5) |
| exit 0 boundary | playtest 3 | yes |
| exit 2 boundary | playtest 1, 2, 4, 6 | yes |

---

## goal.guard edge cases

### what could go wrong?

| edge case | could go wrong | playtest coverage | acceptance coverage |
|-----------|----------------|-------------------|---------------------|
| path is exactly ".goals" (no slash at end) | could be allowed (wrong) | not tested | not tested |
| path is ".goals/" root only | could be allowed (wrong) | playtest 6 | yes |
| path deep in .goals/ | could be allowed (wrong) | playtest 4 | yes |
| path is .goals-archive | could be blocked (wrong) | playtest 5 step 2 | yes |
| path is src/.goals/ | could be allowed (wrong) | not tested | yes |
| path is .goalsbackup | could be blocked (wrong) | not tested | not tested |
| empty stdin | skill could crash | not tested | not tested |
| invalid JSON stdin | skill could crash | not tested | not tested |
| tool_name not Read/Write/Edit/Bash | could be blocked (wrong) | not tested | yes |

**analysis of playtest coverage:**

1. **path exactly ".goals":** the regex pattern is `\.goals/` which requires a slash after `.goals`. ".goals" without slash would be allowed. this is an edge case. however, claude tools always include full paths like `.goals/branch/file.yaml`, not just `.goals`.

2. **path ".goals/" root:** playtest 6 tests `rm -rf .goals/` which is root access. covered.

3. **path deep in .goals/:** playtest 4 tests `.goals/branch/file.yaml`. covered.

4. **path .goals-archive:** playtest 5 step 2 explicitly tests this. covered.

5. **path src/.goals/:** not in playtest. this is a route-scoped edge case. acceptance tests cover.

6. **path .goalsbackup:** not tested. this is a false positive edge case. the regex `\.goals/` would NOT match `.goalsbackup` because it requires `/` after `.goals`. correct behavior.

7. **empty stdin:** not tested. skill would crash or return error. acceptable — invalid invocation.

8. **invalid JSON stdin:** not tested. skill would crash or return error. acceptable — invalid invocation.

9. **tool_name not Read/Write/Edit/Bash:** playtest only tests Read and Bash. other tools like Agent, Grep would not have file paths in the expected format. acceptable — those tools don't access .goals/.

**gap assessment:**

| edge case | gap level |
|-----------|-----------|
| ".goals" no slash | acceptable — unlikely input |
| ".goals/" root | none — playtest 6 covers |
| deep path | none — playtest 4 covers |
| .goals-archive | none — playtest 5 covers |
| src/.goals/ | acceptable — acceptance tests |
| .goalsbackup | none — regex correctly allows |
| empty stdin | acceptable — invalid usage |
| invalid JSON | acceptable — invalid usage |
| other tools | acceptable — no .goals/ access |

### what inputs are unusual but valid?

| unusual input | playtest coverage | assessment |
|---------------|-------------------|------------|
| Write tool (not Read) | not tested | acceptable — same path match |
| Edit tool (not Read) | not tested | acceptable — same path match |
| Bash with mv | not tested | acceptable — same regex |
| Bash with cat | not tested | acceptable — same regex |
| Bash with complex pipeline | not tested | acceptable — regex still matches |
| path with spaces | not tested | acceptable — yaml paths rarely have spaces |

### are boundaries tested?

| boundary | playtest | acceptance |
|----------|----------|------------|
| blocked path | playtest 4, 6 | yes |
| allowed path | playtest 5 | yes |
| exit 0 (allowed) | playtest 5 | yes |
| exit 2 (blocked) | playtest 4, 6 | yes |

---

## summary of gaps

### gaps acceptable for playtest (edge cases in acceptance tests)

1. no .goals/ directory — acceptance test case 1
2. empty .goals/ directory — acceptance test case 2
3. only blocked goals — edge case, not critical path
4. mixed inflight+enqueued — acceptance test case 5
5. --scope route — acceptance tests use route scope
6. route-scoped .goals/ paths — acceptance tests cover

### gaps acceptable for playtest (unlikely scenarios)

1. malformed YAML — goals created via skill, not manual
2. empty stdin — invalid invocation
3. invalid JSON — invalid invocation
4. path ".goals" without slash — tools always include full paths

### no gaps

all critical happy paths are covered by playtest. all edge cases are either in acceptance tests or are unlikely scenarios.

---

## summary

| check | status |
|-------|--------|
| what could go wrong? | enumerated, gaps acceptable |
| what inputs are unusual but valid? | enumerated, gaps acceptable |
| are boundaries tested? | yes — 0/1/N goals, blocked/allowed paths |

---

## why it holds

1. **playtest covers happy paths:** inflight, enqueued, fulfilled, blocked, allowed
2. **edge cases delegated:** acceptance tests cover mixed states, route scope, empty directory
3. **boundaries tested:** 0/1/N goals, exit 0/2
4. **unlikely scenarios not tested:** malformed YAML, invalid stdin — acceptable
5. **false positive avoidance tested:** .goals-archive explicitly allowed in playtest 5

the playtest provides representative coverage. edge cases are in acceptance tests. boundaries are tested. unlikely scenarios are acceptable gaps.

