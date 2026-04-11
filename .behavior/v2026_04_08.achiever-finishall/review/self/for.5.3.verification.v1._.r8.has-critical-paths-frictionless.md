# self-review: has-critical-paths-frictionless (r8)

## review scope

verification stone 5.3 — verify critical paths are frictionless in practice

---

## repros reference

from `.behavior/v2026_04_08.achiever-finishall/3.2.distill.repros.experience._.v1.i1.md` lines 185-191:

```
## critical paths

| critical path | description | why critical |
|---------------|-------------|--------------|
| inflight reminder | bot with inflight goals sees reminder at session end | prevents silent abandonment |
| guard block | bot tries rm .goals/ and is blocked | prevents accountability escape |
| skill allow | bot uses goal.memory.get and is not blocked | skills must still work |
```

---

## method

for each critical path:
1. reproduce the exact scenario from repros
2. invoke the skill manually
3. measure: is it smooth?
4. measure: any unexpected errors?
5. measure: does it feel effortless?

---

## critical path 1: inflight reminder

### repros scenario

> "bot with inflight goals sees reminder at session end"

### manual reproduction

**step 1: create inflight goal**

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

**observation:** skill invoked in ~0.8s, goal persisted, output clear.

**step 2: invoke onStop hook**

```bash
rhx goal.triage.next --when hook.onStop --scope repo
```

**output:**
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

### frictionless assessment

| dimension | assessment | evidence |
|-----------|------------|----------|
| smooth? | yes | invoked in <1s, clear output |
| unexpected errors? | none | exit 2 is expected for inflight |
| effortless? | yes | one command, output self-explanatory |

### why it holds

the inflight reminder path is frictionless because:
- **zero configuration:** no flags required beyond `--when hook.onStop`
- **clear output:** owl wisdom + treestruct makes intent obvious
- **correct exit code:** exit 2 signals "you have work" without hard block
- **actionable:** shows exactly which goals need attention

---

## critical path 2: guard block

### repros scenario

> "bot tries rm .goals/ and is blocked"

### manual reproduction

**simulate tool invocation:**

```bash
echo '{"tool_name":"Read","tool_input":{"file_path":".goals/vlad/test.yaml"}}' | rhx goal.guard
```

**output:**
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

### also tested

| tool | path | result | exit |
|------|------|--------|------|
| Read | `.goals/vlad/test.yaml` | blocked | 2 |
| Write | `.goals/branch/file.yaml` | blocked | 2 |
| Edit | `.goals/branch/file.yaml` | blocked | 2 |
| Bash | `rm -rf .goals/` | blocked | 2 |

### frictionless assessment

| dimension | assessment | evidence |
|-----------|------------|----------|
| smooth? | yes | immediate response, clear message |
| unexpected errors? | none | all blocks are expected |
| effortless? | yes (to understand) | output tells bot what to do instead |

### why it holds

the guard block path is frictionless because:
- **immediate feedback:** no delay, instant block
- **educational:** lists the 4 allowed skills
- **consistent:** same message for all blocked tools
- **gentle tone:** "patience, friend" not "ERROR"

---

## critical path 3: skill allow

### repros scenario

> "bot uses goal.memory.get and is not blocked"

### manual reproduction

**test 1: safe path through guard**

```bash
echo '{"tool_name":"Read","tool_input":{"file_path":"src/index.ts"}}' | rhx goal.guard
```

**output:** silent
**exit code:** 0

**test 2: goal.memory.get invocation**

```bash
rhx goal.memory.get --scope repo --slug test-critical-path
```

**output:**
```
🦉 to forget an ask is to break a promise. remember.

🔮 goal.memory.get --scope repo
   └─ goals (1)
      └─ (1)
         ├─ slug = test-critical-path
         ├─ why
         │  ├─ ask = test the critical path
         │  ├─ purpose = verification
         │  └─ benefit = confidence
         ├─ what
         │  └─ outcome = critical path works
         ├─ how
         │  ├─ task = run the skill
         │  └─ gate = output matches expected
         ├─ status
         │  ├─ choice = inflight
         │  └─ reason = manual test
         └─ source = peer:human
```

**exit code:** 0

### frictionless assessment

| dimension | assessment | evidence |
|-----------|------------|----------|
| smooth? | yes | guard is silent for allowed paths |
| unexpected errors? | none | skills work as expected |
| effortless? | yes | no extra steps required |

### why it holds

the skill allow path is frictionless because:
- **guard is silent:** no noise for allowed operations
- **skills work normally:** goal.memory.get returns full goal
- **no false positives:** safe paths pass through without friction
- **consistent vibes:** skills use same owl wisdom and treestruct

---

## skeptical check

**Q: could a bot be bothered by the guard message?**

A: NO — the message explicitly lists the 4 allowed skills. a bot knows exactly what to do next.

**Q: could the onStop hook be tedious if called repeatedly?**

A: NO — it only fires at session end. and if there are no goals, it's silent.

**Q: could the guard block legitimate operations?**

A: UNLIKELY — the pattern is specific: `^\.goals/` or `/\.goals/`. tested that `.goals-archive/` is allowed.

**Q: is the exit code 2 semantic correct?**

A: YES — exit 2 means "constraint" (user action required). this fits both "you have inflight goals" and "direct access forbidden".

---

## ergonomics check

from repros ergonomics table (lines 197-203):

| journey | input ergonomics | output ergonomics | repros says | actual |
|---------|------------------|-------------------|-------------|--------|
| onStop inflight | natural (flag + scope) | natural (treestruct) | none | confirmed |
| guard block | natural (stdin JSON) | natural (owl wisdom) | none | confirmed |
| guard allow | natural | natural (silent) | none | confirmed |

all ergonomics claims from repros verified.

---

## cleanup

```bash
rhx rmsafe --path '.goals/vlad.achiever-finishall' --recursive
```

test artifacts removed.

---

## summary

| critical path | repros claim | manual test | frictionless? |
|---------------|--------------|-------------|---------------|
| inflight reminder | prevents silent abandonment | works smoothly | yes |
| guard block | prevents accountability escape | works smoothly | yes |
| skill allow | skills must still work | works smoothly | yes |

---

## why it holds

1. **all 3 critical paths tested manually:** invoked skills, observed output, verified exit codes
2. **zero friction found:** no unexpected errors, no unclear output, no extra steps
3. **ergonomics verified:** repros ergonomics claims match actual behavior
4. **skeptical checks passed:** no edge case concerns found
5. **output is actionable:** bot knows exactly what to do in each scenario

all critical paths are frictionless in practice. the design achieves "just works" quality.

