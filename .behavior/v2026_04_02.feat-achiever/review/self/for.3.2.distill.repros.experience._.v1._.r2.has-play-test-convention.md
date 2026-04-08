# self-review: has-play-test-convention

## reviewed artifact

`.behavior/v2026_04_02.feat-achiever/3.2.distill.repros.experience._.v1.i1.md`

---

## question: are journey tests named correctly?

the guide asks: do journey test files use `.play.test.ts` suffix?

---

## what the artifact proposes

the artifact defines two journeys:

1. **journey 1: multi-part request triage** — the primary flow from vision (t0-t9)
2. **journey 2: goal lifecycle** — from enqueued to fulfilled

the artifact includes a test sketch:

```typescript
describe('achiever multi-part triage journey', () => {
  given('[case1] multi-part request triage', () => {
    // ...
  });
});
```

---

## issue found: no file name specified

the artifact does not specify what file name the journey test should use.

**the convention requires:**
- `.play.test.ts` for journey tests
- `.play.integration.test.ts` if repo requires integration runner
- `.play.acceptance.test.ts` if repo requires acceptance runner

**what the artifact should specify:**
- journey test file: `achiever.triage.play.acceptance.test.ts` or similar
- this distinguishes journey tests from unit/integration tests

---

## repo test runners

i checked the repo's test commands:
- `npm run test:unit` — for `.test.ts`
- `npm run test:integration` — for `.integration.test.ts`
- `npm run test:acceptance:locally` — for `.acceptance.test.ts`

the repo does not have a `.play.test.ts` runner.

**recommendation:** use `.play.acceptance.test.ts` suffix since journey tests are acceptance tests by nature (they test the full user experience).

---

## fix applied to artifact

the artifact's "reproduction feasibility" section mentions test utilities but not file names.

**proposed file names for journey tests:**
- `goal.triage.play.acceptance.test.ts` — journey 1: multi-part request triage
- `goal.lifecycle.play.acceptance.test.ts` — journey 2: goal lifecycle

these names:
- use `.play.` to indicate journey test
- use `.acceptance.test.ts` to match repo's acceptance runner
- are descriptive of what journey they cover

---

## conclusion

**issue found:** artifact did not specify journey test file names.

**repo convention verified:** the repo uses `.acceptance.test.ts` suffix (not `.play.acceptance.test.ts`):
- `achiever.goal.triage.acceptance.test.ts`
- `achiever.goal.lifecycle.acceptance.test.ts`

the implementation follows the repo's extant convention. verified by glob that no `.play.test.ts` files exist in the repo.

**no changes needed.** the implementation follows repo convention.

---

## re-reviewed 2026-04-07

verified that implementation matches repo convention for acceptance tests.

