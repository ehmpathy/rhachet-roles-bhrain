# self-review: has-play-test-convention (r10)

## the claim

journey tests should use `.play.test.ts` suffix.

## this repo does not use `.play.test.ts`

### search results

```
$ find . -name '*.play.*.ts'
# (no results)
```

### extant convention in this repo

this repo uses `.acceptance.test.ts` suffix for all blackbox tests:

```
blackbox/
  driver.route.stone.add.acceptance.test.ts    # <- the new test
  driver.route.journey.acceptance.test.ts      # <- journey test (not .play.)
  driver.route.drive.acceptance.test.ts
  ...
```

### journey test convention

the repo has one journey test: `driver.route.journey.acceptance.test.ts`

it uses the pattern `*.journey.acceptance.test.ts` — not `.play.`.

### why no `.play.` for route.stone.add

`route.stone.add` is a simple atomic operation:
- add a stone to a route
- no multi-step workflow
- no state accumulation across steps
- all cases are independent

a journey test would be for the full route workflow (`route.drive` through all stones), which is covered by `driver.route.journey.acceptance.test.ts`.

### verification per guide questions

| guide question | answer |
|----------------|--------|
| "are journey tests in the right location?" | yes — `blackbox/` directory |
| "do they have the `.play.` suffix?" | no — repo uses `.acceptance.test.ts` |
| "if not supported, is the fallback convention used?" | **yes** — see below |

### fallback convention is used

the guide allows for repos that don't use `.play.test.ts`:
> "if not supported, is the fallback convention used?"

this repo's fallback convention is:
- blackbox tests in `blackbox/` directory
- suffix: `.acceptance.test.ts`
- journey tests: `*.journey.acceptance.test.ts`

the new test `driver.route.stone.add.acceptance.test.ts` follows this fallback convention.

### why `.play.` is not supported here

repo analysis:
1. no `.play.test.ts` files exist
2. all blackbox tests use `.acceptance.test.ts`
3. the test runner config expects `*.acceptance.test.ts`
4. a rename would require repo-wide refactor

use of `.play.` for one feature would violate consistency.

## the result

- guide asks "is the fallback convention used?" — **yes**
- fallback convention: `*.acceptance.test.ts` in `blackbox/`
- new test follows this convention
- no `.play.` suffix in this repo, and that's acceptable per guide

