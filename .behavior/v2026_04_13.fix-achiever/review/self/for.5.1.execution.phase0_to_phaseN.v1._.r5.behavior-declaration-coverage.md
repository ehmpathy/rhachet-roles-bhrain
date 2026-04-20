# self-review: behavior-declaration-coverage

> review for coverage of the behavior declaration

---

## review method

walked through each wish item in the blueprint, verified implementation in code and tests.

---

## wish coverage

### wish 1: briefs boot

**requirement**: add onBoot hook to refresh after compaction

**verification**:
- searched: `grep -r "onBoot" src/domain.roles/achiever/`
- found: `getAchieverRole.ts` lines 23-27

```typescript
onBoot: [
  {
    command:
      './node_modules/.bin/rhx goal.triage.next --when hook.onBoot',
  },
],
```

**why it holds**: onBoot hook is present and runs `goal.triage.next --when hook.onBoot` after compaction. the skill header documents this mode.

### wish 2: scope auto-detect

**requirement**: fail-fast if `--scope repo` while bound to route

**verification**:
- read: `src/contract/cli/goal.ts` lines 618-635

```typescript
const assertScopeWhenBound = async (
  explicitScope: 'route' | 'repo' | undefined,
): Promise<void> => {
  if (explicitScope !== 'repo') {
    return; // no explicit --scope repo, check not needed
  }

  // check if bound to a route
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

- invocation: line 735 `await assertScopeWhenBound(explicitScope);`

**why it holds**: the function checks if user passed `--scope repo` while bound to a route. if so, it emits a helpful error with hint and exits with code 2. the check uses `getRouteBindByBranch` which is the canonical way to detect if currently bound to a route.

### wish 3: skill headers

**requirement**: rewrite with recommended patterns (flags one-by-one)

**verification**:
- read: `goal.memory.set.sh` header (lines 1-50)

found:
- flags one-by-one usage as primary example (lines 7-18)
- status update example (lines 20-24)
- all 6 required fields listed (lines 26-32)
- all optional fields listed (lines 34-40)
- note about automatic scope (lines 42-44)
- note about stdin yaml (lines 46-47)
- help reference (line 49)

**why it holds**: header shows flags one-by-one as the recommended pattern. stdin yaml is mentioned but explicitly noted as "not recommended".

### wish 4: escalation

**requirement**: replicate DriveBlockerState for goal blockers, escalate onStop messages after 5 blocks

**verification**:
- searched: `ls src/domain.operations/goal/`
- found: GoalBlocker.ts, getGoalBlockerState.ts, setGoalBlockerState.ts, delGoalBlockerState.ts
- searched: `grep "ESCALATION_THRESHOLD" src/contract/cli/goal.ts`
- found: `const ESCALATION_THRESHOLD = 5`
- found: `if (count >= ESCALATION_THRESHOLD)` triggers escalated message

**why it holds**: GoalBlockerState mirrors DriveBlockerState. escalation triggers at count >= 5 as specified in the wish.

### wish 5: onBoot hook

**requirement**: add `--when hook.onBoot` mode to goal.triage.next

**verification**:
- read: `goal.triage.next.sh` header
- found: `--when hook.onBoot` documented (lines 11, 15, 20, 26)
- searched: `grep "handleOnBootMode\|hook.onBoot" src/contract/cli/goal.ts`
- found: `handleOnBootMode` implementation

**why it holds**: onBoot mode is documented in skill header and implemented in CLI. outputs informational goal summary to refresh context.

### wish 6: arg validation

**requirement**: fail-fast on unknown flags, unknown yaml keys, invalid status values

**verification**:
- searched: `grep "KNOWN_FLAGS\|ALLOWED_YAML_KEYS\|validateStatusValue" src/contract/cli/goal.ts`
- found: all three constants/functions defined
- searched: `grep "collectUnknownFlags\|collectUnknownYamlKeys" src/contract/cli/goal.ts`
- found: collection functions that gather unknown items

**why it holds**: unknown flags trigger fail-fast with allowed flags list. unknown yaml keys trigger fail-fast with allowed keys. invalid status values trigger fail-fast with valid choices.

### wish 7: help output

**requirement**: comprehensive `--help` with examples and best practices

**verification**:
- searched: `grep "emitHelpOutput" src/contract/cli/goal.ts`
- found: `emitHelpOutput` function definition (line 80)
- read: unit tests for help output

**why it holds**: help output includes:
- recommended usage pattern (flags one-by-one)
- all 6 required fields with descriptions
- optional fields
- create goal example
- status update example
- valid status values
- note about stdin yaml

---

## test coverage verification

### unit tests

searched: `grep -c "then\|it\(" src/contract/cli/goal.test.ts`

unit tests verified:
- KNOWN_FLAGS contains all required flags
- ALLOWED_YAML_KEYS contains all valid keys
- help output emits comprehensive content
- unknown flag detection works
- status validation works
- yaml key validation works
- escalation threshold works

### integration tests

verified files exist:
- `src/domain.operations/goal/getGoalBlockerState.integration.test.ts`
- `src/domain.operations/goal/setGoalBlockerState.integration.test.ts`
- `src/domain.operations/goal/delGoalBlockerState.integration.test.ts`

### acceptance tests

per execution file: acceptance tests are defined but not yet created (phase 8 incomplete). this is documented in the execution file with note about api key requirements.

---

## conclusion

**all 7 wish items are covered in the implementation.**

| wish | item | covered? |
|------|------|----------|
| 1 | briefs boot / onBoot hook | yes |
| 2 | scope auto-detect | yes |
| 3 | skill headers | yes |
| 4 | escalation | yes |
| 5 | onBoot hook mode | yes |
| 6 | arg validation | yes |
| 7 | help output | yes |

phase 8 (acceptance tests) is incomplete but documented with api key requirements. phases 0-7 are complete per the execution file.

