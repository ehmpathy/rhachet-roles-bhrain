# self-review: has-consistent-conventions (r5)

## stone
5.1.execution.phase0_to_phaseN.v1

## question
do my name conventions align with extant codebase patterns?

## answer
yes. fresh grep search confirms all conventions match.

## fresh review

### verb prefix scan

ran: `grep -E "export const (get|set|del)[A-Z]" src/domain.operations/**/*.ts`

**extant patterns found:**
- `setRouteBind.ts`, `getRouteBind.ts`, `delRouteBind.ts`
- `setSavepoint.ts`, `getOneSavepoint.ts`, `getAllSavepoints.ts`
- `setAnnotation.ts`, `getAllAnnotations.ts`
- `setResearchBind.ts`, `getResearchBind.ts`, `delResearchBind.ts`

**my operations:**
- `setGoal.ts`, `setGoalStatus.ts`
- `getGoals.ts`
- `setAsk.ts`, `setCoverage.ts`
- `getTriageState.ts`

**verdict:** all use get/set verb prefixes. consistent.

### getAll vs get analysis

**question:** should `getGoals` be `getAllGoals`?

**precedent from search:**
- `getReflectScope` — returns single scope (not a collection)
- `getTriageState` — returns composite state object
- `getProviders`, `getResources` — return filtered collections

my `getGoals` returns a filtered collection (filter by status, slug). precedent shows `getXs` is valid for filtered collections.

**verdict:** `getGoals` is correct. matches `getProviders`/`getResources` pattern.

### name convention analysis

| mine | extant analogue | match? |
|------|-----------------|--------|
| `setGoal` | `setRouteBind`, `setAnnotation` | yes |
| `setGoalStatus` | `setStoneAsBlocked`, `setBlockedTriggeredReport` | yes |
| `getGoals` | `getProviders`, `getResources` | yes |
| `setAsk` | `setAnnotation` | yes |
| `setCoverage` | `setAnnotation` | yes |
| `getTriageState` | `getReflectScope` | yes |

### directory structure

**extant:**
```
src/domain.operations/
├── route/       — route-related operations
├── reflect/     — reflect-related operations
└── research/    — research-related operations
```

**mine:**
```
src/domain.operations/
└── goal/        — goal-related operations
```

**verdict:** follows concept-named folder pattern.

## conclusion

fresh search confirms all conventions match extant codebase patterns. no divergence found.

