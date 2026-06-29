# rule.require.snapshot-every-journey-step

## .what

when an acceptance/journey test has multiple time steps (`[t0]`, `[t1]`, `[t2]`, ...), every step must capture a snapshot — never a subset.

a reviewer should be able to follow the entire journey from the snapshots alone, without a test run or a read of the implementation.

## .why

- snapshots are the reviewer's window into behavior
- a partial snapshot set hides the intermediate states that make a journey meaningful
- the value of a journey test is the *transition* between states; if only the final state is snapped, the story is lost
- reviewers can vibecheck the full narrative — "blocked → overruled → passed" — at a glance
- regressions in any step surface immediately in the diff

## .pattern

### 👍 good — every step snapped

```typescript
given('[case13] tier escalation: L1 malfunctions, L3 runs, overrule succeeds', () => {
  when('[t0] initial pass attempted (L1 malfunctions, L3 passes)', () => {
    const result = useThen('pass fails due to L1 malfunction', async () => ...);

    then('exit code is non-zero', () => { expect(result.code).not.toEqual(0); });

    then('snapshot shows blocked state with L1 malfunction and L3 passed', () => {
      expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();  // t0 snapped
    });
  });

  when('[t1] human overrules L1 malfunction', () => {
    const result = useThen('overrule succeeds', async () => ...);

    then('snapshot shows overrule applied', () => {
      expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();  // t1 snapped
    });
  });

  when('[t2] pass attempted after overrule', () => {
    const result = useThen('pass succeeds', async () => ...);

    then('snapshot matches', () => {
      expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();  // t2 snapped
    });
  });
});
```

a reviewer reads three snapshots and sees the whole arc: blocked → overruled → passed.

### 👎 bad — only the final step snapped

```typescript
given('[case13] tier escalation', () => {
  when('[t0] initial pass attempted', () => {
    then('exit code is non-zero', () => { expect(result.code).not.toEqual(0); });
    // 👎 no snapshot — reviewer cannot see WHAT the blocked state looked like
  });

  when('[t1] human overrules', () => {
    then('exit code is 0', () => { expect(result.code).toEqual(0); });
    // 👎 no snapshot — the overrule transition is invisible
  });

  when('[t2] pass attempted after overrule', () => {
    then('snapshot matches', () => {
      expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();  // only final state
    });
  });
});
```

the reviewer sees the destination but not the journey. they cannot tell whether `[t0]` actually surfaced the malfunction, or whether `[t1]` truly applied the overrule.

## .scope

applies to:
- acceptance tests (`*.acceptance.test.ts`) with multiple `[tn]` steps
- any journey/sequence test where state evolves across steps

does NOT require snapshots for:
- single-step tests (one `[t0]`)
- pure assertion checks where there is no meaningful stdout/artifact to snap

## .the test

ask: "could a reviewer reconstruct the full journey from the snapshots alone?"

- yes → coverage is complete
- no → a step lacks its snapshot

## .enforcement

journey test with snapshots on a subset of `[tn]` steps = **BLOCKER**
