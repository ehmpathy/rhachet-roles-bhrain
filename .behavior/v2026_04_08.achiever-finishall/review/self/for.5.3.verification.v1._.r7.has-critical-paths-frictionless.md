# self-review: has-critical-paths-frictionless (r7)

## review scope

verification stone 5.3 — verify critical paths work smoothly end-to-end

---

## method

1. link achiever role via `npx rhachet roles link --role achiever`
2. invoke each critical path manually
3. verify output matches expected format
4. verify exit codes match expected semantics
5. clean up test artifacts

---

## critical path 1: inflight reminder

### scenario

bot has inflight goals, session ends, goal.triage.next fires

### steps

**step 1: create goal via skill**

```bash
cat << 'EOF' | rhx goal.memory.set --scope repo
slug: test-critical-path
why:
  ask: test the critical path
  purpose: verification
  benefit: confidence
what:
  outcome: critical path works
how:
  task: run the skill
  gate: output matches expected
status:
  choice: inflight
  reason: manual test
source: peer:human
EOF
```

**result:**
```
🔮 goal.memory.set --scope repo
   ├─ goal
   │  ├─ slug = test-critical-path
   ...
   ├─ path = .goals/vlad.achiever-finishall/0000000.test-critical-path.goal.yaml
   └─ persisted
```

**step 2: invoke goal.triage.next**

```bash
rhx goal.triage.next --when hook.onStop --scope repo
```

**result:**
```
🦉 to forget an ask is to break a promise. remember.

🔮 goal.triage.next --when hook.onStop
   ├─ scope = repo
   └─ inflight (1)
      └─ (1)
         ├─ slug = test-critical-path
         ├─ why.ask = test the critical path
         └─ status = inflight → ✋ finish this first
```

**exit code:** 2

### verification

| aspect | expected | actual | status |
|--------|----------|--------|--------|
| owl wisdom | "to forget an ask is to break a promise. remember." | present | pass |
| treestruct format | crystal ball header, branches | correct | pass |
| stop hand emoji | present on status line | present | pass |
| exit code | 2 (soft block) | 2 | pass |
| goal details | slug, why.ask, status | all shown | pass |

---

## critical path 2: guard block

### scenario

bot attempts direct .goals/ access, goal.guard blocks

### invocation

```bash
echo '{"tool_name":"Read","tool_input":{"file_path":".goals/vlad/test.yaml"}}' | rhx goal.guard
```

### result

```
🦉 patience, friend.

🔮 goal.guard
   ├─ ✋ blocked: direct access to .goals/ is forbidden
   │
   └─ use skills instead
      ├─ goal.memory.set — persist or update a goal
      ├─ goal.memory.get — retrieve goal state
      ├─ goal.infer.triage — detect uncovered asks
      └─ goal.triage.next — show unfinished goals
```

**exit code:** 2

### verification

| aspect | expected | actual | status |
|--------|----------|--------|--------|
| owl wisdom | "patience, friend." | present | pass |
| block message | "direct access to .goals/ is forbidden" | present | pass |
| skills list | 4 allowed skills | all listed | pass |
| treestruct format | crystal ball header, branches | correct | pass |
| stop hand emoji | present on blocked message | present | pass |
| exit code | 2 (blocked) | 2 | pass |

---

## critical path 3: skill allow

### scenario

bot uses safe path or allowed skill, passes through

### safe path test

```bash
echo '{"tool_name":"Read","tool_input":{"file_path":"src/index.ts"}}' | rhx goal.guard
```

**result:** silent (no output)
**exit code:** 0

### skill allow test

```bash
rhx goal.memory.get --scope repo --slug test-critical-path
```

**result:**
```
🦉 to forget an ask is to break a promise. remember.

🔮 goal.memory.get --scope repo
   └─ goals (1)
      └─ (1)
         ├─ slug = test-critical-path
         ├─ why
         │  ├─ ask = test the critical path
         ...
```

**exit code:** 0

### verification

| aspect | expected | actual | status |
|--------|----------|--------|--------|
| safe path | silent, exit 0 | silent, exit 0 | pass |
| skill invocation | normal output, exit 0 | correct output, exit 0 | pass |
| no false positives | src/index.ts allowed | allowed | pass |

---

## cleanup

```bash
rhx rmsafe --path '.goals/vlad.achiever-finishall' --recursive
```

**result:** test goals directory removed

---

## summary

| critical path | scenario | verdict |
|---------------|----------|---------|
| 1. inflight reminder | goal.triage.next shows inflight | pass |
| 2. guard block | goal.guard blocks .goals/ | pass |
| 3. skill allow | safe paths and skills work | pass |

---

## why it holds

1. **all critical paths tested:** 3 of 3 verified manually
2. **output format correct:** owl wisdom, treestruct, stop hand all present
3. **exit codes correct:** 2 for blocked/inflight, 0 for allowed/clear
4. **no friction observed:** skills invoke cleanly, output is clear
5. **cleanup complete:** test artifacts removed

all critical paths work smoothly end-to-end.

