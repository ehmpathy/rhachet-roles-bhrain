# self-review r8: has-behavior-declaration-adherance

## verification approach

read blueprint line by line, check each against vision for correct interpretation.

---

## blueprint summary vs vision summary

**blueprint says:**
> implement actionable triage output for `goal.triage.infer` and `goal.triage.next`:
> - show per-goal commands with field flags
> - rename skill from `goal.infer.triage` to `goal.triage.infer`
> - rename flag from `--mode` to `--when`
> - fix bug: triage completeness based on `status.choice`, not field presence

**vision says:**
> a brain runs `rhx goal.triage.infer`. there are incomplete goals. the brain sees: [...] to fix, run: `rhx goal.memory.set --slug X --why.purpose "..."`

**check**: blueprint summary matches vision intent.

---

## actionable command format

**vision specifies:**
```
│  ├─ git-repo-test-config-failfast [incomplete]
│  │  ├─ absent: why.purpose, why.benefit, what.outcome, how.task, how.gate
│  │  └─ to fix, run: `rhx goal.memory.set --slug git-repo-test-config-failfast --why.purpose "..."`
```

**blueprint codepath says:**
```
├─ [~] incomplete goals section
│  ├─ [○] slug [status]
│  ├─ [○] absent: fields
│  └─ [+] to fix, run: `rhx goal.memory.set --slug X --why.purpose "..."`
```

**check**: format matches. uses backticks, shows slug, shows first absent field as flag.

**questioned**: should it show `--why.purpose` or the actual first absent field?

**vision says**: "command for first absent field" and shows `--why.purpose` as example

**blueprint says**: uses `meta.absent[0]` to get first absent field

**verdict**: correct - blueprint uses dynamic first field, vision shows example with `why.purpose`

---

## partition logic adherance

**vision specifies:**
> **fix in `getTriageState.ts`** (not in `computeGoalCompleteness`):
> ```ts
> const goalsComplete = goals.filter(
>   (g) => g.status.choice !== 'incomplete',
> );
> const goalsIncomplete = goals.filter(
>   (g) => g.status.choice === 'incomplete',
> );
> ```

**blueprint codepath says:**
```
└─ [~] partition goals
   ├─ [-] goalsComplete = computeGoalCompleteness(g).complete === true
   ├─ [-] goalsIncomplete = computeGoalCompleteness(g).complete !== true
   ├─ [+] goalsComplete = g.status.choice !== 'incomplete'
   └─ [+] goalsIncomplete = g.status.choice === 'incomplete'
```

**check**: exact match with vision specification.

---

## goal.triage.next format

**vision specifies:**
```
└─ (2)
   ├─ slug = git-repo-test-timeout-flag
   ├─ why.ask = add --timeout flag for expected-fast test runs
   └─ status = enqueued → ✋ finish this first
      └─ tip: run `rhx goal.memory.get --slug git-repo-test-timeout-flag` to see the goal
```

**blueprint codepath says:**
```
├─ [~] inflight goals section
│  ├─ [○] slug, why.ask, status
│  ├─ [-] 💡 hint: rhx goal.memory.get
│  └─ [+] per-goal tip: run `rhx goal.memory.get --slug X` to see the goal
```

**check**: format matches vision. tip is per-goal, includes slug.

**questioned**: vision shows tip as sub-branch under status, blueprint shows it as separate line

**answer**: the codepath notation `[+] per-goal tip` means add a line. actual tree structure will match vision when implemented.

---

## flag rename

**vision specifies:**
> - **before**: `--mode hook.onStop`
> - **after**: `--when hook.onStop`

**blueprint codepath says:**
```
├─ [~] parseArgsForTriage
│  ├─ [-] --mode hook.onStop
│  └─ [+] --when hook.onStop
```

**check**: exact match.

---

## skill rename

**vision specifies:**
> requires:
> - rename shell entrypoint: `goal.infer.triage.sh` → `goal.triage.infer.sh`
> - rename cli function: `goalInferTriage` → `goalTriageInfer`
> - update hook command in `getAchieverRole.ts`

**blueprint filediff says:**
```
├─ [-] goal.infer.triage.sh           # delete old skill
└─ [+] goal.triage.infer.sh           # create renamed skill
```

**blueprint codepath says:**
```
goalTriageInfer (renamed from goalInferTriage)
```

**check**: matches vision requirements.

---

## questioned: any deviation from spec?

### test case review

blueprint test case line 141:
> `actionable command uses field flags | contains --why.purpose "..."`

**question**: does this test for fixed field `--why.purpose` instead of dynamic first absent field?

**vision says**: "command for first absent field" — field should be dynamic

**answer**: the test checks output contains the PATTERN `--why.purpose "..."` because:
1. the test fixture creates goals with `why.purpose` as first absent field
2. it verifies the format, not the specific field
3. the implementation uses `meta.absent[0]` to get first field dynamically

**verdict**: no deviation. test is for format verification, implementation is dynamic.

### tree structure review

**vision output** shows:
```
   │  ├─ git-repo-test-config-failfast [incomplete]
   │  │  ├─ absent: why.purpose, ...
   │  │  └─ to fix, run: `rhx goal.memory.set ...`
```

**blueprint codepath** shows:
```
├─ [~] incomplete goals section
│  ├─ [○] slug [status]
│  ├─ [○] absent: fields
│  └─ [+] to fix, run: ...
```

**question**: blueprint shows `[+] to fix, run:` at same level as `absent:`, but vision shows it as child of the goal block

**answer**: the codepath notation is simplified. the `[○]` and `[+]` markers indicate retain/add, not tree depth. actual implementation will match vision tree structure.

**verdict**: no deviation in intent, just notation simplification.

### implementation order vs vision

**vision section "implementation order"** is not present — it's a blueprint-only section.

**question**: does the implementation order match vision's implicit dependencies?

- vision says: fix getTriageState.ts first (foundation)
- blueprint says: step 1 is getTriageState.ts

**verdict**: aligns.

---

checked each blueprint section:
- summary: adheres
- filediff tree: adheres (includes all files from vision + extra files found via grep)
- codepath tree: adheres (notation simplified but intent correct)
- test coverage: adheres (tests verify format, implementation is dynamic)
- implementation order: follows vision's logical dependencies

no deviation found.

---

## summary

blueprint adheres to vision specification:

| vision requirement | blueprint adherance |
|-------------------|---------------------|
| actionable command format | exact match |
| partition logic | exact match |
| goal.triage.next tip format | matches intent |
| flag rename | exact match |
| skill rename | exact match |
| hook command update | included |

no misinterpretation or deviation detected.
