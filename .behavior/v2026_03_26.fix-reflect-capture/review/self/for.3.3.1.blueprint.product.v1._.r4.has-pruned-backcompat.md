# self-review r4: has-pruned-backcompat

## step back and breathe

r1-r3 found no backcompat to remove. one more pass with fresh eyes.

---

## final verification: each kept backcompat

### plan mode maxBuffer (50MB)

**why kept**: tests verify plan mode writes no files. plan mode = preview = no side effects.

**alternative**: use shell redirect for plan mode too, delete files after.

**why not alternative**:
- adds complexity (delete after)
- error path leaves orphan files
- tests would need update
- scope creep (change plan mode behavior)

**verdict**: keep. not backcompat, it is correct behavior.

### API signature unchanged

**why kept**: `setSavepoint({ scope, mode })` is sufficient.

**alternative**: change signature.

**why not alternative**:
- no benefit
- consumers must update
- scope creep

**verdict**: keep. good practice, not conservative assumption.

### Savepoint interface unchanged

**why kept**: same output shape, different implementation.

**alternative**: change interface.

**why not alternative**:
- no benefit
- consumers must update
- scope creep

**verdict**: keep. good practice, not conservative assumption.

---

## question: am I biased toward no change?

let me invert: what would I change if I could?

**if I could change freely**:
1. plan mode behavior? no — preview should not have side effects
2. API signature? no — it is clean and sufficient
3. Savepoint interface? no — it captures the right data

I would not change these even with freedom. they are correct as-is.

---

## conclusion

| backcompat item | verdict | reason |
|-----------------|---------|--------|
| plan mode maxBuffer | keep | correct semantics (preview = no side effects) |
| API signature | keep | sufficient, no reason to change |
| Savepoint interface | keep | sufficient, no reason to change |

no backcompat to remove. blueprint is ready.
