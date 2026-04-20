# self-review: has-pruned-backcompat

> review for backwards compatibility that was not explicitly requested

---

## review method

examined each code change for backwards-compat patterns:
- re-export of removed types
- `// removed` comments
- unused `_vars` renamed
- deprecated behavior kept
- old patterns supported "just in case"
- fallback code for "legacy" cases

---

## components reviewed

### domain operations (Phase 1)

| component | backwards-compat pattern? | result |
|-----------|---------------------------|---------|
| GoalBlocker.ts | no | fresh domain literal, no legacy support |
| getGoalBlockerState.ts | no | new operation, reads JSON directly |
| setGoalBlockerState.ts | no | new operation, writes JSON directly |
| delGoalBlockerState.ts | no | new operation, removes JSON directly |
| getGoalGuardVerdict.ts | no | new operation, fresh implementation |

**why it holds**: these are net-new domain operations. there is no prior version of GoalBlockerState to be compatible with. the pattern mirrors DriveBlockerState (the route.drive equivalent), which is the explicit design goal from wish item 4: "like route.drive's blockers.json". no old format to migrate from, no deprecated fields to carry forward.

### cli validation (Phase 2)

| component | backwards-compat pattern? | result |
|-----------|---------------------------|---------|
| KNOWN_FLAGS | no | fresh constant array |
| ALLOWED_YAML_KEYS | no | fresh constant array |
| collectUnknownFlags() | no | new validation, fail-fast |
| validateStatusValue() | no | new validation, fail-fast |
| collectUnknownYamlKeys() | no | new validation, fail-fast |

**why it holds**: wish item 6 explicitly says "forbid unknown args" and "unknown keys -> failfast". the wisher wants strict validation, not lenient acceptance. there was no request to grandfather old flags or accept deprecated key names. the implementation honors the fail-fast directive: unknown input rejected immediately with helpful error output that shows valid options.

### cli help (Phase 3)

| component | backwards-compat pattern? | result |
|-----------|---------------------------|---------|
| emitHelpOutput() | no | fresh output format |
| handleHelp() | no | new handler, no fallback |

**why it holds**: wish item 7 says "--help should make it super duper clear how to use the operation with best practices". this is a net-new feature - there was no prior help output to be compatible with. the implementation creates fresh output format with owl vibes and detailed examples.

### cli escalation (Phase 4)

| component | backwards-compat pattern? | result |
|-----------|---------------------------|---------|
| escalateMessageByCount() | no | new function, no legacy thresholds |
| OWL_WISDOM_ESCALATED | no | new constant |

**why it holds**: wish item 4 specifies "after 5 repeated blocks it makes it clearer and clearer". this is net-new behavior - the prior onStop hook had no escalation. the wisher explicitly specified the threshold (5). no prior escalation cadence to migrate from.

### scope validation (Phase 5)

| component | backwards-compat pattern? | result |
|-----------|---------------------------|---------|
| assertScopeWhenBound() | no | fail-fast, no fallback to old behavior |

**why it holds**: wish item 2 explicitly says "discourage use of --scope repo. scope should be automatic." the vision further clarifies: "if bound to a route, `--scope repo` should fail-fast". the wisher wants strict scope enforcement, not lenient fallback. prior behavior (silently accept --scope repo) was explicitly rejected by the wish.

### role hooks (Phase 6)

| component | backwards-compat pattern? | result |
|-----------|---------------------------|---------|
| hooks.onBrain.onBoot | no | new hook array, no legacy fallback |

**why it holds**: wish item 5 says "we need an onBoot hook". this is net-new functionality. there was no prior onBoot hook to be compatible with. the vision clarifies onBoot is for "post-compaction refresh" which is different from boot.yml's session-start briefs.

### skill headers (Phase 7)

| component | backwards-compat pattern? | result |
|-----------|---------------------------|---------|
| goal.memory.set.sh | no | complete rewrite, no deprecated usage preserved |
| goal.triage.next.sh | no | complete rewrite, added onBoot docs |
| goal.triage.infer.sh | no | complete rewrite |

**why it holds**: wish item 3 says "update the skill headers and help messages to make it clearer how to positively use the goals". the wisher wants improved clarity, not preserved legacy usage patterns. the old headers were vague about stdin yaml vs flags - the new headers explicitly recommend flags one-by-one. this is a deliberate documentation improvement, not a break that needs compat shimming.

### getTriageState behavior change

reviewed the change from `computeGoalCompleteness` to status-based partition:

```typescript
// before: partition by field completeness
const goalsComplete = goals.filter(g => computeGoalCompleteness(g).complete === true);

// after: partition by status
const goalsComplete = goals.filter(g => g.status.choice !== 'incomplete');
```

this is NOT backwards compatibility - it's a deliberate behavior change. the new model is cleaner:
- `incomplete` status = needs triage (fill fields)
- any other status = past triage stage

no code was added to support "both old and new" behavior.

---

## conclusion

**no backwards compatibility patterns found.**

all code changes are forward-focused:
- new operations follow fresh patterns
- validation fails fast without fallback
- behavior changes are clean replacements (not additive)
- no deprecated aliases, no legacy support code

the implementation makes clean breaks rather than old behavior kept "just in case."

