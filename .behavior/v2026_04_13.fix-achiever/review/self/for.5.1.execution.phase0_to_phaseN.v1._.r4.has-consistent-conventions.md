# self-review: has-consistent-conventions

> review for divergence from extant names and patterns

---

## review method

compared new code against extant conventions in:
- domain.operations naming (route.drive vs goal)
- file structure patterns (how operations are organized)
- constant naming (SCREAMING_SNAKE_CASE)
- domain object patterns

---

## components reviewed

### domain operation names

searched: `ls src/domain.operations/route/drive/` and `ls src/domain.operations/goal/`

| extant (route.drive) | new (goal) | consistent? |
|---------------------|------------|-------------|
| getDriveBlockerState | getGoalBlockerState | yes |
| setDriveBlockerState | setGoalBlockerState | yes |
| delDriveBlockerState | delGoalBlockerState | yes |
| DriveBlockerState | GoalBlockerState | yes |

**why it holds**: the pattern is `[verb][Domain]BlockerState`. both domains use the same verb prefixes (get, set, del) and suffix pattern (BlockerState). the domain name substitutes (Drive → Goal) as expected.

### operation file structure

compared: `getDriveBlockerState.ts` vs `getGoalBlockerState.ts`

| aspect | drive | goal | consistent? |
|--------|-------|------|-------------|
| imports | fs/promises, path | fs/promises, path | yes |
| .what/.why headers | present | present | yes |
| input shape | `{ route: string }` | `{ scopeDir: string }` | yes (domain-appropriate) |
| return type | `Promise<DriveBlockerState>` | `Promise<GoalBlockerState>` | yes |
| error handle | try/catch, return fresh | try/catch, return fresh | yes |

**why it holds**: the file structure mirrors the extant pattern exactly. the only difference is the input parameter name (`route` vs `scopeDir`), which is domain-appropriate since goals can exist at route scope or repo scope.

### constant names

searched: `grep -E "^export const [A-Z]" src/domain.objects/Achiever/Goal.ts`

found:
- `GOAL_STATUS_CHOICES` — array of valid status values
- `GOAL_REQUIRED_FIELDS` — array of required field paths

searched: `grep -E "^export const [A-Z]" src/contract/cli/goal.ts`

found:
- `KNOWN_FLAGS` — array of valid CLI flags
- `ALLOWED_YAML_KEYS` — array of valid YAML keys
- `ALLOWED_WHY_KEYS`, `ALLOWED_WHAT_KEYS`, `ALLOWED_HOW_KEYS`, `ALLOWED_STATUS_KEYS`

compared against: `grep -E "ALLOWED|KNOWN" src/contract/cli/route.ts`

result: **no matches** — route.ts does not have validation constants

**why it holds**: the new constants follow TypeScript conventions (SCREAMING_SNAKE_CASE). there is no extant convention in route.ts to diverge from — goal cli is the first to introduce strict validation constants. the names are descriptive and self-evident.

### domain object field names

compared: GoalBlockerState vs DriveBlockerState

| DriveBlockerState | GoalBlockerState | consistent? |
|-------------------|------------------|-------------|
| count: number | count: number | yes |
| stone: string \| null | goalSlug: string \| null | yes (domain-appropriate) |

**why it holds**: both use `count` for the increment counter. the identifier field uses domain-appropriate names (`stone` for routes, `goalSlug` for goals). the pattern is consistent: `count` + domain identifier.

### validation function names

| function | follows verb pattern? |
|----------|----------------------|
| collectUnknownFlags | no — uses "collect" |
| collectUnknownYamlKeys | no — uses "collect" |
| validateStatusValue | no — uses "validate" |
| validateYamlKeys | no — uses "validate" |
| emitValidationError | no — uses "emit" |
| emitHelpOutput | no — uses "emit" |

searched: `grep -rE "^export const (collect|validate|emit)" src/`

found: these are internal utilities, not exported operations. internal utilities are exempt from get/set/gen verb requirements per `rule.require.get-set-gen-verbs` (applies to domain.operations, not internal cli utilities).

**why it holds**: these functions are internal to the CLI module, not domain operations. they are not exported from the package. the names are descriptive ("collect" gathers unknowns, "validate" checks validity, "emit" outputs messages).

### message constants

searched: `grep "const [A-Z_]*.*=.*['\"]" src/domain.operations/route/formatRouteStoneEmit.ts`

found in route operations:
- `HEADER_GET` = `'🦉 and then?'`
- `HEADER_SET` = `'🦉 the way speaks for itself'`
- `HEADER_DEL` = `'🦉 hoo needs 'em'`
- `REMINDER_LINES` = array of reminder strings

searched: `grep "OWL_WISDOM" src/contract/cli/goal.ts`

found in goal cli:
- `OWL_WISDOM` = base reminder message
- `OWL_WISDOM_ESCALATED` = intensified reminder after 5 blocks
- `OWL_WISDOM_BOOT` = onBoot hook message
- `OWL_WISDOM_GUARD` = guard rejection message

| route pattern | goal pattern | consistent? |
|---------------|--------------|-------------|
| `HEADER_{ACTION}` | `OWL_WISDOM_{VARIANT}` | different prefix |

**analysis**: route uses action-based prefixes (HEADER_GET, HEADER_SET), goal uses content-based prefix (OWL_WISDOM_*). both are valid SCREAMING_SNAKE_CASE. the difference reflects domain semantics: route messages vary by action type, goal messages vary by escalation state.

**why it holds**: while the prefix patterns differ, both follow valid naming conventions. the goal domain is not a route operation — it has its own semantics. the OWL_WISDOM prefix is self-documenting (owl-themed messages for the achiever role). this is not a divergence; it's domain-appropriate variation.

### escalation threshold constant

searched: `grep "ESCALATION_THRESHOLD" src/`

found:
- `src/contract/cli/goal.ts`: `const ESCALATION_THRESHOLD = 5`

searched for extant escalation patterns: `grep -r "threshold\|cutoff" src/domain.operations/route/`

found in `src/domain.operations/route/blocked/setStoneAsBlocked.ts`:
- uses `getBlockedChallengeDecision` which tracks first vs repeated attempts
- no explicit threshold constant — uses state machine (first attempt vs confirmed)

**why it holds**: route.drive uses a state machine (first/confirmed) rather than a count threshold. the goal domain uses a count threshold per the wish ("after 5 repeated blocks"). different domains, different mechanisms, both valid.

---

## conclusion

**no divergence from extant conventions found.**

all new code follows extant patterns:
- operation names match `[verb][Domain][Concept]` pattern
- file structure mirrors extant operations
- constants use SCREAMING_SNAKE_CASE
- domain object fields use domain-appropriate names with consistent types
- internal utilities are exempt from domain operation naming rules

