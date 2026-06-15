# rule.require.single-source-of-truth-for-render

## .what

every operation that produces renderable output must have exactly one source of truth. all render sites must read from that source.

## .why

parallel codepaths drift:
- one reads from artifact file, another computes from state
- one shows "malfunction", another shows "approved"
- user sees contradictory information in same output
- diagnosis becomes impossible when outputs disagree

## .pattern

```ts
// 👎 bad — parallel codepaths, multiple sources
// site A: reads from file
const artifact = await readArtifact(path);
emit(`status: ${artifact.status}`);

// site B: computes from state
const verdict = computeVerdict({ rounds, budget, blockers });
emit(`status: ${verdict}`);
```

```ts
// 👍 good — single source of truth
const status = await getReviewStatus({ path }); // reads artifact, returns canonical status

// site A
emit(`status: ${status}`);

// site B
emit(`status: ${status}`);
```

## .the rule

1. identify the source of truth (usually the persisted artifact)
2. create ONE function that reads/computes status from that source
3. all render sites call that function
4. never compute the same information via different logic

## .enforcement

multiple codepaths for same information = **BLOCKER**
