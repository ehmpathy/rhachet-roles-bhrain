# self-review: has-consistent-mechanisms (r3)

## review scope

execution stone 5.1 — achiever-finishall implementation

deeper dive into specific code to verify no duplication.

## code evidence

### goalTriageNext reuses extant getGoals

from `goalTriageNext` in goal.ts:1120-1127:
```typescript
const inflightGoals = await getGoals({
  scopeDir,
  filter: { status: 'inflight' },
});
const enqueuedGoals = await getGoals({
  scopeDir,
  filter: { status: 'enqueued' },
});
```

from `getGoals` in getGoals.ts:104-106:
```typescript
const filteredGoals = input.filter?.status
  ? goals.filter((g) => g.status.choice === input.filter?.status)
  : goals;
```

**observation:** goalTriageNext does not re-implement goal enumeration. it uses the extant `getGoals` with its filter capability.

### getGoalGuardVerdict vs getDecisionIsArtifactProtected

from `getDecisionIsArtifactProtected` in bouncer/:
```typescript
// requires cache with protections
export const getDecisionIsArtifactProtected = (input: {
  path: string;
  cache: RouteBouncerCache;  // <-- needs precomputed route context
}): { blocked: boolean; protection: RouteBouncerProtection | null }
```

from `getGoalGuardVerdict` in goal/:
```typescript
// standalone, no context needed
export const getGoalGuardVerdict = (input: {
  toolName: string;
  toolInput: { file_path?: string; command?: string };
}): GoalGuardVerdict
```

**key differences:**
1. bouncer needs RouteBouncerCache (computed from route stones)
2. goal guard is stateless (fixed regex)
3. bouncer uses dynamic globs from stone definitions
4. goal guard uses constant `/(^|\/)\.goals(\/|$)/`

could we reuse bouncer? no — bouncer requires route context that doesn't exist for global .goals/ protection.

### test utilities compose correctly

from invokeGoalSkill.ts:
```typescript
// extant base function (line 63-133)
export const invokeGoalSkill = async (input: {
  skill: 'goal.memory.set' | 'goal.memory.get' | 'goal.infer.triage' | 'goal.guard' | 'goal.triage.next';
  // ...
}): Promise<{ stdout: string; stderr: string; code: number }> => { ... }

// new utilities (line 139-173) — thin wrappers
export const invokeGoalGuard = async (input) => {
  return invokeGoalSkill({ skill: 'goal.guard', ... });  // composes
};

export const invokeGoalTriageNext = async (input) => {
  return invokeGoalSkill({ skill: 'goal.triage.next', ... });  // composes
};
```

**observation:** new utilities don't duplicate invokeGoalSkill — they compose with it.

## conclusion

no duplication found:
- goalTriageNext reuses extant getGoals with its filter param
- getGoalGuardVerdict cannot reuse bouncer (different context requirements)
- test utilities compose with extant invokeGoalSkill

the implementation is consistent with extant patterns.
