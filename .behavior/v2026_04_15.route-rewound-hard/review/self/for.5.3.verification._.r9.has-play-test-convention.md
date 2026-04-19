# self-review: has-play-test-convention (r9)

## repo convention check

### does this repo use `.play.test.ts`?

```
glob: **/*.play.test.ts
result: no files found
```

no. this repo does not use the `.play.test.ts` convention.

### what convention does this repo use?

```
glob: **/*.acceptance.test.ts
result: 48 files in blackbox/
```

this repo uses `.acceptance.test.ts` for journey/acceptance tests.

### why no `.play.test.ts`?

this repo predates the `.play.` convention. it uses:
- `blackbox/*.acceptance.test.ts` — journey/acceptance tests
- `src/**/*.test.ts` — unit tests
- `src/**/*.integration.test.ts` — integration tests

the yield feature tests follow the repo convention:
- `driver.route.set.yield.acceptance.test.ts` — in `blackbox/`

### is the fallback convention used correctly?

| check | status |
|-------|--------|
| tests in `blackbox/` | yes |
| `.acceptance.test.ts` suffix | yes |
| bdd structure (given/when/then) | yes |
| test name includes feature | yes (`yield`) |

### extant journey tests in repo

```
blackbox/driver.route.journey.acceptance.test.ts
blackbox/reflect.journey.acceptance.test.ts
```

these also use `.acceptance.test.ts`, not `.play.test.ts`.

## conclusion

the yield feature tests follow the repo convention:
- located in `blackbox/`
- named `driver.route.set.yield.acceptance.test.ts`
- uses bdd structure with given/when/then

no `.play.test.ts` convention in this repo. the fallback convention is used correctly.

