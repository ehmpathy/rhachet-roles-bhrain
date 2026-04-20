# self-review r1: has-questioned-deletables

## what i found

i reviewed each feature and component in the blueprint for traceability to the wish and deletability. i questioned every file in the filediff tree and every codepath for whether it can be deleted or simplified.

---

## features traced to wish

i verified each feature traces to an explicit wish item:

| feature | wish item | exact quote from wish |
|---------|-----------|----------------------|
| briefs boot + onBoot | wish 1 | "add achiever briefs which teach and incentivize brains to use goals. (if they already exist, is there a hook to boot those briefs?)" |
| scope auto-detect | wish 2 | "we need to discourage use of --scope repo. scope should be automatic. fix the skill headers" |
| skill headers | wish 3 | "we need to update the skill headers and help messages to make it clearer how to positively use the goals" |
| escalation | wish 4 | "just like the route.drive has a blockers.json, and after 5 repeated blocks it makes it clearer and clearer to the brain... the goals onstop hooks need the same" |
| onBoot hook | wish 5 | "we need an onBoot hook to boot up the goal.triage.next hooks back into memory, to ensure after compaction all is kept fresh. i.e., --when hook.onBoot" |
| arg validation | wish 6 | "need to forbid unknown args on the rhx goal.memory.set operation... unknown keys -> failfast" |
| help output | wish 7 | "rhx goal.memory.set --help should make it super duper clear how to use the operation with best practices and examples included" |

**conclusion:** all 7 features trace to explicit wish quotes. no features were assumed or invented.

---

## filediff tree questioned

| feature | wish item | traceability |
|---------|-----------|--------------|
| briefs boot + onBoot | wish 1 | explicit: "add achiever briefs which teach... is there a hook to boot?" |
| scope auto-detect | wish 2 | explicit: "discourage use of --scope repo. scope should be automatic" |
| skill headers | wish 3 | explicit: "update the skill headers and help messages" |
| escalation | wish 4 | explicit: "just like the route.drive has a blockers.json, after 5 repeated blocks..." |
| onBoot hook | wish 5 | explicit: "we need an onBoot hook to boot up the goal.triage.next" |
| arg validation | wish 6 | explicit: "need to forbid unknown args... unknown keys -> failfast" |
| help output | wish 7 | explicit: "rhx goal.memory.set --help should make it super duper clear" |

**conclusion:** all 7 features trace directly to wish items. none are assumed.

---

## filediff questioned file-by-file

### [+] GoalBlocker.ts

**can it be deleted?** no. wish 4 explicitly says "just like the route.drive has a blockers.json". we need a domain literal to represent blocker state.

**can it be simplified?** already minimal: `{ count: number, goalSlug: string | null }`. matches DriveBlockerState exactly.

### [+] getGoalBlockerState.ts

**can it be deleted?** no. needed to read current block count for escalation logic.

**can it be simplified?** it reads a single json file and returns parsed state or fresh state. already minimal.

### [+] setGoalBlockerState.ts

**can it be deleted?** no. needed to increment block count on each stop attempt.

**can it be simplified?** already minimal: read current, increment, write.

### [+] resetGoalBlockerState.ts

**can it be deleted?** questionable — see "components questioned" section below.

### [~] Goal.ts

**can this change be deleted?** no. we need GOAL_STATUS_CHOICES array for runtime validation (wish 6). types are erased at runtime.

**can it be simplified?** the change is minimal: export an array derived from the type.

### [~] getAchieverRole.ts

**can this change be deleted?** no. wish 5 explicitly requires onBoot hook.

**can it be simplified?** change is one line: add onBoot hook to the extant hooks config.

### [~] goal.memory.set.sh

**can this change be deleted?** no. wish 3 explicitly requires updated skill headers.

**can it be simplified?** no. the header needs examples and best practices per wish 7.

### [~] goal.triage.next.sh

**can this change be deleted?** no. wish 5 requires `--when hook.onBoot` support.

**can it be simplified?** change is minimal: add onBoot mode to header docs.

### [~] goal.triage.infer.sh

**can this change be deleted?** possible — only updated for consistency.

**decision:** keep for consistency with other skill headers. not strictly required by wish but prevents header drift.

### [~] goal.ts

**can this change be deleted?** no. contains all CLI logic for wishes 2, 6, 7:
- scope validation (wish 2)
- unknown arg validation (wish 6)
- help output (wish 7)
- escalation logic (wish 4)

**can it be simplified?** the changes are already decomposed into focused functions.

### [~] goal.test.ts

**can this change be deleted?** no. tests are required proof of behavior per criteria.

**can it be simplified?** test scope matches implementation scope. no unnecessary coverage.

---

## components questioned for deletion

### GoalBlocker.ts + get/set/reset operations

**question:** can we inline the blocker state logic instead of separate domain operations?

**answer:** no, delete would be wrong. the pattern replicates DriveBlockerState which already exists in this repo. parallel domain operations maintain consistency with extant patterns. the wish explicitly says "just like the route.drive has a blockers.json" — replication is intentional.

**verdict:** keep as-is.

### resetGoalBlockerState.ts

**question:** do we need a separate reset operation? could the count reset implicitly in setGoal when status changes to fulfilled?

**answer:** yes, separate reset is cleaner.

1. single responsibility: setGoal handles goal mutation, resetGoalBlockerState handles blocker state
2. testability: can test reset in isolation
3. the DriveBlockerState pattern doesn't have explicit reset but goals have different semantics — goals can be fulfilled partially or incrementally

**verdict:** keep, but note it can be reconsidered in implementation if simpler approach emerges.

### GOAL_STATUS_CHOICES export

**question:** is this new constant necessary? can't we derive from GoalStatusChoice type?

**answer:** yes, necessary. TypeScript types are erased at runtime. we need a runtime array for validation:

```typescript
// type is erased at runtime — can't iterate
type GoalStatusChoice = 'incomplete' | 'blocked' | ...;

// array exists at runtime — can validate against it
const GOAL_STATUS_CHOICES = ['incomplete', 'blocked', ...] as const;
```

**verdict:** keep.

### separate parseYamlInput with unknown key detection

**question:** can yaml validation be combined with flag validation?

**answer:** no. they are separate input modes:
- flags: `--why.ask "..."` parsed from argv
- yaml: piped via stdin, parsed with js-yaml

each has distinct validation needs. separate paths maintain clarity.

**verdict:** keep.

---

## simplifications found

### issue 1: too many escalation tiers

**what was wrong:** i proposed 3 tiers (1-2, 3-4, 5+) for escalation.

**simplification:** the wish says "after 5 repeated blocks". we only need 2 tiers:
- count < 5: gentle reminder
- count >= 5: escalated reminder

**fix:** simplified escalation to 2 tiers in the blueprint.

### issue 2: integration tests may be overkill

**what was wrong:** i proposed integration tests for get/set/reset GoalBlockerState.

**consideration:** these are simple file operations — is integration test overkill?

**answer:** no, integration tests are appropriate. the operations touch filesystem and need to verify actual file behavior (read/write/mkdir). unit tests would require mock fs which is discouraged.

**verdict:** keep integration tests.

---

## non-issues: why they hold

### keep 3 skill header updates

**why it holds:** all three skills (goal.memory.set, goal.triage.next, goal.triage.infer) have outdated headers. wish 3 says "update the skill headers and help messages" — plural. all three updates maintain consistency.

### separate acceptance tests

**why it holds:** acceptance tests verify blackbox behavior — the actual CLI invocation. unit tests verify components. both are needed:
- unit tests: fast, cover edge cases
- acceptance tests: verify the shell skill works end-to-end

### detailed help output format

**why it holds:** wish 7 says "super duper clear how to use the operation with best practices and examples included". the detailed format directly addresses this ask.

---

## summary

| item | decision |
|------|----------|
| all 7 features | keep — traced to wish |
| GoalBlocker domain operations | keep — follows extant pattern |
| resetGoalBlockerState | keep — single responsibility |
| GOAL_STATUS_CHOICES | keep — runtime validation needs array |
| separate yaml validation | keep — distinct input modes |
| 3 escalation tiers | simplified to 2 tiers |
| integration tests | keep — filesystem operations |
| 3 skill headers | keep — wish says plural |
| acceptance tests | keep — verify end-to-end |
| detailed help | keep — "super duper clear" |

1 simplification made. 0 deletions needed. all features trace to wish.
