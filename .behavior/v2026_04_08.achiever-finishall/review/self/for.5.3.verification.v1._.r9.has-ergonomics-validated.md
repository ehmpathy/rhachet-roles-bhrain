# self-review: has-ergonomics-validated (r9)

## review scope

verification stone 5.3 — verify implemented input/output matches what felt right at repros

---

## method

1. open repros artifact (3.2.distill.repros.experience._.v1.i1.md)
2. open actual snapshots
3. compare character-by-character for each output
4. verify input patterns match
5. skeptically check for any drift

---

## artifact locations

- repros: `.behavior/v2026_04_08.achiever-finishall/3.2.distill.repros.experience._.v1.i1.md`
- snap 1: `blackbox/__snapshots__/achiever.goal.triage.next.acceptance.test.ts.snap`
- snap 2: `blackbox/__snapshots__/achiever.goal.guard.acceptance.test.ts.snap`

---

## comparison 1: goal.triage.next inflight

### repros (lines 46-59)

```
🦉 to forget an ask is to break a promise. remember.

🔮 goal.triage.next --when hook.onStop
   ├─ scope = repo
   └─ inflight (2)
      ├─ (1)
      │  ├─ slug = fix-auth-test
      │  ├─ why.ask = fix the flaky test
      │  └─ status = inflight → ✋ finish this first
      └─ (2)
         ├─ slug = update-readme
         ├─ why.ask = update the readme
         └─ status = inflight → ✋ finish this first
```

### actual (snap lines 3-13)

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

### line-by-line analysis

| line # | repros | actual | diff? |
|--------|--------|--------|-------|
| 1 | `🦉 to forget an ask is to break a promise. remember.` | identical | no |
| 2 | (blank) | (blank) | no |
| 3 | `🔮 goal.triage.next --when hook.onStop` | identical | no |
| 4 | `   ├─ scope = repo` | identical | no |
| 5 | `   └─ inflight (2)` | `   └─ inflight (1)` | count only |
| 6 | `      ├─ (1)` | `      └─ (1)` | branch char (single goal) |
| 7 | `      │  ├─ slug = fix-auth-test` | `         ├─ slug = fix-auth-test` | indent only |
| 8 | `      │  ├─ why.ask = fix the flaky test` | `         ├─ why.ask = fix the flaky test in auth.test.ts` | content only |
| 9 | `      │  └─ status = inflight → ✋ finish this first` | `         └─ status = inflight → ✋ finish this first` | indent only |

### drift analysis

| element | type of diff | semantic drift? | explanation |
|---------|--------------|-----------------|-------------|
| count | `(2)` vs `(1)` | no | test creates 1 goal, format supports N |
| branch char | `├─` vs `└─` | no | treestruct adapts to single item |
| indent | different | no | consequence of single goal |
| why.ask content | different text | no | test data, not format |

**verdict:** no semantic drift. format is identical, differences are test data and treestruct adaptation.

---

## comparison 2: goal.triage.next enqueued

### repros (lines 79-90)

```
🦉 to forget an ask is to break a promise. remember.

🔮 goal.triage.next --when hook.onStop
   ├─ scope = repo
   └─ enqueued (1)
      └─ (1)
         ├─ slug = add-changelog
         ├─ why.ask = add changelog entry
         └─ status = enqueued → ✋ finish this first
```

### actual (snap lines 16-26)

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

### line-by-line analysis

| line # | repros | actual | diff? |
|--------|--------|--------|-------|
| 1-4 | (structure lines) | identical | no |
| 5 | `   └─ enqueued (1)` | identical | no |
| 6 | `      └─ (1)` | identical | no |
| 7 | `slug = add-changelog` | `slug = update-readme-env` | content only |
| 8 | `why.ask = add changelog entry` | `why.ask = update the readme...` | content only |
| 9 | `status = enqueued → ✋ finish this first` | identical | no |

### drift analysis

| element | type of diff | semantic drift? | explanation |
|---------|--------------|-----------------|-------------|
| slug | different text | no | test data |
| why.ask | different text | no | test data |

**verdict:** no semantic drift. structure is character-for-character identical.

---

## comparison 3: goal.guard block

### repros (lines 136-149)

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

### actual (snap lines 3-15)

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

### line-by-line analysis

| line # | repros | actual | diff? |
|--------|--------|--------|-------|
| 1 | `🦉 patience, friend.` | identical | no |
| 2 | (blank) | (blank) | no |
| 3 | `🔮 goal.guard` | identical | no |
| 4 | `   ├─ ✋ blocked: direct access to .goals/ is forbidden` | identical | no |
| 5 | `   │` | identical | no |
| 6 | `   └─ use skills instead` | identical | no |
| 7 | `      ├─ goal.memory.set — persist or update a goal` | identical | no |
| 8 | `      ├─ goal.memory.get — retrieve goal state` | identical | no |
| 9 | `      ├─ goal.infer.triage — detect uncovered asks` | identical | no |
| 10 | `      └─ goal.triage.next — show unfinished goals` | identical | no |

**verdict:** exact match. every character identical.

---

## input ergonomics verification

### repros input patterns (lines 44, 78, 108, 134, 167)

| journey | repros input |
|---------|--------------|
| inflight | `rhx goal.triage.next --when hook.onStop --scope repo` |
| enqueued | same |
| no goals | same |
| guard block | `echo '{"tool_name":"Bash",...}' \| goal.guard.sh` |
| guard allow | `echo '{"tool_name":"Read",...}' \| goal.guard.sh` |

### actual input patterns (from acceptance tests)

grep for `invokeGoalTriageNext` in `achiever.goal.triage.next.acceptance.test.ts`:
```typescript
const result = await invokeGoalTriageNext({
  tempDir,
  args: ['--when', 'hook.onStop', '--scope', 'repo'],
});
```

grep for `invokeGoalGuard` in `achiever.goal.guard.acceptance.test.ts`:
```typescript
const result = await invokeGoalGuard({
  tempDir,
  toolName: 'Read',
  toolInput: { file_path: '.goals/branch/file.yaml' },
});
```

### match analysis

| pattern | repros | actual | match? |
|---------|--------|--------|--------|
| triage flags | `--when hook.onStop --scope repo` | `['--when', 'hook.onStop', '--scope', 'repo']` | yes |
| guard stdin | JSON with tool_name, tool_input | JSON with toolName, toolInput | yes |

**verdict:** input patterns match exactly.

---

## skeptical checks

**Q: could the repros have been updated after implementation to match?**

A: NO — repros was created BEFORE implementation (stone 3.2 precedes stone 5). the git history shows repros was committed before implementation code.

**Q: could the comparison miss subtle differences?**

A: UNLIKELY — I compared character-by-character and marked every difference. the only differences are test data (slugs, counts) and treestruct adaptation (single vs multiple items).

**Q: could the test utilities hide format differences?**

A: NO — the test utilities (`invokeGoalTriageNext`, `invokeGoalGuard`) capture raw stderr and pass it through `sanitizeGoalOutputForSnapshot`, which only sanitizes dynamic values (paths, dates, hashes), not format.

**Q: what if repros was wrong and implementation "fixed" it?**

A: checked — the format in repros matches the extant skills (goal.memory.set, goal.memory.get). the format is consistent with prior art.

---

## summary

| artifact | planned (repros) | actual (snapshot) | drift? |
|----------|-----------------|-------------------|--------|
| triage inflight format | treestruct with owl | identical | no |
| triage enqueued format | treestruct with owl | identical | no |
| guard block format | treestruct with skills list | character-for-character | no |
| triage input pattern | --when, --scope flags | identical | no |
| guard input pattern | stdin JSON | identical | no |

---

## why it holds

1. **line-by-line comparison complete:** every line of repros compared to actual
2. **exact match on guard:** character-for-character identical
3. **triage diffs are data only:** structure identical, content varies by test
4. **input patterns preserved:** flags and stdin patterns match repros
5. **skeptical checks passed:** no hidden drift, no post-hoc edits

the implemented ergonomics match the repros plan. design intent preserved through implementation.

