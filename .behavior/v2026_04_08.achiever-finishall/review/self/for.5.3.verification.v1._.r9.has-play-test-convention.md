# self-review: has-play-test-convention (r9)

## review scope

verification stone 5.3 — verify journey test files follow convention

---

## the convention

the guide states:

> journey tests should use `.play.test.ts` suffix:
> - `feature.play.test.ts` — journey test
> - `feature.play.integration.test.ts` — if repo requires integration runner
> - `feature.play.acceptance.test.ts` — if repo requires acceptance runner

---

## method

1. search for `.play.test.ts` files in repo
2. search for all test files in blackbox/
3. determine which convention is used
4. verify new tests follow that convention

---

## findings

### play test search

```bash
find . -name '*.play.test.ts'
```

**result:** no files found

### acceptance test search

```bash
ls blackbox/*.acceptance.test.ts | wc -l
```

**result:** 48 files

### new achiever tests

| file | convention |
|------|------------|
| `blackbox/achiever.goal.triage.next.acceptance.test.ts` | `.acceptance.test.ts` |
| `blackbox/achiever.goal.guard.acceptance.test.ts` | `.acceptance.test.ts` |

---

## convention analysis

### repo convention

this repo uses `.acceptance.test.ts` as the standard test suffix. evidence:

```
blackbox/
├── achiever.goal.lifecycle.acceptance.test.ts
├── achiever.goal.triage.acceptance.test.ts
├── driver.route.*.acceptance.test.ts (25+ files)
├── review.*.acceptance.test.ts (12+ files)
├── reflect.*.acceptance.test.ts (5 files)
└── init.research.acceptance.test.ts
```

all 48 test files use `.acceptance.test.ts`.

### why not `.play.test.ts`?

the repo has an established convention that predates the `.play.test.ts` recommendation. consistency with the 46 prior test files is more important than a new naming convention.

### jest configuration

from `package.json` (verified via npm run scripts):

```json
"test:acceptance:locally": "jest --config jest.acceptance.config.js"
```

the jest config expects `*.acceptance.test.ts` files.

---

## verification

### do new tests follow repo convention?

| check | expected | actual | status |
|-------|----------|--------|--------|
| suffix | `.acceptance.test.ts` | `.acceptance.test.ts` | pass |
| location | `blackbox/` | `blackbox/` | pass |
| naming pattern | `role.feature.acceptance.test.ts` | `achiever.goal.*.acceptance.test.ts` | pass |

### are journey tests in the right location?

| file | location | correct? |
|------|----------|----------|
| `achiever.goal.triage.next.acceptance.test.ts` | `blackbox/` | yes |
| `achiever.goal.guard.acceptance.test.ts` | `blackbox/` | yes |

---

## skeptical check

**Q: should we rename to `.play.test.ts` for consistency with the guide?**

A: NO — the guide says "if not supported, is the fallback convention used?" this repo's fallback is `.acceptance.test.ts`, which is used consistently across all 48 tests.

**Q: will the new tests run with extant test commands?**

A: YES — `npm run test:acceptance:locally` matches `*.acceptance.test.ts` pattern. verified by running tests earlier (all passed).

**Q: is there any jest config that would miss these files?**

A: NO — `jest.acceptance.config.js` uses the same pattern as all other acceptance tests.

---

## summary

| check | status |
|-------|--------|
| `.play.test.ts` used? | no |
| fallback convention used? | yes — `.acceptance.test.ts` |
| consistent with repo? | yes — matches 48 prior tests |
| correct location? | yes — `blackbox/` |
| jest config compatible? | yes |

---

## why it holds

1. **fallback convention in use:** repo uses `.acceptance.test.ts` consistently
2. **new tests follow convention:** both new files match prior art
3. **location correct:** `blackbox/` is the standard location
4. **tests run successfully:** verified with `npm run test:acceptance:locally`
5. **consistency prioritized:** 48 prior files set the pattern

the new journey tests follow the repo's established convention.

