# self-review: has-ergonomics-validated (r9)

## the question

does the actual input/output match what felt right at repros?

- compare the implemented input/output to what was sketched in repros
- did the design change between repros and implementation?

## the review

### method

read the actual CLI implementation (`src/contract/cli/goal.ts`) and compared output format to repros sketches line by line.

### repros vs implementation comparison

| contract | repros sketch | actual CLI implementation | match? |
|----------|---------------|---------------------------|--------|
| goal.memory.set | lines 134-140 | goal.ts:277-282 | exact |
| goal.memory.get | (vision sketch) | goal.ts:298-311 | simpler |
| goal.infer.triage | lines 96-110 | goal.ts:343-366 | simpler |

### goal.memory.set

**repros sketched (line 134-140):**
```
goal.memory.set --scope repo
   slug: fix-auth-test
   path: [TMPDIR]
   covered: a1b2c3d4
```

**actual implementation (triage.snap:56-61):**
```
goal.memory.set --scope repo
   slug: complete-task
   path: [TMPDIR]
   covered: abc123def456
```

**assessment:** exact match. minimal output format, no emoji overload. the `covered:` line only appears when `--covers` flag is used, which is correct behavior.

### goal.memory.get

**repros did not sketch explicit output format.** the vision (1.vision.md lines 294-330) showed a condensed format for list display:

```
└─ goals (2)
   ├─ (1)
   │  ├─ slug = fix-auth-test
   │  ├─ why
   │  │  ├─ ask = fix the flaky test
   ...
```

**actual implementation (lifecycle.snap:10-17):**
```
goal.memory.get --scope repo
   goals: 1
   - fix-auth-test [enqueued]
     why.ask: fix the flaky test
     what.outcome: auth.test.ts passes reliably
     how.gate: 10 consecutive passes
```

**assessment:** simpler than vision sketch. the actual format is more scannable:
- status in brackets `[enqueued]` instead of nested status block
- key fields on same indentation level
- no treestruct emoji for lists (cleaner)

this is an ergonomic improvement over the vision sketch.

### goal.infer.triage

**repros sketched (lines 96-110):**
```
🦉 to forget an ask is to break a promise. remember.

🔮 goal.infer.triage
   ├─ uncovered asks (1)
   │  └─ [a1b2c3d4] uncovered
   ...
```

**actual implementation (goal.ts:343-366):**
```typescript
// triage mode output
console.log(`goal.infer.triage --scope ${scope}`);
console.log(`   asks: ${state.asks.length}`);
console.log(`   uncovered: ${state.asksUncovered.length}`);
console.log(`   goals: ${state.goals.length}`);
console.log(`   coverage: ${state.coverage.length}`);

if (state.asksUncovered.length > 0) {
  console.log('   uncovered asks:');
  for (const ask of state.asksUncovered) {
    // truncate hash to 7 chars, content to 50 chars
    console.log(`   - [${ask.hash.slice(0, 7)}] ${ask.content.slice(0, 50)}...`);
  }
}
```

**assessment:** the actual implementation is simpler than repros sketched:
- no owl emoji in triage mode (owl only appears in hook.onStop mode)
- no treestruct characters (├─ │ └─)
- plain indented list format

this is an intentional simplification. the minimal format is cleaner and more machine-parseable.

**verified via snapshots (triage.snap lines 130-161):**
```
goal.infer.triage --scope repo
   asks: 0
   uncovered: 0
   goals: 2
   goals.complete: 1
   goals.incomplete: 1
   coverage: 0

   incomplete goals (need articulation):
   - incomplete-goal [enqueued]
     absent: why.purpose, why.benefit, what.outcome, how.task, how.gate

   complete goals:
   - complete-goal [enqueued]
```

the actual output matches the simpler format principle. no treestruct emoji, minimal clean display.

### design drift analysis

the repros document on line 142 explicitly notes:

> *note: actual implementation uses minimal output format — simpler than originally sketched, which is an improvement.*

this means the design change was:
1. intentional
2. documented in repros (in the plan phase)
3. considered an improvement

no unintentional drift detected.

### ergonomic summary

| contract | input ergonomics | output ergonomics | friction |
|----------|------------------|-------------------|----------|
| goal.memory.set (new) | YAML via stdin | minimal confirmation | acceptable for v1 |
| goal.memory.set (update) | --slug --status flags | minimal confirmation | none |
| goal.memory.get | simple CLI | scannable list | none |
| goal.infer.triage | simple CLI | minimal counts + lists | none |

## conclusion

**holds: yes**

the implemented input/output matches repros intent:
1. goal.memory.set matches exactly — minimal format
2. goal.memory.get is an improvement — cleaner list format
3. goal.infer.triage has snapshot coverage (case6/t0, case6/t1) — minimal format
4. design change was intentional and documented in repros

all three CLI skills have ergonomic output with snapshot coverage.

---

## fresh verification (2026-04-07)

i pause. i breathe. i am the reviewer.

### did i compare actual output to repros?

yes. compared three contracts:

| contract | repros source | actual source | verdict |
|----------|---------------|---------------|---------|
| goal.memory.set | repros lines 134-140 | lifecycle.snap | exact match |
| goal.memory.get | vision lines 294-330 | lifecycle.snap | simpler (improved) |
| goal.infer.triage | repros lines 96-110 | triage.snap:130-161 | simpler (improved) |

### is the actual ergonomics better or worse?

**better.**

the implementation removed treestruct characters and used plain indented format:
- easier to parse visually
- easier to grep/process
- less noise, more signal

example from actual triage output:
```
goal.infer.triage --scope repo
   asks: 0
   uncovered: 0
   goals: 2
```

vs repros sketch with treestruct:
```
🔮 goal.infer.triage
   ├─ uncovered asks (1)
   │  └─ [a1b2c3d4] uncovered
```

the simpler format is clearly an improvement.

### was the drift intentional?

yes. repros line 142 explicitly notes:

> *note: actual implementation uses minimal output format — simpler than originally sketched, which is an improvement.*

the drift was planned and documented.

### are there any ergonomic regressions?

no. checked:
- goal.memory.set: minimal confirmation, no regression
- goal.memory.get: scannable list with status in brackets, improved
- goal.infer.triage: counts-first format, improved

all three contracts have:
- clear output structure
- no emoji overload
- snapshot coverage for vibecheck

**verified: ergonomics are validated, no regressions**
