# self-review: has-play-test-convention (r9)

## the question

are journey test files named correctly?

---

## search results

### `.play.*.ts` files

```
glob: **/*.play.*.ts
result: no files found
```

### achiever test files created in this behavior

```
blackbox/achiever.goal.guard.acceptance.test.ts
blackbox/achiever.goal.lifecycle.acceptance.test.ts
blackbox/achiever.goal.triage.acceptance.test.ts
blackbox/achiever.goal.triage.next.acceptance.test.ts
src/contract/cli/goal.test.ts
src/domain.operations/goal/getGoalGuardVerdict.test.ts
src/domain.operations/goal/getTriageState.integration.test.ts
```

---

## convention in this repo

the guide specifies `.play.test.ts` for journey tests, but allows fallback:
> if not supported, is the fallback convention used?

### extant journey tests in this repo

```
blackbox/driver.route.journey.acceptance.test.ts
blackbox/reflect.journey.acceptance.test.ts
```

both use `.acceptance.test.ts` suffix with "journey" in the name — not `.play.test.ts`.

### convention pattern

| test type | suffix in this repo |
|-----------|-------------------|
| unit test | `.test.ts` |
| integration test | `.integration.test.ts` |
| acceptance/journey test | `.acceptance.test.ts` |

this repo uses `.acceptance.test.ts` as the fallback convention for journey tests.

---

## achiever tests follow convention

### new acceptance tests

| file | convention | verdict |
|------|------------|---------|
| `achiever.goal.guard.acceptance.test.ts` | `.acceptance.test.ts` | follows repo convention |
| `achiever.goal.lifecycle.acceptance.test.ts` | `.acceptance.test.ts` | follows repo convention |
| `achiever.goal.triage.acceptance.test.ts` | `.acceptance.test.ts` | follows repo convention |
| `achiever.goal.triage.next.acceptance.test.ts` | `.acceptance.test.ts` | follows repo convention |

### new unit tests

| file | convention | verdict |
|------|------------|---------|
| `goal.test.ts` | `.test.ts` | follows repo convention |
| `getGoalGuardVerdict.test.ts` | `.test.ts` | follows repo convention |

### new integration tests

| file | convention | verdict |
|------|------------|---------|
| `getTriageState.integration.test.ts` | `.integration.test.ts` | follows repo convention |

---

## why it holds

1. **no `.play.test.ts` in this repo** — repo uses `.acceptance.test.ts` as fallback convention
2. **all new tests follow repo convention** — acceptance, integration, and unit tests correctly suffixed
3. **consistent with extant tests** — `driver.route.journey.acceptance.test.ts` uses same pattern
4. **tests are in correct locations** — `blackbox/` for acceptance, `src/` for unit/integration

the `.play.test.ts` convention is not used in this repo. the fallback `.acceptance.test.ts` convention is used instead, and all new achiever tests follow this convention.

