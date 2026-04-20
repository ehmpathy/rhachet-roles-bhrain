# review: has-play-test-convention (r10)

## the question

are journey test files named correctly with `.play.test.ts` suffix?

## analysis

### test file inventory

```
blackbox/achiever.goal.onTalk.acceptance.test.ts
```

this is the only test file for this behavior.

### is this a journey test?

**no.** this is an acceptance test.

journey tests have specific characteristics:
- state accumulates across test steps
- step N produces state that step N+1 consumes
- tests a full workflow from start to finish
- typically uses `given('[journey] ...')` label

the onTalk tests do NOT have these characteristics:
- each case (case1-case8) is isolated
- each case creates fresh temp directory
- no state flows between cases
- no multi-step workflow

### why acceptance is correct

the tests verify:
- CLI invocation behavior
- input/output contracts
- edge cases

this is acceptance test territory, not journey test territory.

### what a journey test would look like

if this behavior needed a journey test (it doesn't), it would be:

```ts
// achiever.goal.onTalk.play.acceptance.test.ts
given('[journey] asks accumulate across session', () => {
  when('[t0] first ask arrives', () => {
    // state: asks.inventory.jsonl has 1 entry
  });
  when('[t1] second ask arrives', () => {
    // state: asks.inventory.jsonl has 2 entries
    then('inventory contains both asks', ...);
  });
  when('[t2] onStop fires', () => {
    // state flows from t0/t1
    then('both asks verified', ...);
  });
});
```

but this behavior doesn't need such a test — the acceptance tests adequately cover the contract.

### file location check

- [x] test is in `blackbox/` — correct for acceptance tests
- [x] test uses `.acceptance.test.ts` — correct suffix for its type
- [x] no `.play.` files exist — correct, no journey tests needed

## why it holds

1. **the test is acceptance, not journey** — no state accumulation across steps
2. **suffix is correct** — `.acceptance.test.ts` matches test type
3. **no journey tests are needed** — individual invocation tests suffice
4. **convention not violated** — `.play.` suffix applies only to journey tests, which don't exist here
5. **if journey tests were added in future** — they would use `.play.acceptance.test.ts`

