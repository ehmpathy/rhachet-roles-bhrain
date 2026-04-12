# self-review r5: has-consistent-mechanisms

## verification approach

search for related codepaths:
1. grep for `computeGoalCompleteness` to find field detection patterns
2. grep for `rhx goal.memory.set` to find command generation patterns
3. read goal.ts lines 970-1040 to see extant output format

---

## mechanism 1: absent field detection

**grep found**: `computeGoalCompleteness` is already used in `goal.ts`:

| location | usage |
|----------|-------|
| line 62 | `emitGoalFull` uses `meta = computeGoalCompleteness(goal)` |
| line 137 | `emitGoalCompact` uses `meta = computeGoalCompleteness(goal)` |
| line 533 | `goalMemorySet` uses it for status default |
| line 975-976 | triage hook: `meta.absent.join(', ')` |
| line 1036-1037 | triage mode: `meta.absent.join(', ')` |

**blueprint needs**: get first absent field for actionable command

**approach**: reuse extant `computeGoalCompleteness(goal).absent[0]`

**verdict**: no new mechanism. extant pattern covers the need.

---

## mechanism 2: command string generation

**grep found**: inline command strings in `goal.ts`:
- line 762: `cat goal.yaml | rhx goal.memory.set --scope repo`
- line 766: `rhx goal.memory.set --scope repo --slug 'fix-test' --why.ask '...'`
- line 833: `rhx goal.memory.set --scope repo --slug 'my-goal' --why.ask '...'`

**question**: should we create a helper function to generate command strings?

**extant pattern**: commands are generated inline, no helper function.

**blueprint approach**: generate inline, same as extant:
```ts
console.log(`   │  ${cont}└─ to fix, run: \`rhx goal.memory.set --slug ${goal.slug} --${meta.absent[0]} "..."\``);
```

**verdict**: inline generation is consistent with extant pattern. no new helper function needed.

---

## mechanism 3: field flags

**grep found**: `GOAL_FIELD_FLAGS` at line 237-241:
```ts
'--why.purpose',
'--why.benefit',
'--what.outcome',
'--how.task',
'--how.gate',
```

**blueprint needs**: show these flags in output

**verdict**: flags already defined. no new mechanism.

---

## mechanism 4: output format

**read goal.ts:1030-1038**:
```ts
const goal = state.goalsIncomplete[i]!;
const isLast = i === state.goalsIncomplete.length - 1;
const branch = isLast ? '└─' : '├─';
const cont = isLast ? '   ' : '│  ';
console.log(`   │  ${branch} ${goal.slug} [${goal.status.choice}]`);
const meta = computeGoalCompleteness(goal);
console.log(`   │  ${cont}└─ absent: ${meta.absent.join(', ')}`);
```

**blueprint change**: add one more line after `absent:` line:
```ts
console.log(`   │  ${cont}└─ to fix, run: \`rhx goal.memory.set --slug ${goal.slug} --${meta.absent[0]} "..."\``);
```

**verdict**: same pattern, one additional console.log. consistent.

---

## questioned: should there be a command generator utility?

**observation**: the blueprint generates inline command strings in multiple places (hook mode + triage mode)

**question**: would a helper like `genFixCommand(goal, absentField)` reduce duplication?

**counter**: the command string is simple (one line), used in only 2 places, and the context varies (stderr vs stdout). extraction would add indirection without much benefit.

**verdict**: inline is fine. if it grows to 3+ locations, extract then. rule.prefer.wet-over-dry.

---

## summary

| mechanism | extant? | blueprint reuses? |
|-----------|---------|-------------------|
| `computeGoalCompleteness` for absent fields | yes, 5 usages | yes |
| inline command string generation | yes, 3 usages | yes |
| field flags (`--why.purpose` etc) | yes, defined | yes |
| treestruct output format | yes | yes |

no new mechanisms. all changes reuse extant patterns.
