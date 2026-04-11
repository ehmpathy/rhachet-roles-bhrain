# self-review: has-contract-output-variants-snapped (r6)

## review scope

verification stone 5.3 — verify each public contract has snapshots for all output variants

---

## method

1. enumerate all new public contracts in this behavior
2. grep test files for `toMatchSnapshot` calls
3. read snapshot files to verify content
4. verify each visible output variant is captured

---

## public contracts in this behavior

| contract | type | entry point |
|----------|------|-------------|
| goal.triage.next | CLI skill | `goal.triage.next.sh` |
| goal.guard | CLI hook | `goal.guard.sh` |

---

## snapshot assertions in test files

### goal.triage.next.acceptance.test.ts

```
grep toMatchSnapshot output:
  157:  expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
  229:  expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
  315:  expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
```

**count:** 3 snapshot assertions

**contexts:**
- L157 → [case3] inflight goals exist
- L229 → [case4] enqueued goals only
- L315 → [case5] mixed (inflight + enqueued)

### goal.guard.acceptance.test.ts

```
grep toMatchSnapshot output:
  47:  expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
```

**count:** 1 snapshot assertion

**context:**
- L47 → [case1] Read tool with .goals/ path (blocked)

---

## snapshot file verification

### goal.triage.next snapshots

**file:** `blackbox/__snapshots__/achiever.goal.triage.next.acceptance.test.ts.snap`
**lines:** 40

**entries (3):**

| snapshot key | lines | captures |
|--------------|-------|----------|
| `[case3]...inflight...` | L3-14 | owl wisdom, treestruct, inflight list |
| `[case4]...enqueued...` | L16-27 | owl wisdom, treestruct, enqueued list |
| `[case5]...mixed...` | L29-40 | owl wisdom, treestruct, inflight only |

### goal.guard snapshots

**file:** `blackbox/__snapshots__/achiever.goal.guard.acceptance.test.ts.snap`
**lines:** 15

**entries (1):**

| snapshot key | lines | captures |
|--------------|-------|----------|
| `[case1]...blocked...` | L3-15 | owl wisdom, block message, skills list |

---

## output variant analysis

### goal.triage.next variants

| variant | stderr output | snapshot? | justification |
|---------|---------------|-----------|---------------|
| inflight exist | treestruct with inflight list | ✓ case3 | visible output captured |
| enqueued only | treestruct with enqueued list | ✓ case4 | visible output captured |
| mixed | treestruct with inflight (priority) | ✓ case5 | priority logic captured |
| no dir | empty | skip | no visible output to capture |
| empty dir | empty | skip | no visible output to capture |
| fulfilled | empty | skip | no visible output to capture |

### goal.guard variants

| variant | stderr output | snapshot? | justification |
|---------|---------------|-----------|---------------|
| blocked (Read) | block message + skills | ✓ case1 | full format captured |
| blocked (Write) | same format | skip | covered by case1 |
| blocked (Edit) | same format | skip | covered by case1 |
| blocked (Bash rm) | same format | skip | covered by case1 |
| blocked (Bash cat) | same format | skip | covered by case1 |
| blocked (Bash mv) | same format | skip | covered by case1 |
| allowed | empty | skip | no visible output to capture |

---

## skeptical check

**Q: are there any output variants without snapshots?**

A: only variants with empty output lack snapshots. this is intentional — empty output has no visual content to capture.

**Q: could the block message vary by tool type?**

A: NO — verified by read of `getGoalGuardVerdict.ts`. the block output is tool-agnostic. the same message shows for Read, Write, Edit, and Bash blocked cases.

**Q: are the snapshots sanitized for stable diffs?**

A: YES — all snapshot assertions use `sanitizeGoalOutputForSnapshot(result.stderr)` which normalizes dynamic content (paths, timestamps, etc.) for stable snapshots.

**Q: could a new output variant be added without snapshot coverage?**

A: unlikely — the test structure requires explicit `then('...matches snapshot')` blocks. a new variant would require a new test case, which would prompt snapshot addition.

**Q: do the snapshots capture the full user-visible output?**

A: YES — the snapshots show:
- owl wisdom header (`🦉`)
- crystal ball header (`🔮`)
- treestruct format (`├─`, `└─`, `│`)
- status with stop hand (`✋`)
- goal details (slug, why.ask, status)

---

## snapshot content summary

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

---

## coverage summary

| metric | count |
|--------|-------|
| test assertions with `.toMatchSnapshot()` | 4 |
| snapshot file entries | 4 |
| snapshot lines (total) | 55 |
| visible output variants captured | 4 |
| empty output variants (skip) | 6 |
| coverage rate (visible variants) | 100% |

---

## why it holds

1. **all visible outputs captured:** 4 assertions → 4 snapshot entries
2. **empty outputs excluded correctly:** 6 variants with no stderr skip snapshots
3. **format variants consolidated:** blocked message same across tools, one snap enough
4. **sanitization applied:** `sanitizeGoalOutputForSnapshot` ensures stable diffs
5. **caller perspective captured:** snapshots show exact stderr after invocation
6. **ergonomics visible:** owl wisdom, treestruct, stop hand all in snaps

all public contract output variants have snapshot coverage.

