# self-review r5: has-consistent-conventions

## what i found

i reviewed the blueprint for divergence from extant name conventions and patterns. all proposed names follow extant conventions.

---

## convention-by-convention check

### 1. GoalBlocker.ts file name

**extant pattern:** `DriveBlocker.ts` contains `DriveBlockerState`

**blueprint proposes:** `GoalBlocker.ts` contains `GoalBlockerState`

**analysis:** follows extant pattern — file named after concept, exports state type.

**verdict:** consistent.

---

### 2. GoalBlockerState shape

**extant pattern:**
```ts
DriveBlockerState {
  count: number;
  stone: string | null;
}
```

**blueprint proposes:**
```ts
GoalBlockerState {
  count: number;
  goalSlug: string;
}
```

**analysis:** parallel structure. field names differ to match domain (`stone` vs `goalSlug`).

**verdict:** consistent — domain-appropriate field names.

---

### 3. operation file names

**extant pattern:** `getDriveBlockerState.ts`, `setDriveBlockerState.ts`, `delDriveBlockerState.ts`

**blueprint proposes:** `getGoalBlockerState.ts`, `setGoalBlockerState.ts`, `resetGoalBlockerState.ts`

**analysis:**
- `get*` and `set*` follow extant pattern
- `reset*` differs from `del*` but semantically distinct: reset = set count to 0, del = remove file

**verdict:** consistent — `reset` is appropriate for the operation semantics.

---

### 4. blocker file path

**extant pattern:** `.route/.drive.blockers.latest.json`

**blueprint proposes:** `.goals/$branch/.blockers.latest.json`

**analysis:** follows structure with appropriate namespace. uses `.blockers.latest.json` suffix.

**verdict:** consistent.

---

### 5. GOAL_STATUS_CHOICES array

**extant pattern:** `GOAL_REQUIRED_FIELDS` array already exported in Goal.ts

**blueprint proposes:** `GOAL_STATUS_CHOICES` array

**analysis:** follows extant pattern for runtime arrays derived from types.

**verdict:** consistent.

---

### 6. emit* function names

**extant pattern in goal.ts:** `emitOwlHeader`, `emitSubBucket`, `emitGoalFull`, `emitGoalCondensed`

**blueprint proposes:** `emitValidationError`, `emitHelpOutput`

**analysis:** follows goal.ts's `emit*` prefix convention.

**verdict:** consistent.

---

### 7. handleHelp function

**extant pattern in route.ts:** inline `if (command === 'help')` checks

**blueprint proposes:** `handleHelp()` function

**analysis:** different but cleaner approach. `handle*` is a common pattern. not a violation.

**verdict:** acceptable variation — cleaner approach.

---

### 8. hook registration

**extant pattern:**
```ts
onTool: [{ command: '...', timeout: 'PT5S', filter: {...} }]
onStop: [{ command: '...', timeout: 'PT10S' }]
```

**blueprint proposes:**
```ts
onBoot: [{ command: 'rhx goal.triage.next --when hook.onBoot', timeout: 'PT10S' }]
```

**analysis:** follows extant hook structure. `onBoot` is supported per comment on line 48-51.

**verdict:** consistent.

---

### 9. skill header format

**extant pattern:**
```bash
######################################################################
# .what = ...
#
# .why = ...
#
# usage:
#   ...
#
# options:
#   ...
######################################################################
```

**blueprint proposes:** same structure with expanded examples and best practices

**analysis:** extends extant format with more detail, same structure.

**verdict:** consistent — extends without format change.

---

### 10. cli error format

**extant pattern (route.ts):** treestruct with `└─ ✋` prefix for blockers

**blueprint proposes:** `└─ ✋ unknown flag: --foo`

**analysis:** follows extant treestruct error format.

**verdict:** consistent.

---

## summary

| name/pattern | extant convention | blueprint | consistent? |
|--------------|------------------|-----------|-------------|
| GoalBlocker.ts | DriveBlocker.ts | follows | yes |
| GoalBlockerState | DriveBlockerState | follows | yes |
| get/set/reset* | get/set/del* | reset differs (semantic) | yes |
| blocker file path | .route/.drive.blockers.latest.json | .goals/$branch/.blockers.latest.json | yes |
| GOAL_STATUS_CHOICES | GOAL_REQUIRED_FIELDS | follows | yes |
| emit* functions | emitOwlHeader, etc | emitValidationError, etc | yes |
| handleHelp | inline checks | function | acceptable |
| onBoot hook | onTool/onStop | follows | yes |
| skill headers | .what/.why/usage | follows with more | yes |
| error format | └─ ✋ | follows | yes |

0 name divergences found. all proposed names follow extant conventions.

