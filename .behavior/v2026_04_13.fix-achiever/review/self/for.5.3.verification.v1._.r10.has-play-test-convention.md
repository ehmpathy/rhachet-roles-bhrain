# self-review: has-play-test-convention (r10)

## the question

are journey test files named correctly?

---

## methodology

1. search for `.play.test.ts` files in repo
2. identify journey vs case-based test patterns
3. verify achiever tests match repo convention
4. determine if any achiever tests ARE journey tests that need rename

---

## search: `.play.test.ts` files

```
glob: **/*.play.*.ts
result: no files found
```

this repo does not use the `.play.test.ts` convention.

---

## journey test identification

### what makes a test a "journey test"?

| property | journey test | case-based test |
|----------|-------------|-----------------|
| label | `[journey]` or multi-part flow | `[case1]`, `[case2]` isolated |
| when blocks | sequential `[t0]`, `[t1]`, `[t2]`... | sequential but independent |
| state | accumulates across whens | fresh per case |
| structure | phases of a user workflow | individual scenarios |

### extant journey tests in this repo

1. **`driver.route.journey.acceptance.test.ts`**
   - label: `[journey] weather api route`
   - structure: `[t0]` → `[t1]` → ... → `[t28]` (29 phases)
   - state: tempDir accumulates across all phases
   - description: "full journey acceptance test for the driver role"

2. **`reflect.journey.acceptance.test.ts`**
   - label: likely `[journey]` pattern
   - suffix: `.acceptance.test.ts` (not `.play.`)

---

## review: new achiever tests

### `achiever.goal.lifecycle.acceptance.test.ts`

```ts
given('[case1] goal status transitions via CLI', () => {
  when('[t0] goal.memory.set creates new goal', () => { ... });
  when('[t1] goal.memory.get retrieves goal', () => { ... });
  when('[t2] goal.memory.set updates status', () => { ... });
```

- label: `[case1]` — indicates case-based
- state: shared tempDir within the case
- verdict: **case-based test with sequential steps** (not a journey test)

### `achiever.goal.triage.acceptance.test.ts`

```ts
given('[case1] multi-part request triage flow', () => {
  when('[t0] first ask is created as a goal', () => { ... });
  when('[t1] second ask is created as a goal', () => { ... });
  when('[t2] third ask is created as a goal', () => { ... });
  when('[t3] all goals are listed', () => { ... });
```

- label: `[case1]` — indicates case-based
- state: shared tempDir within the case
- verdict: **case-based test with sequential steps** (not a full journey)

### `achiever.goal.guard.acceptance.test.ts`

- label: `[case1]` — case-based
- tests: single scenario (guard blocks direct access)
- verdict: **case-based test**

### `achiever.goal.triage.next.acceptance.test.ts`

- labels: `[case1]`, `[case2]`, `[case3]`, `[case4]`, `[case5]`
- each case: isolated scenario
- verdict: **case-based tests**

---

## distinction: multi-step case vs journey

### multi-step case (what achiever tests are)

```ts
given('[case1] multi-part request triage flow', () => {
  // single scenario with steps
  when('[t0] first ask', () => { ... });
  when('[t1] second ask', () => { ... });
});
given('[case2] different scenario', () => { ... });
```

- multiple given blocks for different scenarios
- each case is self-contained
- steps within case are related but limited scope

### journey test (what driver.route.journey is)

```ts
given('[journey] weather api route', () => {
  // entire user workflow from start to finish
  when('[t0] route is initialized', () => { ... });
  when('[t1] vision artifact created', () => { ... });
  // ... 28 more phases
  when('[t28] journey complete', () => { ... });
});
```

- single given with `[journey]` label
- complete user workflow simulation
- state accumulates across many phases

---

## verdict: no achiever journey tests

none of the new achiever tests are journey tests:

| file | pattern | journey? |
|------|---------|----------|
| `achiever.goal.lifecycle.acceptance.test.ts` | `[case1]` multi-step | no |
| `achiever.goal.triage.acceptance.test.ts` | `[case1]` multi-step | no |
| `achiever.goal.guard.acceptance.test.ts` | `[case1]` single | no |
| `achiever.goal.triage.next.acceptance.test.ts` | `[case1-5]` scenarios | no |

if any were journey tests, they would need:
- `[journey]` label in the given block
- complete workflow simulation
- potentially `.play.acceptance.test.ts` suffix (if repo supported it)

but since they are case-based tests, `.acceptance.test.ts` is correct.

---

## why it holds

1. **no `.play.` convention in this repo** — repo uses `.acceptance.test.ts` for all acceptance tests
2. **no achiever journey tests created** — all new tests are case-based, not journey
3. **test structure matches intent** — multi-step cases use `[caseN]` + sequential whens
4. **consistent with repo pattern** — follows same convention as extant tests
5. **location is correct** — all acceptance tests in `blackbox/` directory

the `.play.test.ts` question is not applicable because:
- this repo doesn't use that convention (fallback applies)
- no journey tests were created for achiever role (only case-based acceptance tests)

