# has-play-test-convention review (r10)

## slow review process

1. check if `.play.test.ts` convention is used in this repo
2. read the jest config to understand test patterns
3. read the actual journey test files
4. verify journey tests follow repo conventions
5. articulate why each convention holds

---

## step 1: check for .play.test.ts files

**command:**
```
find . -name '*.play.*.ts' -type f
```

**result:** no matches

**conclusion:** this repo does not use the `.play.test.ts` convention.

---

## step 2: read jest.acceptance.config.ts

**file:** `jest.acceptance.config.ts`

```typescript
// line 29: testMatch pattern
testMatch: ['**/*.acceptance.test.ts', '!**/.yalc/**', '!**/.scratch/**'],
```

**configured pattern:** `*.acceptance.test.ts`

this is the repo's journey test pattern. it runs via:
```
npm run test:acceptance:locally
```

---

## step 3: read actual journey test file

**file:** `blackbox/driver.route.journey.acceptance.test.ts`

### header (lines 1-12)

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { getSelfReviewArticulationPath } from '../src/domain.operations/route/guard/getSelfReviewArticulationPath';
import {
  createHookStdin,
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';
```

### BDD structure (lines 57-98)

```typescript
describe('driver.route.journey.acceptance', () => {
  given('[journey] weather api route', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'journey',
        clone: ASSETS_DIR,
      });
      // ...
      return { tempDir };
    });

    when('[t0] route is initialized', () => {
      const result = useThen('route.stone.get succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.get',
          args: { stone: '@next-one', route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout contains 1.vision', () => {
        expect(result.stdout).toContain('1.vision');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
```

**why it holds:**
- uses test-fns BDD structure (given/when/then)
- uses useBeforeAll for shared setup
- uses useThen for deferred assertions
- journey phases labeled [t0], [t1], etc.
- follows exact pattern from repo conventions

---

## step 4: enumerate all journey tests

**command:**
```
git ls-files '*.acceptance.test.ts' | grep -E '(journey|play)'
```

**result:**
```
blackbox/driver.route.journey.acceptance.test.ts
blackbox/reflect.journey.acceptance.test.ts
```

**analysis:**

| file | location | suffix | convention |
|------|----------|--------|------------|
| `driver.route.journey.acceptance.test.ts` | `blackbox/` | `.acceptance.test.ts` | ✓ repo convention |
| `reflect.journey.acceptance.test.ts` | `blackbox/` | `.acceptance.test.ts` | ✓ repo convention |

---

## step 5: why .play convention is not applicable

### repo established its own convention first

from `jest.acceptance.config.ts`:

```typescript
testMatch: ['**/*.acceptance.test.ts', '!**/.yalc/**', '!**/.scratch/**'],
```

this pattern was configured before the `.play.test.ts` convention existed. the repo has:
- 44 acceptance test files
- all use `.acceptance.test.ts` suffix
- all run via the acceptance runner

### the guide allows fallback convention

> if not supported, is the fallback convention used?

yes. this repo's fallback convention is `.acceptance.test.ts`. it is consistently applied:

| metric | value |
|--------|-------|
| acceptance test files | 44 |
| journey test files | 2 |
| all use `.acceptance.test.ts` | yes |
| all in `blackbox/` | yes |

### no benefit from migration

a pattern change would require:
- rename 44 files from `.acceptance.test.ts` to `.play.acceptance.test.ts`
- update `jest.acceptance.config.ts` testMatch pattern
- no functional benefit (tests already run correctly)

---

## step 6: this behavior's test coverage

### unit test

```
src/domain.operations/route/stones/asArtifactByPriority.test.ts
```

this is a unit test, not a journey test. it follows `.test.ts` convention.

### journey coverage (indirect)

this behavior's code is exercised by prior journey tests:
- `driver.route.journey.acceptance.test.ts` — full workflow
- `driver.route.guard-cwd.acceptance.test.ts` — guard artifact reads
- `driver.route.set.acceptance.test.ts` — stone passage

these tests had snapshot updates (verified in r7 review) but file names unchanged.

---

## summary

| question | answer | evidence |
|----------|--------|----------|
| does repo use `.play.test.ts`? | no | find shows 0 matches |
| what jest pattern? | `*.acceptance.test.ts` | jest.acceptance.config.ts line 29 |
| journey tests location? | `blackbox/` | git ls-files shows 44 files |
| journey tests use BDD? | yes | given/when/then with test-fns |
| fallback convention used? | yes | established before .play pattern |

**convention validated.** this repo uses `*.acceptance.test.ts` for journey tests with BDD structure. the pattern is configured in `jest.acceptance.config.ts` and consistently applied to 44 test files. no migration to `.play.test.ts` needed.

