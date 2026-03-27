# self-review r10: has-play-test-convention

## step back and breathe

question: are journey test files named correctly?

I will trace through the actual test files and verify the convention.

---

## search results

### .play.test.ts files

```bash
glob: **/*.play.test.ts
result: No files found
```

this repo does not use `.play.test.ts` convention.

### .journey.*.test.ts files

```bash
glob: **/*.journey*.test.ts
result:
  - blackbox/driver.route.journey.acceptance.test.ts
  - blackbox/reflect.journey.acceptance.test.ts
```

---

## trace reflect.journey.acceptance.test.ts

I read `blackbox/reflect.journey.acceptance.test.ts` lines 1-100:

### file structure

```typescript
// line 4 — imports from test-fns
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

// line 30 — describe block
describe('reflect.journey.acceptance', () => {

// line 31 — single journey block
given('[journey] full reflect workflow', () => {

// lines 68-100+ — sequential journey steps
when('[t0] before any changes', () => { ... });
when('[t1] first savepoint is created', () => { ... });
// ... continues through t8
```

### jsdoc comment (lines 15-29)

```typescript
/**
 * .what = journey acceptance test for full reflect workflow
 * .why = exercises complete experience preservation workflow
 *
 * journey:
 *   [t0] before any changes
 *   [t1] create first savepoint
 *   [t2] create second savepoint (verify accumulation)
 *   [t3] list savepoints (verify count)
 *   [t4] annotate (label a defect)
 *   [t5] annotate again (label the fix)
 *   [t6] snapshot get (verify annotations count)
 *   [t7] snapshot capture (the fundamental purpose)
 *   [t8] snapshot get (verify captured snapshot)
 */
```

this explicitly labels it as a journey test.

---

## convention analysis

| aspect | .play.test.ts | this repo |
|--------|---------------|-----------|
| suffix | `.play.test.ts` | `.journey.acceptance.test.ts` |
| location | varies | `blackbox/` |
| structure | given/when/then | given/when/then |
| sequential | yes | yes (t0→t8) |
| full workflow | yes | yes |

the fallback convention is valid:
- file contains `[journey]` label
- sequential `[tN]` steps
- exercises full workflow
- located in `blackbox/` (acceptance)

---

## does this behavior need new journey tests?

from `setSavepoint.ts` analysis:

1. **internal fix** — shell redirect instead of node buffer
2. **same contract** — same Savepoint interface, same CLI output
3. **no new usecases** — vision says "large diffs just work"

the extant journey test `reflect.journey.acceptance.test.ts`:
- creates repo with staged/unstaged changes (line 55-63)
- invokes `reflect.savepoint set --mode apply` (lines 80-88)
- verifies files are written (line 99-100)

this exercises the exact code path that was fixed. if the fix broke the behavior, this journey would fail.

---

## why no new journey test is needed

| reason | evidence |
|--------|----------|
| internal implementation change | shell redirect, no API change |
| extant journey covers the path | t1 creates savepoint with staged changes |
| extant integration tests verify mechanism | `setSavepoint.integration.test.ts` |
| no new user-observable behavior | same command, same output |

a "large diff" journey test would be:
- test infrastructure concern (how to generate large diff)
- integration test scope (verifies mechanism, not workflow)
- not a journey (single step, not sequential workflow)

---

## checklist

| check | status | evidence |
|-------|--------|----------|
| .play.test.ts used | no | 0 files found |
| fallback convention used | yes | `.journey.acceptance.test.ts` |
| fallback is consistent | yes | both journey files use same suffix |
| journey structure present | yes | [journey] label, sequential [tN] |
| new journey needed | no | internal fix, extant coverage |

---

## why it holds

1. **repo convention is established** — `.journey.acceptance.test.ts` in `blackbox/`
2. **convention is semantic** — file contains `[journey]` label and sequential steps
3. **coverage is sufficient** — t1 exercises savepoint creation with staged changes
4. **no new workflow** — fix doesn't add user-observable behavior

the guide asks "is the fallback convention used?" — yes:
- suffix: `.journey.acceptance.test.ts`
- location: `blackbox/`
- structure: `given('[journey]', () => { ... })`
- steps: sequential `[t0]` through `[t8]`

---

## summary

| check | status |
|-------|--------|
| convention identified | `.journey.acceptance.test.ts` |
| files follow convention | yes (2/2) |
| new journey needed | no |
| extant journey covers behavior | yes (t1) |

**conclusion:** this repo uses `.journey.acceptance.test.ts` as its fallback convention. the convention is consistent and semantic. no new journey test is needed — the fix is internal and covered by extant tests.

r10 complete.

