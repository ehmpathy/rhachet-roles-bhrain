# self-review: has-snap-changes-rationalized (r6)

## the question

is every `.snap` file change intentional and justified?

---

## changed snapshot files

```
git diff main --name-only -- '*.snap'
```

| file | change type |
|------|-------------|
| achiever.goal.guard.acceptance.test.ts.snap | **new** |
| achiever.goal.lifecycle.acceptance.test.ts.snap | modified |
| achiever.goal.triage.acceptance.test.ts.snap | modified |
| achiever.goal.triage.next.acceptance.test.ts.snap | **new** |
| goal.test.ts.snap | modified |
| reflect.journey.acceptance.test.ts.snap | modified (unrelated) |
| reflect.savepoint.acceptance.test.ts.snap | modified (unrelated) |

---

## per-file rationale

### 1. achiever.goal.guard.acceptance.test.ts.snap (NEW)

**what**: new snapshot for goal.guard block message

**rationale**: this behavior implements wish item 8 (direct file edit prevention). the guard blocks direct access to `.goals/` and suggests skills instead.

**snapshot content**:
```
🦉 patience, friend.

🔮 goal.guard
   ├─ ✋ blocked: direct access to .goals/ is forbidden
   │
   └─ use skills instead
      ├─ goal.memory.set — persist or update a goal
      ├─ goal.memory.get — retrieve goal state
      ├─ goal.triage.infer — detect uncovered asks
      └─ goal.triage.next — show unfinished goals
```

**verdict**: intentional — new feature

---

### 2. achiever.goal.lifecycle.acceptance.test.ts.snap (MODIFIED)

**changes**:

| before | after | rationale |
|--------|-------|-----------|
| `00000-1.fix-auth-test.goal.yaml` | `[OFFSET].fix-auth-test.goal.yaml` | sanitization of file offset to avoid flaky timestamps |
| `work started on flake diagnosis` | `status updated` | simplified test fixture text |
| `test passes 10 consecutive runs after mock stabilization` | `status updated` | simplified test fixture text |

**verdict**: intentional — sanitization improvement and test fixture simplification

---

### 3. achiever.goal.triage.acceptance.test.ts.snap (MODIFIED)

**changes**:

| category | before | after | rationale |
|----------|--------|-------|-----------|
| path | `00000-1` | `[OFFSET]` | sanitization of file offset |
| reason | specific reasons | `status updated` | simplified test fixture |
| skill name | `goal.infer.triage` | `goal.triage.infer` | correct skill name (bug fix) |
| arg name | `--mode hook.onStop` | `--when hook.onStop` | correct arg name (bug fix) |
| order | goals in different order | stable order | alphabetical sort by slug |
| incomplete hint | absent | present | new feature: actionable hints |

**key improvement**: incomplete goals now show actionable fix command:
```
├─ absent: why.purpose, why.benefit, what.outcome, how.task, how.gate
└─ to fix, run: `rhx goal.memory.set --slug incomplete-goal --why.purpose "..."`
```

**verdict**: intentional — bug fixes and new feature (actionable hints)

---

### 4. achiever.goal.triage.next.acceptance.test.ts.snap (NEW)

**what**: new snapshot for goal.triage.next acceptance tests

**rationale**: this behavior implements wish items 4 (escalation) and 5 (onBoot hook). the tests cover:
- inflight goals with reminder
- enqueued goals with reminder
- both inflight and enqueued (inflight takes priority)

**snapshot content example**:
```
🦉 to forget an ask is to break a promise. remember.

🔮 goal.triage.next --when hook.onStop
   └─ inflight (1)
      └─ (1)
         ├─ slug = fix-auth-test
         ├─ why.ask = fix the flaky test in auth.test.ts
         ├─ status = inflight → ✋ finish this first
         └─ tip: run `rhx goal.memory.get --slug fix-auth-test` to see the goal
```

**verdict**: intentional — new feature

---

### 5. goal.test.ts.snap (MODIFIED)

**what**: new snapshot for `emitHelpOutput`

**rationale**: this behavior implements wish item 7 (comprehensive --help). the snapshot captures the full help output.

**snapshot content includes**:
- owl header
- recommended usage (flags one-by-one)
- all 6 required fields with descriptions
- status update example
- valid status values
- stdin yaml note

**verdict**: intentional — new feature

---

### 6. reflect.journey.acceptance.test.ts.snap (MODIFIED - unrelated)

**what**: commit hash changes (`2da9710` → `456e622`)

**rationale**: test fixtures run `git commit` which generates new hashes. this is expected drift from the test suite run after code changes.

**verdict**: unrelated to this behavior — incidental change

---

### 7. reflect.savepoint.acceptance.test.ts.snap (MODIFIED - unrelated)

**what**: commit hash changes (`c34fdcb` → `ca0ed95`)

**rationale**: same as above — test fixtures generate new commit hashes.

**verdict**: unrelated to this behavior — incidental change

---

## common regressions check

| check | found? |
|-------|--------|
| output format degraded | no — format improved with hints |
| error messages less helpful | no — error messages now more actionable |
| timestamps/ids leaked | no — paths sanitized with `[OFFSET]` |
| extra output unintentionally | no — all new output is per spec |

---

## why it holds

1. **new files** (2): goal.guard and goal.triage.next — both are new features per the wish
2. **modified achiever files** (3): lifecycle, triage, goal.test — all changes are intentional (bug fixes, sanitization, new features)
3. **modified reflect files** (2): incidental commit hash drift, unrelated to this behavior
4. **no regressions**: format improvements, actionable hints, sanitized paths
5. **every change has rationale**: no bulk updates without explanation

