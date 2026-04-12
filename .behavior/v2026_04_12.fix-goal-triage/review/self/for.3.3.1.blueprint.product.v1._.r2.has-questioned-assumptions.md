# self-review r2: has-questioned-assumptions

## deeper review after r1 feedback

the guard said "the pond barely rippled" — I reviewed too quickly. let me verify assumptions against actual code.

---

## assumption 1: status.choice has exactly these values

**what do we assume?** that GoalStatusChoice is:
- 'incomplete'
- 'blocked'
- 'enqueued'
- 'inflight'
- 'fulfilled'

**verified against source at Goal.ts lines 12-17:**
```ts
export type GoalStatusChoice =
  | 'incomplete'
  | 'blocked'
  | 'enqueued'
  | 'inflight'
  | 'fulfilled';
```

**lifecycle documented at lines 8-10:**
```
incomplete → enqueued → inflight → fulfilled
                  ↓
              blocked
```

**verdict**: assumption verified. `incomplete` is the start state. all others are past triage.

---

## assumption 2: computeGoalCompleteness checks field presence, not status

**what do we assume?** that `computeGoalCompleteness(g).complete` checks if all fields are filled. it does not check `status.choice`.

**verified against source at Goal.ts lines 152-175:**
```ts
export const computeGoalCompleteness = (goal: {
  why?: Partial<GoalWhy>;
  what?: Partial<GoalWhat>;
  how?: Partial<GoalHow>;
}): GoalMeta => {
  const absent: string[] = [];

  // check why fields
  if (!goal.why?.ask) absent.push('why.ask');
  if (!goal.why?.purpose) absent.push('why.purpose');
  if (!goal.why?.benefit) absent.push('why.benefit');

  // check what fields
  if (!goal.what?.outcome) absent.push('what.outcome');

  // check how fields
  if (!goal.how?.task) absent.push('how.task');
  if (!goal.how?.gate) absent.push('how.gate');

  return new GoalMeta({
    complete: absent.length === 0,
    absent,
  });
};
```

**verdict**: assumption verified. computeGoalCompleteness only checks field presence (why, what, how). it does NOT check status.choice. the bug in getTriageState.ts uses this function for partition, but it should check status.choice instead.

---

## assumption 3: the partition at lines 65-70 is the only place this logic exists

**what do we assume?** that a change to getTriageState.ts is sufficient. no other file partitions goals by completeness.

**what if the opposite were true?** what if goal.ts also has partition logic?

**action**: grep for `computeGoalCompleteness` usage to verify.

found: computeGoalCompleteness is used in:
1. getTriageState.ts (the bug)
2. goal.ts (for display of absent fields — still needed for that purpose)

the partition is only in getTriageState.ts. goal.ts uses it to show which fields are absent, which is separate from partition logic.

**verdict**: assumption verified.

---

## assumption 4: the integration test file exists

**what do we assume?** that `getTriageState.integration.test.ts` exists and we update it.

**verified**: file exists at `src/domain.operations/goal/getTriageState.integration.test.ts`.

**verdict**: assumption verified.

---

## assumption 5: acceptance tests exist for both skills

**what do we assume?** that:
- `achiever.goal.triage.acceptance.test.ts` exists
- `achiever.goal.triage.next.acceptance.test.ts` exists

**verified**: both files exist at:
- `blackbox/achiever.goal.triage.acceptance.test.ts`
- `blackbox/achiever.goal.triage.next.acceptance.test.ts`

**verdict**: assumption verified.

---

## issue found: test file status markers — resolved

the filediff tree shows:
```
src/domain.operations/goal/
└─ [~] getTriageState.integration.test.ts   # add tests for status-based partition
```

**verified**: all test files exist. the `[~]` markers are correct.

---

## summary of r2 findings

| assumption | status | action |
|------------|--------|--------|
| status.choice values | verified | proceed |
| computeGoalCompleteness is field-only | verified | proceed |
| partition logic only in getTriageState | verified | proceed |
| test files exist | verified | proceed |

all assumptions verified against source code. no blockers found.

---

## lesson learned

don't just list assumptions — verify each one against actual source code. the guard caught my shallow review.

