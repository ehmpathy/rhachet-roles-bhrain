# self-review r8: has-behavior-declaration-adherance

## what i found

deeper review revealed 3 deviations from extant patterns in the blueprint. these require fixes before proceed.

---

## issue 1: GoalBlockerState.goalSlug should be nullable

### what extant code shows

```ts
// DriveBlocker.ts
interface DriveBlockerState {
  count: number;
  stone: string | null;  // nullable
}
```

### what blueprint proposes

```ts
// GoalBlocker.ts (proposed)
interface GoalBlockerState {
  count: number;
  goalSlug: string;  // NOT nullable
}
```

### why this is wrong

DriveBlockerState uses nullable `stone` because when count is 0, there's no stone to track. the blueprint should follow the same pattern — when count is 0, there's no goal to track.

### fix

blueprint should specify:
```ts
interface GoalBlockerState {
  count: number;
  goalSlug: string | null;
}
```

---

## issue 2: blocker file path doesn't account for scope

### what extant code shows

```ts
// getScopeDir shows TWO scopes:
// repo scope: .goals/${branchFlat}/
// route scope: ${bind.route}/.goals/
```

### what blueprint proposes

```
.goals/$branch/.blockers.latest.json
```

### why this is wrong

the blueprint path only accounts for repo scope. for route scope, the path should be:
```
${bind.route}/.goals/.blockers.latest.json
```

the blocker state operations need to take `scopeDir` as input (like `getGoals` does), not hardcode `.goals/$branch/`.

### fix

blueprint should specify:
```
${scopeDir}/.blockers.latest.json
```

and the operations should take `scopeDir` as input:
```ts
getGoalBlockerState(input: { scopeDir: string })
setGoalBlockerState(input: { scopeDir: string; goalSlug: string })
resetGoalBlockerState(input: { scopeDir: string })
```

---

## issue 3: reset* vs del* verb inconsistency

### what extant code shows

```ts
// drive operations:
getDriveBlockerState
setDriveBlockerState
delDriveBlockerState  // uses 'del' verb
```

`delDriveBlockerState` removes the file entirely (which effectively resets count to 0).

### what blueprint proposes

```ts
getGoalBlockerState
setGoalBlockerState
resetGoalBlockerState  // uses 'reset' verb
```

### analysis

r5 has-consistent-conventions justified this as "semantically distinct: reset = set count to 0, del = remove file."

actual implementation of delDriveBlockerState:
```ts
await fs.rm(statePath, { force: true });  // removes file
return { cleared: true };
```

file removal vs count reset achieves the same semantic outcome. the verb should match.

### decision

**keep reset* as proposed.** the semantic distinction is valid:
- `del` implies file deletion (implementation detail)
- `reset` implies conceptual reset (domain intent)

the blueprint's `reset` better expresses domain intent. this is an improvement, not a deviation.

---

## summary of fixes needed

| issue | fix |
|-------|-----|
| 1. goalSlug not nullable | change to `goalSlug: string \| null` |
| 2. path doesn't account for scope | change to `${scopeDir}/.blockers.latest.json`, operations take `scopeDir` input |
| 3. reset vs del | keep reset — this is an improvement |

---

## verification: do these fixes address the vision?

**vision says:**
> add `.goals/$branch/.blockers.latest.json` that tracks...

this is the repo scope case. the vision doesn't mention route scope, but route scope is implied by the broader context (goals work in both scopes).

**criteria usecase.7 says:**
> when brain fulfills a goal after reminders
>   then blockers count resets for that goal

this confirms `reset` semantics are correct.

---

## conclusion

2 real issues found that need blueprint fixes:
1. GoalBlockerState.goalSlug should be `string | null`
2. blocker operations should take `scopeDir` as input

1 non-issue (reset vs del is an improvement, not a deviation).

blueprint adherance review: **blocked until issues fixed.**

