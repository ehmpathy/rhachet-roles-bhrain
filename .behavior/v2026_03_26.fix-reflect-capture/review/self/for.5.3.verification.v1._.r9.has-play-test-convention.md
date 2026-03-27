# self-review r9: has-play-test-convention

## step back and breathe

question: are journey test files named correctly?

I will check what journey tests exist and what convention this repo uses.

---

## what the guide asks

> journey tests should use `.play.test.ts` suffix:
> - `feature.play.test.ts` — journey test
> - `feature.play.integration.test.ts` — if repo requires integration runner
> - `feature.play.acceptance.test.ts` — if repo requires acceptance runner
>
> if not supported, is the fallback convention used?

---

## search for .play.test.ts files

```
glob: **/*.play.test.ts
result: No files found
```

this repo does not use the `.play.test.ts` convention.

---

## search for journey tests

```
glob: **/*.journey*.test.ts
result:
  - blackbox/driver.route.journey.acceptance.test.ts
  - blackbox/reflect.journey.acceptance.test.ts
```

this repo uses `.journey.acceptance.test.ts` as the convention for journey tests.

---

## this behavior's test coverage

the fix-reflect-capture behavior:
- modifies `setSavepoint.ts` internal implementation
- does not change external contracts
- does not add new usecases

test coverage:

| test file | type | what it covers |
|-----------|------|----------------|
| `setSavepoint.integration.test.ts` | integration | plan mode, apply mode |
| `reflect.savepoint.acceptance.test.ts` | acceptance | CLI plan, apply, get |
| `reflect.journey.acceptance.test.ts` | journey | full reflect workflow |

---

## does this behavior need new journey tests?

**no.** here's why:

1. **internal fix** — the change is shell redirect instead of node buffer. the external behavior is unchanged.

2. **no new usecases** — the vision says "the contract doesn't change." same command, same output.

3. **extant coverage** — `reflect.journey.acceptance.test.ts` already exercises the full workflow:
   - creates repo
   - stages changes
   - captures snapshot
   - validates output

4. **if large diff test needed** — it would be an integration test for `setSavepoint`, not a journey test. the journey tests verify end-to-end flow, not edge cases.

---

## convention check

| check | status |
|-------|--------|
| .play.test.ts used | no |
| fallback convention used | yes (`.journey.acceptance.test.ts`) |
| convention consistent across repo | yes |
| new journey test needed | no (internal fix) |

---

## why it holds

1. **repo convention is `.journey.acceptance.test.ts`** — not `.play.test.ts`
2. **convention is consistent** — all journey tests use this suffix
3. **no new journey test needed** — this is an internal implementation fix
4. **extant tests cover the behavior** — `setSavepoint.integration.test.ts` verifies the mechanism

---

## summary

| check | status | evidence |
|-------|--------|----------|
| convention identified | `.journey.acceptance.test.ts` | 2 files in blackbox/ |
| convention consistent | yes | no mixed conventions |
| new journey needed | no | internal fix, no new usecases |
| extant coverage sufficient | yes | integration + acceptance tests |

**conclusion:** this repo uses `.journey.acceptance.test.ts` as its journey test convention. no new journey tests are needed for this behavior — it's an internal implementation fix covered by extant tests.

r9 complete.

