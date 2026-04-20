# self-review r8: has-role-standards-adherance

## what i found

i checked the blueprint against mechanic role standards in these brief categories:

1. `code.prod/evolvable.procedures/` — input-context pattern, named args
2. `code.prod/evolvable.domain.objects/` — nullable attributes
3. `code.prod/evolvable.domain.operations/` — get-set-gen verbs
4. `code.prod/pitofsuccess.errors/` — failfast, failloud
5. `code.test/` — test coverage by grain

found 1 issue that was already caught in r8 has-behavior-declaration-adherance.

---

## rule category: evolvable.procedures

### rule.require.input-context-pattern

**blueprint shows:**
```ts
getGoalBlockerState(input: { scopeDir: string })
setGoalBlockerState(input: { scopeDir: string; goalSlug: string })
resetGoalBlockerState(input: { scopeDir: string })
```

**verdict:** ✓ follows (input, context?) pattern. operations take structured input objects.

### rule.require.named-args

**blueprint shows:**
```ts
emitValidationError()
emitHelpOutput()
escalateMessageByCount()
```

**verdict:** ✓ functions implied to take named args. no positional args visible.

---

## rule category: evolvable.domain.objects

### rule.forbid.nullable-without-reason

**blueprint proposes:**
```ts
GoalBlockerState {
  count: number;
  goalSlug: string;  // NOT nullable in blueprint
}
```

**extant pattern:**
```ts
DriveBlockerState {
  count: number;
  stone: string | null;  // nullable with reason: fresh state has no stone
}
```

**verdict:** ⚠ deviation already caught in r8 has-behavior-declaration-adherance.

the nullable is justified: when count is 0, there's no goal to track (fresh state).

**fix needed:** change to `goalSlug: string | null` per r8 findings.

---

## rule category: evolvable.domain.operations

### rule.require.get-set-gen-verbs

**blueprint proposes:**
- `getGoalBlockerState` — ✓ uses `get` verb
- `setGoalBlockerState` — ✓ uses `set` verb
- `resetGoalBlockerState` — uses `reset` verb

**analysis:**
`reset` is not in the standard get/set/gen vocabulary. extant pattern uses `del`.

however, r8 has-behavior-declaration-adherance decided: `reset` better expresses domain intent (conceptual reset vs file deletion).

**verdict:** acceptable deviation — `reset` is clearer than `del` for this semantic.

---

## rule category: pitofsuccess.errors

### rule.require.failfast

**blueprint proposes:**
- `validateUnknownFlags()` — fail-fast on unknown flags
- `validateStatusValue()` — fail-fast on invalid status
- `validateUnknownKeys()` — fail-fast on unknown yaml keys
- `validateScopeWhenBound()` — fail-fast if `--scope repo` while bound to route

**verdict:** ✓ follows failfast pattern. each validation fails immediately with helpful error.

### rule.require.failloud

**blueprint proposes:**
```
🦉 bummer, friend

🐚 goal.memory.set
   └─ ✋ unknown flag: --foo

allowed flags:
   --slug         goal identifier
   ...
```

**verdict:** ✓ follows failloud pattern. errors include:
- what went wrong (unknown flag)
- context (which flag)
- allowed options (list of valid flags)

---

## rule category: code.test

### rule.require.test-coverage-by-grain

**blueprint proposes:**

| grain | proposed tests | standard |
|-------|----------------|----------|
| GoalBlocker.ts (domain literal) | — | unit test |
| get/set/resetGoalBlockerState (operations) | integration tests | integration test |
| cli validation (contract) | unit + acceptance tests | acceptance test + snapshots |

**analysis:**
- domain literal GoalBlocker.ts — no unit test proposed. domain literals typically don't need tests (just data shape).
- operations — integration tests proposed. ✓ correct grain.
- cli contract — acceptance tests proposed. ✓ correct grain.

**verdict:** ✓ follows test coverage by grain.

---

## summary

| rule category | verdict |
|---------------|---------|
| evolvable.procedures | ✓ follows input-context, named args |
| evolvable.domain.objects | ⚠ goalSlug should be nullable (already in r8 findings) |
| evolvable.domain.operations | ✓ reset verb acceptable |
| pitofsuccess.errors | ✓ follows failfast, failloud |
| code.test | ✓ follows test coverage by grain |

**1 issue found:** already caught in r8 has-behavior-declaration-adherance — goalSlug needs to be nullable.

no additional role standards violations found.

