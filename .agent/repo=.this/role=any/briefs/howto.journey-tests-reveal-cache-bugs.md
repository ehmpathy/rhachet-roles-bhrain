# journey tests reveal cache bugs that unit tests miss

## what

behavior-driven journey tests execute a full user workflow sequentially, with state that accumulates across steps. this pattern exposes bugs in stateful systems that unit tests cannot detect.

## the pattern

```ts
given('[journey] weather api route', () => {
  when('[t0] journey executes sequentially', () => {
    then('completes full route from 1.vision through 5.execute', async () => {
      // phase 1: vision stone with approval gate
      // phase 2: research stone with no guard
      // phase 3: blueprint stone with review + approval
      // phase 4: execute stone with review only
      // phase 5: journey complete
    });
  });
});
```

## why journey tests matter

### unit tests verify components in isolation

```ts
// unit test: does review cache work?
given('a review for hash ABC', () => {
  then('returns cached review for same hash', ...);
});
```

this passes. the component works.

### journey tests verify state accumulation

```ts
// journey test: full workflow
phase 1: artifact created, review fails, hash = ABC
phase 2: external state changes (approval granted)
phase 3: retry with same hash ABC
         → BUG: stale review from phase 1 reused!
```

the journey test reveals the bug: cache keys didn't account for all relevant state.

## artifact continuation

### what it means

each step in a journey builds on prior steps:
- step N produces artifacts
- step N+1 consumes those artifacts
- state from early steps affects later steps

### why it matters

cache decisions depend on artifact identity:

| artifact | identity | cache key |
|----------|----------|-----------|
| source content | hash of file contents | `$hash` |
| review output | hash of reviewed content | `$stone.$hash` |
| approval marker | presence of file | `$stone.approved` |
| judge result | inputs that determine verdict | varies |

if cache keys don't capture all inputs, stale results pollute later steps.

## the bug this journey exposed

### symptoms

```
pass3 failed: blockers exceed threshold (1 > 0)
```

but the review should have passed (mock was set to pass).

### root cause

1. reviews were cached by `(hash, iteration)`
2. judges were cached by `(hash, iteration)`
3. the `reviewed?` judge read ALL reviews across ALL iterations
4. stale review from iteration 1 (with blockers) polluted iteration 3

### fix

- reviews: cache by hash only (same content = same review)
- judges: cache by hash if PASSED (failed judges re-run)
- `reviewed?`: read reviews for current hash only

## the mock test caveat

the journey test used a mock that changed external state:

```ts
// make review pass by create file (not by fix artifact)
await fs.writeFile(path.join(tempDir, '.test', 'review-should-pass'), '');
```

in real usage:
1. code has issues → review finds blockers → hash ABC
2. fix the code → new hash DEF
3. review passes → hash DEF

the hash CHANGES when you fix issues. the mock was artificial but valid for test coverage.

## lesson

> journey tests with artifact continuation expose cache bugs that unit tests miss.
>
> cache keys must capture ALL inputs that affect the cached result.
> if external state can change, either include it in the key or invalidate on change.
