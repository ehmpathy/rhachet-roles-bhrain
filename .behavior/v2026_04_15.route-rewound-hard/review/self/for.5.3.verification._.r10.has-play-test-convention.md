# self-review: has-play-test-convention (r10)

## the guide asks

> journey tests should use `.play.test.ts` suffix

## this repo's convention

### search for `.play.test.ts`

```sh
glob **/*.play.test.ts
# result: no files found
```

this repo does not use `.play.test.ts`.

### what does this repo use?

```sh
glob blackbox/*.acceptance.test.ts
# result: 48 files
```

this repo uses `blackbox/*.acceptance.test.ts` for journey/acceptance tests.

### repo test structure

```
blackbox/                           # journey/acceptance tests
  driver.route.set.yield.acceptance.test.ts   # the yield feature
  driver.route.journey.acceptance.test.ts     # other journeys
  reflect.journey.acceptance.test.ts          # other journeys
  ...

src/                                # unit and integration tests
  domain.operations/
    **/*.test.ts                    # unit tests
    **/*.integration.test.ts        # integration tests
```

## yield feature test: does it follow convention?

### location

| check | expected | actual |
|-------|----------|--------|
| directory | `blackbox/` | `blackbox/` ✓ |
| suffix | `.acceptance.test.ts` | `.acceptance.test.ts` ✓ |

### bdd structure

```ts
describe('driver.route.set.yield.acceptance', () => {
  given('[case1] route.stone.set --as rewound --yield drop', () => {
    when('[t0] stone has yield file', () => {
      const res = useThen('invoke rewound with yield drop', async () => {
        // journey: setup → invoke → verify
      });

      then('cli completes successfully', () => { ... });
      then('yield file is archived', () => { ... });
    });
  });
});
```

| check | expected | actual |
|-------|----------|--------|
| uses given/when/then | yes | yes ✓ |
| case labels | `[caseN]` | `[case1]` through `[case8]` ✓ |
| time labels | `[tN]` | `[t0]`, `[t1]`, etc. ✓ |
| useThen for shared results | yes | yes ✓ |

### feature name in filename

| check | expected | actual |
|-------|----------|--------|
| contains feature | yes | `yield` in filename ✓ |

## why `.play.` not used

this repo predates the `.play.` convention. all journey tests use `.acceptance.test.ts`:

- `driver.route.journey.acceptance.test.ts`
- `reflect.journey.acceptance.test.ts`
- `driver.route.set.yield.acceptance.test.ts` (new)

the yield feature test follows the same pattern as prior journey tests.

## conclusion

the yield feature test follows the repo's fallback convention:
1. located in `blackbox/` ✓
2. uses `.acceptance.test.ts` suffix ✓
3. uses bdd structure (given/when/then) ✓
4. includes feature name in filename (`yield`) ✓

no `.play.test.ts` in this repo. the convention is `.acceptance.test.ts`, and the yield tests follow it.

