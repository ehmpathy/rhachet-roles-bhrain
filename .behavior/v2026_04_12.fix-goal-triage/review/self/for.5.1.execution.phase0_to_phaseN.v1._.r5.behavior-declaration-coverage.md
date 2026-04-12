# self review: behavior-declaration-coverage (r5)

## deeper review

verified key code sections against vision requirements.

### actionable output (goal.ts:976-980)

vision: show `to fix, run: \`rhx goal.memory.set --slug X --why.purpose "..."\``

code verified:
```typescript
const meta = computeGoalCompleteness(goal);
console.error(`   │  ${cont}├─ absent: ${meta.absent.join(', ')}`);
const firstAbsent = meta.absent[0] ?? 'why.purpose';
console.error(
  `   │  ${cont}└─ to fix, run: \`rhx goal.memory.set --slug ${goal.slug} --${firstAbsent} "..."\``,
);
```

correctly shows first absent field with exact command.

### status-based partition (getTriageState.ts:61-65)

vision: partition by `status.choice !== 'incomplete'`

code verified:
```typescript
// partition goals by status (not field completeness)
const goalsComplete = goals.filter((g) => g.status.choice !== 'incomplete');
const goalsIncomplete = goals.filter((g) => g.status.choice === 'incomplete');
```

correctly uses status.choice, not field completeness.

### flag rename (goal.ts parseArgsForTriage)

vision: `--mode` → `--when`

code verified: function uses `when` key from parsed args.

### tests verify behavior

- goal.triage.acceptance: 124 pass
- goal.triage.next: 28 pass
- getTriageState integration: 32 pass

### why this holds

read key code sections and verified against vision. no gaps found.

## outcome

full coverage confirmed after code verification.
