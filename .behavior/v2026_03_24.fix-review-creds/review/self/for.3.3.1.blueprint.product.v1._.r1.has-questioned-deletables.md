# self-review: has-questioned-deletables

## stone: 3.3.1.blueprint.product.v1

---

## components reviewed

### 1. keyrack.yml

**question**: can this be removed?

**verdict**: no, keep.

**why**: this is core to the wish — declaring `XAI_API_KEY` requirement so users know what creds are needed before runtime errors. without it, users discover requirements only when review fails.

---

### 2. getXaiCredsFromKeyrack.ts

**question**: can this be inlined into review.ts?

**verdict**: no, keep as separate file.

**why**:
- reflect.ts also needs it (wish mentions consistency)
- separation of concerns: keyrack logic vs cli orchestration
- easier to test in isolation
- single responsibility: one file does one thing

---

### 3. review.ts changes

**question**: can this be removed?

**verdict**: no, keep.

**why**: this is where keyrack integration happens. core requirement from wish.

---

### 4. reflect.ts changes

**question**: can this be removed?

**verdict**: no, keep.

**why**: wish mentions "reflect.ts for consistency". both cli commands should behave the same for xai brains.

---

### 5. test files

**question**: can any test files be removed?

| test file | verdict | why |
|-----------|---------|-----|
| `getXaiCredsFromKeyrack.test.ts` | keep | proves grant status branches work |
| `getXaiCredsFromKeyrack.integration.test.ts` | keep | proves real keyrack fetch works |
| `review.keyrack-locked.acceptance.test.ts` | keep | proves locked fail-fast |
| `review.keyrack-absent.acceptance.test.ts` | keep | proves absent fail-fast |
| `review.brain-non-xai.acceptance.test.ts` | keep | proves non-xai unaffected |

all tests serve distinct purposes. removing any leaves behavior unproven.

---

### 6. error messages

**question**: can error messages be simplified?

**verdict**: no changes needed.

**why**:
- "🦉 patience, friend" matches extant owl vibe in stepReview
- treestruct format matches extant error patterns
- each status has distinct message — needed for user clarity
- copy-pasteable commands are essential for UX

---

### 7. phases

**question**: can phases be merged?

**verdict**: keep as 3 phases.

**why**:
- phase 0 (infrastructure) is foundational
- phase 1 (cli) depends on phase 0
- phase 2 (tests) is naturally separate
- clearer for implementation tracking

---

### 8. supporting sections

**question**: can dependencies, backwards compatibility, risks be removed?

**verdict**: keep all.

**why**:
- dependencies: explicit about what packages needed
- backwards compatibility: documents non-xai brains unchanged
- risks: documents known concerns and mitigations

---

## simplifications made

none found. blueprint is minimal for the scope.

## conclusion

all components are necessary. no deletables found.

the simplest version that works is already proposed.

