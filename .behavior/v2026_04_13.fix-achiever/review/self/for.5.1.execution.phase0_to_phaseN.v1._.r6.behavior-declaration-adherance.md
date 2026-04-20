# self-review: behavior-declaration-adherance

> review for adherance to behavior declaration (vision, criteria, blueprint)

---

## review method

walked through each changed source file, verified against:
1. vision document - does it match the described outcome?
2. criteria document - does it satisfy the usecases?
3. blueprint document - does it follow the spec?

---

## file-by-file review

### src/contract/cli/goal.ts

#### vision adherance

**vision requirement**: "fail-fast if `--scope repo` while bound to route"

**verification**:
- found: `assertScopeWhenBound` (lines 618-635)
- code calls `getRouteBindByBranch({ branch: null })` to detect route
- if bound and explicit `--scope repo`, emits validation error and exits 2

```typescript
const assertScopeWhenBound = async (
  explicitScope: 'route' | 'repo' | undefined,
): Promise<void> => {
  if (explicitScope !== 'repo') {
    return; // no explicit --scope repo, check not needed
  }
  const bind = await getRouteBindByBranch({ branch: null });
  if (bind) {
    emitValidationError({
      context: 'goal.memory.set --scope repo',
      error: 'scope is automatic when bound to a route',
      hint: 'remove --scope flag; scope defaults to route when bound',
    });
    process.exit(2);
  }
};
```

**why it holds**: matches vision requirement exactly. error message provides hint as specified.

---

**vision requirement**: "escalate after 5 repeated blocks"

**verification**:
- found: `ESCALATION_THRESHOLD = 5` (line 40)
- found: `escalateMessageByCount` (lines 60-65)
- function returns `OWL_WISDOM_ESCALATED` when count >= 5

```typescript
const ESCALATION_THRESHOLD = 5;
const OWL_WISDOM_ESCALATED =
  '🦉 friend, you have been reminded many times. the work must be done.';

export const escalateMessageByCount = (count: number): string => {
  if (count >= ESCALATION_THRESHOLD) {
    return OWL_WISDOM_ESCALATED;
  }
  return OWL_WISDOM;
};
```

**why it holds**: threshold is exactly 5 as wisher specified in wish item 4.

**full flow verification** (lines 1700-1728):
- getGoalBlockerState reads current count from .blockers.latest.json
- setGoalBlockerState increments count after each reminder
- escalateMessageByCount returns OWL_WISDOM_ESCALATED when count >= 5
- message emitted to stderr with process.exit(2)

```typescript
// from handleOnStopMode (lines 1705-1713)
const blockerState = await getGoalBlockerState({ scopeDir });
await setGoalBlockerState({ scopeDir, goalSlug: firstGoalSlug });
const newCount = blockerState.count + 1;
const escalatedMessage = escalateMessageByCount(newCount);
const isEscalated = newCount >= ESCALATION_THRESHOLD;
console.error(escalatedMessage);
```

**why the flow holds**: the escalation state persists across invocations via JSON file, count increments each onStop, and resets when goal is fulfilled (via delGoalBlockerState).

---

**vision requirement**: "fail-fast on unknown flags with helpful error"

**verification**:
- found: `KNOWN_FLAGS` array (lines 336-343)
- found: `collectUnknownFlags` (lines 422-438)
- called in `parseArgsForSet` (lines 658-666)
- emits validation error with unknown flags and allowed list

**why it holds**: matches criteria usecase.6 - unknown flag triggers fail-fast with allowed flags.

---

**vision requirement**: "fail-fast on invalid status values"

**verification**:
- found: `validateStatusValue` (lines 444-454)
- imports `GOAL_STATUS_CHOICES` from Goal.ts
- exits 2 with error that shows valid choices

**why it holds**: matches criteria usecase.3 - invalid status value triggers fail-fast.

---

**vision requirement**: "fail-fast on unknown YAML keys"

**verification**:
- found: `ALLOWED_YAML_KEYS` (lines 349-359)
- found: `ALLOWED_WHY_KEYS`, `ALLOWED_WHAT_KEYS`, `ALLOWED_HOW_KEYS`, `ALLOWED_STATUS_KEYS`
- found: `collectUnknownYamlKeys` (lines 460-509)
- found: `validateYamlKeys` (lines 515-535)

**why it holds**: matches criteria usecase.6 - yaml with unknown keys triggers fail-fast.

---

**vision requirement**: "comprehensive --help output"

**verification**:
- found: `emitHelpOutput` (lines 80-123)
- output shows recommended usage (flags one-by-one)
- lists all 6 required fields with descriptions
- includes create goal example
- includes status update example
- notes stdin yaml allowed but not recommended

**why it holds**: matches criteria usecase.5 exactly.

---

### src/domain.roles/achiever/getAchieverRole.ts

**vision requirement**: "onBoot hook to refresh goals after compaction"

**verification**:
- found: `onBoot` hook array (lines 24-30)
- command: `./node_modules/.bin/rhx goal.triage.next --when hook.onBoot`
- timeout: PT10S

```typescript
onBoot: [
  {
    command:
      './node_modules/.bin/rhx goal.triage.next --when hook.onBoot',
    timeout: 'PT10S',
  },
],
```

**why it holds**: matches blueprint wish 5 - onBoot hook runs goal.triage.next with --when hook.onBoot.

---

### src/domain.roles/achiever/skills/goal.memory.set.sh

**vision requirement**: "rewrite headers with recommended patterns (flags one-by-one)"

**verification**:
- header shows flags one-by-one as primary usage (lines 7-18)
- lists all 6 required fields (lines 26-32)
- lists optional fields (lines 34-40)
- notes scope is automatic (lines 42-44)
- notes stdin yaml not recommended (lines 46-47)

**why it holds**: matches blueprint wish 3 - skill headers updated with best practices.

---

### src/domain.roles/achiever/skills/goal.triage.next.sh

**vision requirement**: "add --when hook.onBoot mode"

**verification**:
- header documents both modes (lines 10-16):
  - `hook.onBoot = informational refresh after compaction (exit 0)`
  - `hook.onStop = halt until goals fulfilled (exit 2)`
- usage shows `--when hook.onBoot` (line 15)

**why it holds**: matches blueprint wish 5 - onBoot mode documented.

---

### src/domain.operations/goal/*GoalBlockerState*.ts

**vision requirement**: "replicate DriveBlockerState for goal blockers"

**verification**:
- found: `getGoalBlockerState.ts` - reads from `${scopeDir}/.blockers.latest.json`
- found: `setGoalBlockerState.ts` - increments count
- found: `delGoalBlockerState.ts` - clears state on progress
- all take `scopeDir` input (supports route + repo scope)

**why it holds**: matches blueprint wish 4 - GoalBlocker mirrors DriveBlocker pattern.

---

### src/domain.objects/Achiever/Goal.ts

**vision requirement**: "export GOAL_STATUS_CHOICES array"

**verification**:
- searched: `grep "GOAL_STATUS_CHOICES" src/domain.objects/Achiever/Goal.ts`
- found at line 23

```typescript
// lines 19-29 from Goal.ts
/**
 * .what = array of valid status choices for runtime validation
 * .why = enables fail-fast on invalid status values in CLI
 */
export const GOAL_STATUS_CHOICES: GoalStatusChoice[] = [
  'incomplete',
  'blocked',
  'enqueued',
  'inflight',
  'fulfilled',
];
```

**why it holds**: matches blueprint and criteria usecase.3 - status choices exported for validation with all 5 valid values (incomplete, blocked, enqueued, inflight, fulfilled).

---

### src/domain.operations/goal/GoalBlocker.ts

**vision requirement**: "replicate DriveBlockerState pattern"

**verification**:
- GoalBlockerState is a DomainLiteral with count and goalSlug fields
- matches DriveBlockerState pattern from route.drive

**getGoalBlockerState.ts verification** (lines 1-29):
```typescript
/**
 * .what = reads goal blocker state from ${scopeDir}/.blockers.latest.json
 * .why = enables track of consecutive onStop reminders
 */
export const getGoalBlockerState = async (input: {
  scopeDir: string;
}): Promise<GoalBlockerState> => {
  // returns fresh state (count: 0) if file absent
};
```

**why it holds**: operations take `scopeDir` input (not hardcoded path), supports both route scope and repo scope per the blueprint.

---

## criteria coverage check

| usecase | criteria | covered? | evidence |
|---------|----------|----------|----------|
| 1 | session lifecycle with goals | yes | onBoot hook, onStop hooks |
| 2 | goal creation | yes | goal.memory.set with all validations |
| 3 | goal status updates | yes | validateStatusValue, GOAL_STATUS_CHOICES |
| 4 | scope detection | yes | assertScopeWhenBound, getDefaultScope |
| 5 | help and discoverability | yes | emitHelpOutput, skill headers |
| 6 | arg validation | yes | collectUnknownFlags, validateYamlKeys |
| 7 | escalation with blockers | yes | GoalBlockerState operations, escalateMessageByCount |
| 8 | direct file edit prevention | yes | goal.guard in onTool hook |

---

## blueprint adherance check

| blueprint item | spec | implemented? | evidence |
|----------------|------|--------------|----------|
| GoalBlocker.ts | domain literal { count, goalSlug } | yes | src/domain.operations/goal/ |
| get/set/delGoalBlockerState | take scopeDir input | yes | all operations accept scopeDir |
| ESCALATION_THRESHOLD | 5 | yes | const ESCALATION_THRESHOLD = 5 |
| assertScopeWhenBound | fail-fast if --scope repo while bound | yes | lines 618-635 |
| emitHelpOutput | comprehensive with examples | yes | lines 80-123 |
| onBoot hook | rhx goal.triage.next --when hook.onBoot | yes | getAchieverRole.ts |
| skill headers | flags one-by-one recommended | yes | goal.memory.set.sh |

---

## issues found and fixed

none found. all implementation matches the behavior declaration.

---

## conclusion

**all source files adhere to the behavior declaration.**

the implementation:
- matches the vision's described outcome world
- satisfies all 8 criteria usecases
- follows the blueprint specification accurately

no deviations or misinterpretations found.

