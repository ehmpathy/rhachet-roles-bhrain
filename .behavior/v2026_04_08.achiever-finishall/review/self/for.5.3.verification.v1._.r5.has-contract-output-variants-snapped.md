# self-review: has-contract-output-variants-snapped (r5)

## review scope

verification stone 5.3 — verify each public contract has snapshots for all output variants

---

## method

1. enumerate all new public contracts in this behavior
2. for each contract, list all output variants
3. verify each variant has a snapshot (or justify why not)

---

## public contracts in this behavior

| contract | type | entry point |
|----------|------|-------------|
| goal.triage.next | CLI skill | `goal.triage.next.sh` |
| goal.guard | CLI hook | `goal.guard.sh` |

---

## contract 1: goal.triage.next

### output variants

| variant | output channel | snapshot needed? |
|---------|----------------|------------------|
| inflight goals exist | stderr | yes — shows treestruct |
| enqueued goals only | stderr | yes — shows treestruct |
| mixed (inflight + enqueued) | stderr | yes — shows priority logic |
| no goals directory | none | no — output is empty |
| empty goals directory | none | no — output is empty |
| all goals fulfilled | none | no — output is empty |

### snapshots captured

file: `blackbox/__snapshots__/achiever.goal.triage.next.acceptance.test.ts.snap`

| snapshot name | variant | content |
|---------------|---------|---------|
| `[case3] inflight...` | inflight exist | owl wisdom + inflight list |
| `[case4] enqueued...` | enqueued only | owl wisdom + enqueued list |
| `[case5] mixed...` | inflight + enqueued | owl wisdom + inflight only (priority) |

### verification

| variant | has snapshot? | reason |
|---------|---------------|--------|
| inflight | ✓ case3 | visible output captured |
| enqueued | ✓ case4 | visible output captured |
| mixed | ✓ case5 | priority logic captured |
| no dir | not needed | output is empty |
| empty dir | not needed | output is empty |
| fulfilled | not needed | output is empty |

**all visible output variants have snapshots.**

---

## contract 2: goal.guard

### output variants

| variant | output channel | snapshot needed? |
|---------|----------------|------------------|
| path blocked (Read) | stderr | yes — shows block message |
| path blocked (Write) | stderr | same message, one snap enough |
| path blocked (Edit) | stderr | same message, one snap enough |
| path blocked (Bash) | stderr | same message, one snap enough |
| path allowed | none | no — output is empty |
| false positive avoided | none | no — output is empty |

### snapshots captured

file: `blackbox/__snapshots__/achiever.goal.guard.acceptance.test.ts.snap`

| snapshot name | variant | content |
|---------------|---------|---------|
| `[case1] Read...` | blocked | owl wisdom + block message + skills list |

### verification

| variant | has snapshot? | reason |
|---------|---------------|--------|
| blocked (Read) | ✓ case1 | full block message captured |
| blocked (Write) | covered by case1 | same output format |
| blocked (Edit) | covered by case1 | same output format |
| blocked (Bash) | covered by case1 | same output format |
| allowed | not needed | output is empty |

**all visible output variants have snapshots.**

---

## snapshot content review

### goal.triage.next inflight (case3)

```
🦉 to forget an ask is to break a promise. remember.

🔮 goal.triage.next --when hook.onStop
   ├─ scope = repo
   └─ inflight (1)
      └─ (1)
         ├─ slug = fix-auth-test
         ├─ why.ask = fix the flaky test in auth.test.ts
         └─ status = inflight → ✋ finish this first
```

**captures:** owl wisdom, treestruct, scope, goal details, status with stop hand.

### goal.triage.next enqueued (case4)

```
🦉 to forget an ask is to break a promise. remember.

🔮 goal.triage.next --when hook.onStop
   ├─ scope = repo
   └─ enqueued (1)
      └─ (1)
         ├─ slug = update-readme-env
         ├─ why.ask = update the readme to mention the new env var
         └─ status = enqueued → ✋ finish this first
```

**captures:** same structure, but shows enqueued status.

### goal.triage.next mixed (case5)

```
🦉 to forget an ask is to break a promise. remember.

🔮 goal.triage.next --when hook.onStop
   ├─ scope = repo
   └─ inflight (1)
      └─ (1)
         ├─ slug = fix-auth-test
         ├─ why.ask = fix the flaky test
         └─ status = inflight → ✋ finish this first
```

**captures:** shows ONLY inflight when both exist (priority logic).

### goal.guard blocked (case1)

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

**captures:** owl wisdom, block message, skills list.

---

## snapshot coverage summary

| contract | visible variants | snapshots | coverage |
|----------|------------------|-----------|----------|
| goal.triage.next | 3 | 3 | 100% |
| goal.guard | 1 (others same format) | 1 | 100% |
| **total** | **4** | **4** | **100%** |

---

## why it holds

1. **all visible outputs captured:** 4 snapshots for 4 distinct visible outputs
2. **empty outputs excluded:** silent cases (exit 0 with no output) don't need snapshots
3. **format variants covered:** blocked message same format across tools, one snapshot sufficient
4. **caller perspective captured:** snapshots show what stderr contains after invocation
5. **ergonomics verified:** treestruct format, owl wisdom, stop hand all visible in snaps

all public contract output variants have snapshot coverage.

