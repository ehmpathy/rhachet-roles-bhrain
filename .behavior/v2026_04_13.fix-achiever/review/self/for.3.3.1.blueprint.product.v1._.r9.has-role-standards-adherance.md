# self-review r9: has-role-standards-adherance

## what i found

i reviewed the blueprint against each relevant mechanic brief category with specific rule citations.

---

## rule directories enumerated

1. `code.prod/evolvable.domain.objects/`
   - rule.forbid.nullable-without-reason
   - rule.forbid.undefined-attributes
   - rule.require.immutable-refs

2. `code.prod/evolvable.domain.operations/`
   - rule.require.get-set-gen-verbs

3. `code.prod/evolvable.procedures/`
   - rule.require.input-context-pattern
   - rule.forbid.io-as-domain-objects
   - rule.require.named-args

4. `code.prod/pitofsuccess.errors/`
   - rule.require.failfast
   - rule.require.failloud

5. `code.prod/pitofsuccess.procedures/`
   - rule.forbid.nonidempotent-mutations
   - rule.require.idempotent-procedures

6. `code.test/`
   - rule.require.test-coverage-by-grain
   - rule.require.given-when-then

---

## issue 1: reset* verb violates get-set-gen rule

### rule citation

rule.require.get-set-gen-verbs says:
> synonym verb instead of get/set/gen = **BLOCKER**
> domain-specific action verbs are allowed only for imperative commands that don't fit get/set/gen

### what blueprint proposes

```ts
resetGoalBlockerState(input: { scopeDir: string })
```

### analysis

`reset` is not get/set/gen. the question: is it an allowed "domain-specific action verb"?

extant pattern uses `del`:
```ts
delDriveBlockerState  // removes file → count resets via fresh state fallback
```

`reset` blurs del (file removal) and set (state update). they achieve the same outcome only because `getDriveBlockerState` returns fresh state when file absent:
```ts
catch {
  return new DriveBlockerState({ count: 0, stone: null });
}
```

### decision

follow extant pattern: use `del` not `reset`.

**fix needed:** change `resetGoalBlockerState` to `delGoalBlockerState` to match extant convention.

---

## issue 2: goalSlug not nullable (already identified in r8)

### rule citation

rule.forbid.nullable-without-reason says:
> there needs to be a clear domain reason for why an attribute can be null
> if there's no clear reason... ensure the attribute has a clear type declared
> this is a BLOCKER level violation

### analysis

the extant pattern DOES have nullable stone:
```ts
interface DriveBlockerState {
  count: number;
  stone: string | null;  // nullable: fresh state has no stone
}
```

the reason is clear: when count is 0, there's no stone involved. same applies to goals.

**blueprint should have nullable goalSlug with documented reason.**

---

## non-issues (verified compliant)

### rule.require.input-context-pattern

**blueprint shows:**
```ts
getGoalBlockerState(input: { scopeDir: string })
setGoalBlockerState(input: { scopeDir: string; goalSlug: string })
```

**verdict:** ✓ follows (input, context?) pattern.

### rule.require.failfast

**blueprint shows:**
- `validateUnknownFlags()` — fail-fast on unknown flags
- `validateStatusValue()` — fail-fast on invalid status
- `validateScopeWhenBound()` — fail-fast if --scope repo while bound

**verdict:** ✓ follows failfast pattern.

### rule.require.failloud

**blueprint error format:**
```
🦉 bummer, friend

🐚 goal.memory.set
   └─ ✋ unknown flag: --foo

allowed flags:
   --slug         goal identifier
```

**verdict:** ✓ errors include context and allowed options.

### rule.forbid.nonidempotent-mutations

**blueprint operations:**
- `setGoalBlockerState` — upsert semantics (set count, write file)
- `delGoalBlockerState` — delete semantics (remove file)

**verdict:** ✓ both are idempotent. set always writes. del removes if present.

### rule.require.test-coverage-by-grain

**blueprint proposes:**

| grain | tests | standard |
|-------|-------|----------|
| domain literal | none (data shape only) | acceptable |
| operations | integration tests | ✓ correct grain |
| cli contract | acceptance tests | ✓ correct grain |
| cli validation | unit tests | ✓ transformers |

**verdict:** ✓ follows test coverage by grain.

---

## summary of fixes needed

| issue | rule violated | fix |
|-------|---------------|-----|
| 1. reset* verb | rule.require.get-set-gen-verbs | change to `delGoalBlockerState` |
| 2. goalSlug not nullable | rule.forbid.nullable-without-reason | add nullable with documented reason |
| (from r8) scopeDir input | extant pattern adherance | operations take scopeDir input |

---

## conclusion

2 new issues found from role standards check:
1. `reset*` should be `del*` per get-set-gen rule
2. `goalSlug` must be `string | null` with documented reason

combined with r8 findings (scopeDir input), blueprint needs 3 fixes total.

