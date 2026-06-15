# rule.require.judge-derived-counts

## .what

blockers and nitpicks must always be derived via the judge operation against the review artifact, with the same thresholds from the guard's `reviewed?` judge.

## .why

- single source of truth: judge is the authority on what counts as blocker vs nitpick
- consistency: same extraction logic regardless of verdict (approved, rejected, exhausted)
- correctness: avoids drift between how counts are extracted in different code paths

## .pattern

```ts
// good: derive via judge operation
const counts = await runReviewedJudge({
  review: reviewArtifact,
  thresholds: getReviewedJudgeThresholds({ judges: guard.judges }),
});
const { blockers, nitpicks } = counts;

// bad: extract directly from content with separate regex
const blockers = content.match(/blockers:\s*(\d+)/);
```

## .invariant

every code path that displays or uses blocker/nitpick counts must:
1. use the same judge operation
2. apply the same thresholds from the guard's `reviewed?` judge
3. work identically for all verdict states (queued, approved, rejected, exhausted)

## .enforcement

separate extraction logic for counts = **BLOCKER**
