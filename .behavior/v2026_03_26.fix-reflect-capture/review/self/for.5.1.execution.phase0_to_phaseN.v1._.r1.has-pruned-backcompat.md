# self-review r1: has-pruned-backcompat

## backwards compatibility elements in the implementation

### 1. portable hash command

```typescript
(sha256sum 2>/dev/null || shasum -a 256) | cut -d' ' -f1
```

**question**: was this explicitly requested?

**answer**: yes. blueprint § implementation detail states:
> compute hash from files via shell (portable: linux sha256sum, macos shasum)

**why it holds**: this is not assumed "to be safe" — it was explicitly designed in the blueprint. linux and macos are the target platforms per self-review r10 analysis.

---

### 2. interface unchanged

```typescript
export interface Savepoint { ... }  // no changes
export const setSavepoint = (input: { ... }): Savepoint => { ... }  // signature unchanged
```

**question**: was this explicitly requested?

**answer**: yes. blueprint § contracts states:
> ### setSavepoint signature (unchanged)
> ### Savepoint interface (unchanged)

**why it holds**: the vision explicitly stated this is a fix, not a feature. unchanged interface means callers don't need to change.

---

### 3. extant test coverage

all 23 extant tests pass without modification.

**question**: was this explicitly required?

**answer**: yes. criteria § usecase.2 states:
> given('small staged diff (<1MB)')
>   then('behavior is unchanged for typical usecases')

**why it holds**: vision explicitly stated typical usecases should be unchanged.

---

## not found: assumed-but-not-requested backcompat

searched for:
- fallback paths for absent tools
- version checks for git
- alternative implementations for edge cases
- retry logic for transient failures

**result**: none found. implementation is minimal.

---

## conclusion

all backwards compatibility in the implementation was explicitly requested:
1. portable hash (blueprint)
2. unchanged interface (blueprint)
3. unchanged behavior for small diffs (criteria)

no "to be safe" assumptions found.

r1 complete.
