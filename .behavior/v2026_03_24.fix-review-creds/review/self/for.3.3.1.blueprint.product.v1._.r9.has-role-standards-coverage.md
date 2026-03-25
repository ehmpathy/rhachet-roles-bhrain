# self-review: has-role-standards-coverage (r9)

## stone: 3.3.1.blueprint.product.v1

---

## r9: mechanic standards coverage check

took a breath. re-read the blueprint. asked: what patterns SHOULD be present?

---

## rule directories enumerated

| directory | check for coverage |
|-----------|-------------------|
| `code.prod/pitofsuccess.errors` | error handlers present? |
| `code.prod/pitofsuccess.typedefs` | types complete? |
| `code.prod/readable.comments` | jsdoc present? |
| `code.test/frames.behavior` | tests planned? |
| `code.test/scope.acceptance` | acceptance tests? |
| `code.test/scope.unit` | unit tests? |

---

## coverage check 1: error handlers

### what should be present?

every error condition should have:
1. explicit handler
2. actionable message
3. appropriate exit code

### what the blueprint has

**granted status:**
```typescript
if (grant.status === 'granted') {
  return { supplier: { ... } };
}
```
✅ returns successfully.

**locked status:**
```typescript
if (grant.status === 'locked') {
  console.error('...');
  console.error('   └─ run: rhx keyrack unlock --owner ehmpath --prikey ~/.ssh/ehmpath --env all');
  process.exit(2);
}
```
✅ actionable message with copy-pasteable command.

**absent status:**
```typescript
if (grant.status === 'absent') {
  console.error('...');
  console.error('   └─ run: rhx keyrack set --owner ehmpath --key XAI_API_KEY');
  process.exit(2);
}
```
✅ actionable message with copy-pasteable command.

**blocked status:**
```typescript
if (grant.status === 'blocked') {
  console.error('...');
  console.error('   └─ hint: check keyrack permissions');
  process.exit(2);
}
```
✅ actionable hint.

**exhaustiveness check:**
```typescript
const _exhaustive: never = grant;
throw new Error(`unexpected grant status: ${JSON.stringify(_exhaustive)}`);
```
✅ catches unknown statuses at compile time.

**verdict:** ✅ all error conditions are covered.

---

## coverage check 2: types

### what should be present?

1. return type explicitly declared
2. no `any` types
3. imports typed correctly

### what the blueprint has

**return type:**
```typescript
export const getXaiCredsFromKeyrack = async (): Promise<{
  supplier: { 'brain.supplier.xai': BrainSuppliesXai };
}> => {
```
✅ explicit Promise type with supplier shape.

**grant type:**
```typescript
const grant = await getKeyrackKeyGrant({
  owner: 'ehmpath',
  key: 'XAI_API_KEY',
});
```
`grant` is typed via `getKeyrackKeyGrant` return type (KeyrackGrantAttempt).

✅ no `any` types.

**BrainSuppliesXai import:**

blueprint depends on:
```
| `rhachet-brains-xai` | `BrainSuppliesXai` type |
```
✅ typed import.

**verdict:** ✅ all types are complete.

---

## coverage check 3: jsdoc

### what should be present?

1. `.what` = describes what the function does
2. `.why` = explains motivation

### what the blueprint has

```typescript
/**
 * .what = fetch xai credentials from keyrack with fail-fast semantics
 * .why = xai is the default brain; credentials should come from keyrack, not envvars
 */
```

✅ both `.what` and `.why` present.

---

## coverage check 4: test coverage matrix

### what should be present?

1. unit tests for branches
2. integration tests for real keyrack
3. acceptance tests for user scenarios

### what the blueprint has

| test type | file | covers |
|-----------|------|--------|
| unit | `getXaiCredsFromKeyrack.test.ts` | grant status branches, error messages |
| integration | `getXaiCredsFromKeyrack.integration.test.ts` | real keyrack fetch with valid key |
| acceptance | `review.keyrack-locked.acceptance.test.ts` | locked keyrack fail-fast |
| acceptance | `review.keyrack-absent.acceptance.test.ts` | absent key fail-fast |
| acceptance | `review.brain-non-xai.acceptance.test.ts` | non-xai brain skips keyrack |

**analysis:**

1. **unit tests:** cover the 4 grant statuses (granted, locked, absent, blocked) and the exhaustiveness check. ✅
2. **integration tests:** verify real keyrack fetch works. ✅
3. **acceptance tests:** cover the 3 user-visible scenarios from criteria:
   - usecase.2: locked keyrack → covered ✅
   - usecase.3: absent key → covered ✅
   - usecase.4: non-xai brain → covered ✅

**question:** is usecase.1 (happy path) covered?

the happy path is implicit in integration test "real keyrack fetch with valid key". should there be explicit acceptance test?

**assessment:** the integration test covers the happy path. acceptance tests focus on failure modes which are more user-visible. this is appropriate coverage.

**verdict:** ✅ test coverage is complete.

---

## coverage check 5: error message format

### what should be present?

1. owl vibe opener (`🦉 patience, friend`)
2. tree-struct format for details
3. copy-pasteable commands

### what the blueprint has

**locked message:**
```
🦉 patience, friend

✋ keyrack is locked
   ├─ owner: ehmpath
   └─ run: rhx keyrack unlock --owner ehmpath --prikey ~/.ssh/ehmpath --env all
```

**absent message:**
```
🦉 patience, friend

✋ XAI_API_KEY not found in keyrack
   ├─ owner: ehmpath
   └─ run: rhx keyrack set --owner ehmpath --key XAI_API_KEY
```

**blocked message:**
```
🦉 patience, friend

✋ keyrack access blocked
   ├─ owner: ehmpath
   └─ hint: check keyrack permissions
```

**analysis:**
1. owl vibe opener ✅
2. tree-struct with `├─` and `└─` ✅
3. copy-pasteable `rhx` commands ✅

**verdict:** ✅ error message format is complete.

---

## coverage check 6: backwards compatibility

### what should be present?

documentation of what doesn't change.

### what the blueprint has

```
## backwards compatibility

- non-xai brains: unchanged (envvars via `genContextBrain`)
- xai brain with envvar: keyrack handles passthrough internally
- xai brain with keyrack: new behavior (fetches from keyrack)
```

✅ three scenarios documented.

---

## coverage check 7: phases

### what should be present?

clear implementation phases with numbered steps.

### what the blueprint has

```
### phase 0: infrastructure
1. create `src/domain.roles/reviewer/keyrack.yml`
2. create `src/domain.operations/credentials/getXaiCredsFromKeyrack.ts`

### phase 1: cli integration
3. update `src/contract/cli/review.ts` to use keyrack for xai brains
4. update `src/contract/cli/reflect.ts` for consistency

### phase 2: tests
5. add unit tests for grant status handler
6. add acceptance tests for keyrack scenarios
```

✅ 3 phases, 6 steps, clearly numbered.

---

## coverage check 8: dependencies

### what should be present?

explicit list of external packages needed.

### what the blueprint has

```
| package | purpose |
|---------|---------|
| `rhachet` | keyrack sdk (`getKeyrackKeyGrant`) |
| `rhachet-brains-xai` | `BrainSuppliesXai` type |
```

✅ dependencies documented with purpose.

---

## coverage check 9: risks

### what should be present?

risks with mitigations.

### what the blueprint has

```
| risk | mitigation |
|------|------------|
| keyrack not installed | fail-fast with clear instructions |
| ehmpath hardcoded | document in keyrack.yml; forkers update org |
| rhachet-brains-xai api change | pin version, test integration |
```

✅ 3 risks with mitigations.

---

## gaps found

none. all required patterns are present:
- error handlers: complete
- types: complete
- jsdoc: complete
- tests: complete
- error format: complete
- backwards compat: documented
- phases: numbered
- dependencies: listed
- risks: mitigated

---

## conclusion

the blueprint has complete coverage of mechanic role standards. no omissions found.
