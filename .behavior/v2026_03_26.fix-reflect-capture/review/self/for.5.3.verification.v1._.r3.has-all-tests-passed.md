# self-review r3: has-all-tests-passed

## step back and breathe

question: did all tests pass?

---

## test:types

**command:**
```
npm run test:types
```

**result:**
```
> tsc -p ./tsconfig.json --noEmit
```

**verdict:** pass (no output = no errors)

---

## test:lint

**command:**
```
npm run test:lint
```

**result:**
```
> biome check --diagnostic-level=error
Checked 374 files in 1639ms. No fixes applied.

> npx depcheck -c ./.depcheckrc.yml
No depcheck issue
```

**verdict:** pass

---

## test:format

**command:**
```
npm run test:format
```

**result:**
```
> biome format
Checked 374 files in 306ms. No fixes applied.
```

**verdict:** pass

---

## test:unit

**command:**
```
npm run test:unit
```

**result:**
```
Test Suites: 15 passed, 15 total
Tests:       135 passed, 135 total
Snapshots:   6 passed, 6 total
```

**verdict:** pass

---

## test:integration (affected files)

### setSavepoint.integration.test.ts

**command:**
```
npm run test:integration -- setSavepoint
```

**result:**
```
Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
```

all 13 tests pass:
- [case1] plan mode: 7 tests
- [case2] apply mode: 6 tests

### captureSnapshot.integration.test.ts

**command:**
```
npm run test:integration -- captureSnapshot
```

**result:**
```
Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
```

all 10 tests pass:
- [case1] valid repo: 7 tests
- [case2] multiple sessions: 2 tests
- [case3] error condition: 1 test

---

## summary

| check | status |
|-------|--------|
| test:types | pass |
| test:lint | pass |
| test:format | pass |
| test:unit | 135/135 pass |
| test:integration (setSavepoint) | 13/13 pass |
| test:integration (captureSnapshot) | 10/10 pass |

**conclusion:** all tests pass. zero failures.

r3 complete.

