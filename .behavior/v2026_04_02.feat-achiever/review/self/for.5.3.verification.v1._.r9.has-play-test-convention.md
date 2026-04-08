# self-review: has-play-test-convention (r9)

## the question

are journey test files named correctly?

- journey tests should use `.play.test.ts` suffix
- if not supported, is the fallback convention used?

## the review

### method

1. glob for `.play.test.ts` files in blackbox/ to see if convention exists
2. glob for `.acceptance.test.ts` files to see what convention is used
3. verify achiever tests follow the repo's extant convention

### findings

**glob for `.play.test.ts`:**
```
blackbox/*.play.*.test.ts → No files found
```

**glob for `.acceptance.test.ts`:**
```
blackbox/*.acceptance.test.ts → 44 files found
```

the repo uses `.acceptance.test.ts` as the convention for all blackbox tests. no `.play.test.ts` convention exists.

### achiever test files

| file | convention | correct? |
|------|------------|----------|
| achiever.goal.lifecycle.acceptance.test.ts | .acceptance.test.ts | yes |
| achiever.goal.triage.acceptance.test.ts | .acceptance.test.ts | yes |

### convention consistency

the achiever tests follow the same pattern as all other acceptance tests:
- `driver.route.journey.acceptance.test.ts`
- `reflect.journey.acceptance.test.ts`
- `review.representative-clean.acceptance.test.ts`

the `.acceptance.test.ts` suffix is the repo-wide convention for blackbox tests. the achiever tests correctly follow this convention.

### why not `.play.test.ts`?

the guide mentions `.play.test.ts` as a preferred convention, but this repo predates that convention. all 44 acceptance tests use `.acceptance.test.ts`. a rename of all test names would be a separate effort, not in scope for this feature.

## conclusion

**holds: yes**

the achiever tests follow the repo's extant convention:
1. `achiever.goal.lifecycle.acceptance.test.ts` — follows pattern
2. `achiever.goal.triage.acceptance.test.ts` — follows pattern

the fallback convention (`.acceptance.test.ts`) is used consistently across all 44 blackbox tests in the repo. no convention violation.

---

## fresh verification (2026-04-07)

i pause. i breathe. i am the reviewer.

### did i verify the actual test file names?

yes. verified via glob:

```
blackbox/achiever.goal.lifecycle.acceptance.test.ts
blackbox/achiever.goal.triage.acceptance.test.ts
```

both follow the `.acceptance.test.ts` suffix.

### did i verify this matches the repo convention?

yes. the repo has 44 acceptance test files, all with `.acceptance.test.ts`:

| pattern | count |
|---------|-------|
| *.acceptance.test.ts | 44 |
| *.play.test.ts | 0 |
| *.play.acceptance.test.ts | 0 |

the `.play.` convention does not exist in this repo. all blackbox tests use `.acceptance.test.ts`.

### are the achiever tests in the right location?

yes. both are in `blackbox/` alongside all other acceptance tests:

```
blackbox/
├── achiever.goal.lifecycle.acceptance.test.ts
├── achiever.goal.triage.acceptance.test.ts
├── driver.route.journey.acceptance.test.ts
├── driver.route.guard-cwd.acceptance.test.ts
├── ...
└── (44 total acceptance tests)
```

### should we rename to `.play.test.ts`?

no. that would be a separate refactor that affects all 44 files. the achiever tests correctly follow the extant convention.

**verified: play test convention is followed (fallback to .acceptance.test.ts)**
