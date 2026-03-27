# self-review: has-questioned-assumptions

## assumptions in the vision

### assumption 1: 50MB maxBuffer is sufficient

**what we assumed**: 50MB is enough for any realistic staged diff.

**evidence**:
- the error shows ~1MB caused ENOBUFS
- typical large refactors are 5-10MB
- 50MB is 50x the default, gives huge headroom

**what if opposite were true?**
if someone had a 100MB diff, they'd still hit limits. but at that scale, they likely have other problems (binary files committed, wrong repo structure). the error would at least be clearer.

**verdict**: assumption holds. 50MB is a reasonable bound.

### assumption 2: `execSync` is the right approach

**what we assumed**: sync execution is fine, no need for async streams.

**evidence**:
- `setSavepoint` is already sync code
- the diff content must be captured in full before write
- async would require rewrite of the caller chain

**what if opposite were true?**
async streams would avoid memory spikes for huge diffs. but the savepoint file needs the complete diff anyway — we can't write it line-by-line. memory is consumed either way.

**did the wisher say this?** no — this is an implementation detail we inferred.

**verdict**: assumption holds. async adds complexity without benefit here.

### assumption 3: the error is in `setSavepoint.js:63`

**what we assumed**: line 63 is the relevant `execSync` call.

**evidence**: stack trace in the error shows this exact location.

**exceptions**: there may be other `execSync` calls in the same file that also need the fix.

**verdict**: assumption holds, but we should check for other calls in the file.

### assumption 4: this is the only place with this issue

**what we assumed**: only `setSavepoint` has the buffer problem.

**what if opposite were true?** other commands (`git diff`, `git show`, etc.) elsewhere in the codebase might hit the same limit.

**did the wisher say this?** the wish showed one specific error trace. we should fix what broke, not speculate.

**verdict**: assumption is reasonable scope. fix the reported issue; others can be fixed when they manifest.

## conclusion

all assumptions are reasonable:
- 50MB is generous headroom for realistic diffs
- sync approach matches extant code and constraints
- the fix location is confirmed by stack trace
- scope is correct: fix what broke

no hidden assumptions that invalidate the approach.
