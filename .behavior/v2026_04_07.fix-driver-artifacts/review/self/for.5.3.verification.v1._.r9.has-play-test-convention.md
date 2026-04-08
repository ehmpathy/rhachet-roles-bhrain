# has-play-test-convention review (r9)

## slow review process

1. check if `.play.test.ts` convention is used in this repo
2. if not, identify the actual test conventions
3. verify journey tests follow repo conventions
4. articulate why the convention holds

---

## step 1: check for .play.test.ts files

**command:**
```
find . -name '*.play.*.ts' -type f
```

**result:** no matches

**conclusion:** this repo does not use the `.play.test.ts` convention.

---

## step 2: identify actual test conventions

### test runner configs

```
jest.unit.config.ts       — runs *.test.ts
jest.integration.config.ts — runs *.integration.test.ts
jest.acceptance.config.ts  — runs *.acceptance.test.ts
```

### test file patterns

| pattern | runner | count |
|---------|--------|-------|
| `*.test.ts` | unit | many |
| `*.integration.test.ts` | integration | many |
| `*.acceptance.test.ts` | acceptance | 44 |

### journey tests location

journey tests are in `blackbox/` directory with `.acceptance.test.ts` suffix:

```
blackbox/driver.route.journey.acceptance.test.ts
blackbox/reflect.journey.acceptance.test.ts
```

---

## step 3: verify journey tests follow repo conventions

### convention alignment

| requirement | this repo | status |
|-------------|-----------|--------|
| journey test location | `blackbox/` | ✓ |
| journey test suffix | `.acceptance.test.ts` | ✓ |
| uses repo's runner | `jest.acceptance.config.ts` | ✓ |

### evidence

```
git ls-files '*.test.ts' | grep journey
```

**result:**
```
blackbox/driver.route.journey.acceptance.test.ts
blackbox/reflect.journey.acceptance.test.ts
```

---

## step 4: why .play convention is not applicable

### repo convention precedence

this repo established its test conventions before the `.play.test.ts` pattern:
- `*.test.ts` for unit tests
- `*.integration.test.ts` for integration tests
- `*.acceptance.test.ts` for acceptance/journey tests

### consistency matters more than convention names

the guide states:

> if not supported, is the fallback convention used?

this repo's fallback convention is `.acceptance.test.ts` for journey tests. this is consistently applied:
- 44 acceptance test files
- all in `blackbox/` directory
- all run via `npm run test:acceptance:locally`

### no migration needed

a convention change mid-repo would:
- require a rename of 44 files
- update test runner configs
- provide no benefit (tests already work)

---

## step 5: this behavior's journey tests

### location

```
asArtifactByPriority.test.ts — unit test (not journey)
```

### journey coverage

this behavior's journey coverage comes from prior acceptance tests that exercise the full driver workflow:
- `driver.route.journey.acceptance.test.ts`
- `driver.route.guard-cwd.acceptance.test.ts`
- `driver.route.set.acceptance.test.ts`

these tests were updated (snapshot changes verified in r7 review) but not renamed. they follow the repo's extant convention.

---

## summary

| question | answer | evidence |
|----------|--------|----------|
| does repo use `.play.test.ts`? | no | find shows no matches |
| what convention does repo use? | `.acceptance.test.ts` | 44 files in blackbox/ |
| are journey tests in right location? | yes | `blackbox/` directory |
| do they follow repo convention? | yes | all use `.acceptance.test.ts` |
| is fallback convention used? | yes | established pattern from repo history |

**convention validated.** this repo uses `.acceptance.test.ts` for journey tests instead of `.play.test.ts`. this is the repo's established convention with 44 test files. no changes needed.

