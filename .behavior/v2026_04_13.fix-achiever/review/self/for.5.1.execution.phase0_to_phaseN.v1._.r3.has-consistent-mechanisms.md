# self-review: has-consistent-mechanisms

> review for new mechanisms that duplicate extant functionality

---

## review method

searched codebase for related patterns:
- DriveBlocker pattern (for comparison with GoalBlocker)
- escalation utilities
- validation/error emission utilities

---

## components reviewed

### GoalBlockerState vs DriveBlockerState

searched: `grep -r DriveBlockerState`

found extant pattern in:
- `src/domain.operations/route/drive/DriveBlocker.ts`
- `src/domain.operations/route/drive/getDriveBlockerState.ts`
- `src/domain.operations/route/drive/setDriveBlockerState.ts`
- `src/domain.operations/route/drive/delDriveBlockerState.ts`

compared implementation:

| aspect | DriveBlocker | GoalBlocker | consistent? |
|--------|--------------|-------------|-------------|
| domain literal | `DomainLiteral<DriveBlockerState>` | `DomainLiteral<GoalBlockerState>` | yes |
| fields | `count`, `stone` | `count`, `goalSlug` | yes (domain-appropriate names) |
| file pattern | `.route/.drive.blockers.latest.json` | `$scopeDir/.blockers.latest.json` | yes |
| fresh state | `{ count: 0, stone: null }` | `{ count: 0, goalSlug: null }` | yes |
| operations | get/set/del | get/set/del | yes |

**why it holds**: GoalBlocker is explicitly modeled after DriveBlocker (wish item 4: "just like the route.drive has a blockers.json"). the implementation follows the same pattern: domain literal with count + identifier, same JSON persistence, same get/set/del operations. this is intentional reuse of the pattern, not code duplication.

### escalateMessageByCount

searched: `grep -r escalate`

found escalation used in:
- `src/domain.operations/route/blocked/setStoneAsBlocked.ts` - route stone block escalation
- `src/contract/cli/goal.ts` - new goal escalation

the route escalation is internal to route.drive. the goal escalation is internal to goal.triage.next. they serve different domains (route stones vs goals). shared code would introduce tight coupling.

**why it holds**: different domains, same pattern. each escalation is scoped to its domain. no shared utility needed because the logic is simple (count >= threshold) and the domains should evolve independently.

### emitValidationError

searched: `grep -r emitValidation`

found only in `src/contract/cli/goal.ts`

no extant validation error emission utility in the codebase. each cli command handles its own output format. this is consistent with how `src/contract/cli/route.ts` emits its own validation errors.

**why it holds**: cli modules own their output format. the treestruct output style (owl vibes) is consistent with the codebase, but each cli composes its own output. no shared utility exists, and one is not needed for a single usage.

### collectUnknownFlags / collectUnknownYamlKeys

searched: `grep -i "unknown.*flag\|invalid.*arg" src/contract/cli/route.ts`

result: **no matches found**

route.ts does not have unknown flag validation at all. the goal cli is the first to implement strict arg validation (wish item 6: "forbid unknown args"). this is net-new functionality, not duplication.

no extant flag collection utilities in the codebase. each cli parses its own args.

**why it holds**:
1. route.ts doesn't have this feature - goal is pioneer
2. flag validation is specific to each command's allowed flags
3. a shared utility would need to be parameterized by KNOWN_FLAGS anyway
4. the logic is trivial (loop + check in array) - not worth extraction

---

## conclusion

**no duplication of extant mechanisms found.**

new mechanisms follow extant patterns:
- GoalBlocker follows DriveBlocker pattern (intentional, per wish)
- cli validation follows extant cli self-contained output pattern
- escalation is domain-scoped (route vs goals), not shared

the implementation reuses patterns (good) without code duplication (also good).

