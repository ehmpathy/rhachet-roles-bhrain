# self-review r4: has-consistent-mechanisms

## what i found

i reviewed the blueprint mechanisms against extant codebase patterns. most mechanisms extend or replicate extant patterns as intended.

---

## mechanism-by-mechanism consistency check

### 1. GoalBlockerState — replicates DriveBlockerState

**blueprint:** `GoalBlocker.ts` with `{ count, goalSlug }`

**extant:** `DriveBlocker.ts` with `{ count, stone }`

**analysis:** parallel structure by design. wish says "just like the route.drive has a blockers.json." replication is intentional.

**verdict:** consistent — intentional parallel.

---

### 2. get/set/reset BlockerState — replicates Drive pattern

**blueprint:** `getGoalBlockerState.ts`, `setGoalBlockerState.ts`, `resetGoalBlockerState.ts`

**extant:** `getDriveBlockerState.ts`, `setDriveBlockerState.ts` (no reset exists for Drive)

**analysis:** get/set follows extant pattern. reset is new but needed because goals can be fulfilled (stones cannot).

**verdict:** consistent — extends pattern for domain needs.

---

### 3. onBoot hook — uses Role.build() hooks

**blueprint:** add `onBoot` array to `hooks.onBrain` in getAchieverRole.ts

**extant:** `hooks.onBrain.onTool` and `hooks.onBrain.onStop` already in getAchieverRole.ts

**analysis:** same hook structure, same location. just adds another hook type.

**verdict:** consistent — follows extant hook pattern.

---

### 4. arg validation — no extant pattern

**blueprint:** `collectUnknownFlags()`, `validateUnknownFlags()`, `validateStatusValue()`

**extant:** searched codebase for `validateUnknown`, `collectUnknown`, `BadRequestError.*unknown` — no results.

**analysis:** this is new functionality. arg parse in `goal.ts` currently silently ignores unknowns. other CLIs in `route.ts` don't validate unknown flags either.

**should we reuse an extant component?** no extant component exists. we create new functions.

**verdict:** new mechanism — no duplication of extant.

---

### 5. help output — follows printHelp pattern

**blueprint:** `handleHelp()` with `emitHelpOutput()` function

**extant:** `printGetHelp()`, `printSetHelp()`, `printJudgeHelp()` in `route.ts` (lines 102-149)

**analysis:** extant pattern uses simple `console.log` with template string. our help is more detailed per wish 7 but same structure.

**verdict:** consistent — follows extant pattern with more detail.

---

### 6. GOAL_STATUS_CHOICES — extends Goal.ts

**blueprint:** export array alongside type

**extant:** `GoalStatusChoice` type already in `Goal.ts`

**analysis:** we add runtime array derived from the type. no duplication — the type existed, array is new for validation.

**verdict:** consistent — extends extant type.

---

### 7. skill headers — follows .sh header pattern

**blueprint:** rewrite goal.memory.set.sh, goal.triage.next.sh, goal.triage.infer.sh headers

**extant:** shell skill headers in briefs (searched `skills/*.sh` — many follow same pattern)

**analysis:** headers are documentation. we update content, same structure.

**verdict:** consistent — same header structure.

---

## duplicate detection: none found

i searched for:
- `emitValidationError` — not found
- `validateUnknown` — not found
- `collectUnknown` — not found
- `BadRequestError.*unknown` — not found
- `handleHelp` — not found in goal.ts, exists in route.ts as `printHelp*`

no duplication of extant mechanisms. new mechanisms fill gaps.

---

## summary

| mechanism | extant pattern? | consistent? |
|-----------|----------------|-------------|
| GoalBlockerState | DriveBlockerState | yes (intentional parallel) |
| get/set/resetBlockerState | getDrive/setDriveBlockerState | yes (extends) |
| onBoot hook | hooks.onBrain.onTool/onStop | yes (same structure) |
| arg validation | none | N/A (new) |
| help output | printHelp* pattern | yes (same structure) |
| GOAL_STATUS_CHOICES | GoalStatusChoice type | yes (extends) |
| skill headers | .sh header pattern | yes (same structure) |

0 inconsistent mechanisms found. all new mechanisms either replicate extant patterns or fill gaps where no extant mechanism exists.
