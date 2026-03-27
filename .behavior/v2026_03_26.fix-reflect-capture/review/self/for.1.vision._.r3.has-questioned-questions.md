# self-review r3: has-questioned-questions

## step back and breathe

in r2 i triaged questions mechanically. in r3 i ask: what questions am i not aware of?

## review each triaged question

### q1: [answered] stream vs buffer

**why this holds**: i answered that buffer is correct because the savepoint file needs the complete diff. let me verify this logic:

- `setSavepoint` captures git state for later restore
- the diff must be stored somewhere (file, memory, etc.)
- whether stream or buffer, the data volume is identical
- a stream to file still requires the process to hold the data briefly
- the sync pattern is extant; async would require refactor

**verdict**: answer holds. no change.

### q2: [answered] 50MB upper bound

**why this holds**: 50MB is 50x the observed failure size. alternatives:
- smaller (10MB): might hit edge cases
- larger (100MB+): excessive
- `Infinity`: masks memory issues

**verdict**: answer holds. no change.

### q3: [research] where are the execSync calls

**why this is correctly deferred**: the vision describes the desired outcome, not the implementation path. code location belongs in the research/blueprint phase.

**verdict**: correct triage. no change.

## questions i hadn't considered

### q4: are there other commands with this issue?

the error is in `setSavepoint`, but other rhachet commands may use `execSync` for git commands. should we proactively fix them?

**analysis**: the wish showed one specific failure. proactive fixes are scope creep. if others fail, they'll manifest and be fixed.

**verdict**: [answered] — no. fix what's broken, not what might break.

### q5: should we add a test?

a test would prevent regression. should the vision mention test coverage?

**analysis**: a test belongs in the criteria/blueprint, not vision. the vision describes the outcome ("large diffs work"), not the verification method.

**verdict**: [answered] — not a vision concern. criteria will address test coverage.

### q6: should we improve the error message?

ENOBUFS is cryptic. should we wrap it with a helpful message?

**analysis**: this is nice-to-have scope creep. the fix removes the error entirely. no need to improve a message that won't appear.

**verdict**: [answered] — no. the fix eliminates the error, not improves it.

## conclusion

all questions are properly triaged:
- 3 answered in vision
- 1 deferred to research
- 3 additional questions considered and answered

no changes to vision needed.
