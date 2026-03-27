# self-review r2: has-questioned-questions

## triage each open question

### question 1: should we stream large diffs instead of buffer?

**can this be answered via logic now?**

yes. the savepoint file needs the complete diff content to be written. whether we stream to the file or buffer then write, the diff must be captured in full. a stream approach would:
- add complexity (pipe setup, error handlers)
- not reduce memory (node buffers the entire stream before write anyway for small files)
- break the extant sync pattern

**verdict**: [answered] — no. buffer approach is correct. a stream adds complexity without benefit.

### question 2: what's a reasonable upper bound?

**can this be answered via logic now?**

yes. the error shows ~1MB caused failure. 50MB is 50x headroom. common alternatives:
- 10MB: 10x headroom, might hit edge cases
- 100MB: overkill, but harmless
- `Infinity`: risky, hides memory issues

50MB is a sensible middle ground. it's larger than any realistic text diff but small enough to catch runaway cases.

**verdict**: [answered] — 50MB is reasonable. if real-world usage shows it's too small, we can bump later.

### question 3: (new) where are the execSync calls?

**raised in r2 assumptions review**

this wasn't in the vision's open questions, but should be.

**can this be answered via extant code?** yes — in the research/blueprint phase. we should locate all `execSync` calls in `setSavepoint.ts` and potentially elsewhere.

**verdict**: [research] — to be answered when we read the actual source in the criteria/blueprint phase.

## update to vision needed

the "open questions" section should be updated to show triage status:

```
### questions to validate

1. [answered] should we stream large diffs instead of buffer? — no, buffer is correct
2. [answered] what's a reasonable upper bound? — 50MB is reasonable
3. [research] where are the execSync calls that need this fix?
```

## action

update the vision to show triaged questions.
