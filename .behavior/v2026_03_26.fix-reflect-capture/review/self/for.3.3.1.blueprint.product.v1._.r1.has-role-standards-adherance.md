# self-review r1: has-role-standards-adherance

## step back and breathe

review blueprint for mechanic role standards. first enumerate rule directories, then check each.

---

## rule directories to check

| directory | relevant? | why |
|-----------|-----------|-----|
| lang.terms/ | YES | variable names, function names |
| lang.tones/ | NO | blueprint is spec not communication |
| code.prod/evolvable.procedures/ | YES | function patterns |
| code.prod/pitofsuccess.errors/ | YES | error handle |
| code.prod/pitofsuccess.typedefs/ | NO | blueprint uses extant types |
| code.prod/readable.comments/ | YES | comment headers |
| code.prod/readable.narrative/ | YES | code flow |
| code.test/ | NO | blueprint is not test code |

---

## lang.terms check

### rule.forbid.gerunds

**blueprint code**:
```typescript
// ensure directory exists FIRST (before shell redirect)
// write staged diff directly to file via shell
// compute hash from files via shell
// get sizes from filesystem
```

**gerunds found?**: NO. all comments use imperative verbs.

**adherant?**: YES.

### rule.require.order.noun_adj

**blueprint variables**:
- `stagedPatchPath` — noun first
- `unstagedPatchPath` — noun first
- `combinedHash` — noun first
- `stagedBytes` — noun first
- `unstagedBytes` — noun first
- `MAX_BUFFER` — noun (constant)

**adherant?**: YES. all follow [noun][adj] pattern.

### rule.require.treestruct

**function names**:
- `setSavepoint` — [verb][noun] ✓

**adherant?**: YES.

---

## code.prod/evolvable.procedures check

### rule.require.input-context-pattern

**blueprint signature**:
```typescript
export const setSavepoint = (input: {
  scope: ReflectScope;
  mode: 'plan' | 'apply';
}): Savepoint => { ... }
```

**adherant?**: YES. uses (input) pattern.

### rule.forbid.positional-args

**blueprint**:
```typescript
setSavepoint({ scope, mode: 'apply' })
```

**adherant?**: YES. named args in object.

### rule.require.arrow-only

**blueprint**:
```typescript
export const setSavepoint = (input: { ... }): Savepoint => { ... }
```

**adherant?**: YES. arrow function.

---

## code.prod/pitofsuccess.errors check

### rule.require.fail-fast

**blueprint error handle**: shell commands throw on failure. no catch blocks suppress errors.

**adherant?**: YES. fail-fast by default.

### rule.forbid.failhide

**blueprint**: no try-catch blocks that swallow errors.

**adherant?**: YES.

---

## code.prod/readable.comments check

### rule.require.what-why-headers

**blueprint implementation detail section has comments**:
```typescript
// ensure directory exists FIRST (before shell redirect)
// write staged diff directly to file via shell
// compute hash from files via shell (portable: linux sha256sum, macos shasum)
// get sizes from filesystem
```

**adherant?**: YES. each code paragraph has summary comment.

---

## code.prod/readable.narrative check

### rule.forbid.else-branches

**blueprint**:
```typescript
if (mode === 'apply') {
  // apply mode code
}
// plan mode code follows (no else)
```

wait, let me re-check the blueprint structure...

**blueprint structure**:
```
├─ [~] get staged diff
│  ├─ [+] if mode === 'apply': shell redirect
│  └─ [○] if mode === 'plan': execSync with maxBuffer
```

this implies two separate if blocks, not if-else.

**adherant?**: need to verify implementation uses separate ifs not if-else.

---

## potential issue found

### if-else structure

the codepath tree shows:
```
├─ [+] if mode === 'apply': ...
└─ [○] if mode === 'plan': ...
```

this could be implemented as:
1. `if (apply) { ... } else { ... }` — violates rule.forbid.else-branches
2. `if (apply) { ... } if (plan) { ... }` — compliant but redundant
3. early return pattern — compliant

**recommendation**: blueprint should clarify implementation uses early return:
```typescript
if (mode === 'apply') {
  // apply mode
  return savepoint;
}
// plan mode follows
```

**is this a blueprint issue?**: the blueprint shows correct behavior but not the exact code structure. implementation must use early return, not else.

**verdict**: not a blocker — implementation guidance is clear enough.

---

## conclusion

r1 role standards review:
- lang.terms: all compliant
- evolvable.procedures: all compliant
- pitofsuccess.errors: all compliant
- readable.comments: all compliant
- readable.narrative: blueprint implies correct structure, implementation must use early return not else

blueprint adheres to mechanic role standards.
