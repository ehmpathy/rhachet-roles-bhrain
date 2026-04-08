# self-review: has-play-test-convention (round 4)

## pause

tea first. then, we proceed.

i am the reviewer, not the author.

---

## reviewed artifact

`.behavior/v2026_04_02.feat-achiever/3.2.distill.repros.experience._.v1.i1.md`

---

## what is the play test convention?

the convention says journey tests should use `.play.test.ts` suffix (or `.play.acceptance.test.ts` if repo requires acceptance runner).

**why this convention exists:**
- journey tests are distinct from unit tests
- unit tests verify components in isolation
- journey tests verify step-by-step user experience
- the `.play.` marker distinguishes journey tests from unit/integration tests

---

## re-read the artifact

i read the artifact again, line by line.

**before my edit, the artifact had:**
- experience reproduction table (5 entries)
- journey test sketches (journey 1: multi-part triage, journey 2: goal lifecycle)
- input/output pairs with snapshot targets
- critical paths table
- ergonomics review table
- reproduction feasibility section with test sketch code

**what was absent:** explicit file names for journey tests

---

## the fix i applied

i added a "test file names" section to the artifact:

| journey | file name |
|---------|-----------|
| multi-part request triage | `goal.triage.play.acceptance.test.ts` |
| goal lifecycle | `goal.lifecycle.play.acceptance.test.ts` |

i also added a comment to the test sketch:
```typescript
// goal.triage.play.acceptance.test.ts
describe('achiever multi-part triage journey', () => {
```

---

## why .play.acceptance.test.ts is correct

**the repo's test runners:**
- `npm run test:unit` — runs `*.test.ts` (jest --testMatch)
- `npm run test:integration` — runs `*.integration.test.ts`
- `npm run test:acceptance:locally` — runs `*.acceptance.test.ts`

**there is no `.play.test.ts` runner** — so `.play.` alone would not be picked up.

**the solution:** combine `.play.` with `.acceptance.test.ts`:
- `.play.` = journey test marker
- `.acceptance.test.ts` = runs on acceptance runner

this gives us `goal.triage.play.acceptance.test.ts`:
- `goal.triage` — what journey this is
- `.play.` — marks it as a journey test
- `.acceptance.test.ts` — runs on acceptance runner

---

## verification: does the artifact now have the convention?

| check | status | evidence |
|-------|--------|----------|
| file names specified | yes | "test file names" section added |
| uses .play. marker | yes | both file names have `.play.` |
| uses correct runner suffix | yes | both use `.acceptance.test.ts` |
| test sketch has file name | yes | comment added above describe block |

---

## why this matters

without explicit file names:
- implementation might use inconsistent names
- journey tests might not be found by runners
- the convention would not be followed

with explicit file names:
- implementation has clear guidance
- runners will find the tests
- convention is documented and followed

---

## conclusion

**the fix was applied correctly.**

the artifact now specifies journey test file names:
- `goal.triage.play.acceptance.test.ts`
- `goal.lifecycle.play.acceptance.test.ts`

the convention is satisfied. implementation will follow these names.

