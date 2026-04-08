# self-review r3: has-questioned-assumptions

## verdict: pass

## assumptions identified and questioned

### assumption 1: priority order is fixed

**claim**: `.yield.md` > `.yield.*` > `.yield` > `.v1.i1.md` > `.i1.md`

**question**: what if someone wants `.yield` (extensionless) to be highest priority?

**resolution**: the vision explicitly specifies this order. the order is a contract, not an implementation choice. follow the vision.

**status**: valid assumption (vision-mandated)

### assumption 2: only one artifact per stone

**claim**: the transformer returns exactly one artifact (highest priority)

**question**: what if a stone has both `.yield.md` and `.yield.json` and both are needed?

**resolution**:
- criteria says "driver resolves artifact" (singular)
- vision says "primary artifact"
- multiple yields per stone is explicitly out of scope

**status**: valid assumption (criteria-mandated)

### assumption 3: regex handles edge cases

**claim**: `/\.yield\.[^.]+$/` correctly matches `.yield.*` patterns

**question**: what about `.yield.tar.gz` (multiple dots)?

**resolution**:
- the regex does NOT match `.yield.tar.gz`
- this is acceptable: stone artifacts are not archives
- if needed, could extend regex in future (backwards compat)

**status**: valid assumption (practical scope)

### assumption 4: `.i1.md` pattern is needed

**claim**: priority 5 includes `.i1.md` for test compat

**question**: what if tests migrate to `.yield.md`?

**resolution**:
- `.i1.md` at lowest priority is harmless if unused
- if tests keep use of `.i1.md`, it works
- if tests migrate, priority order still correct
- backwards compat is always safer

**status**: valid assumption (research-backed)

### assumption 5: only two files need changes

**claim**: only `getAllStoneArtifacts.ts` and `getAllStoneDriveArtifacts.ts` need glob changes

**question**: are there other artifact discovery codepaths?

**resolution**:
- research verified guard uses distinct `.guard.` pattern (no change needed)
- research verified passage uses `passage.jsonl` (no change needed)
- no other discovery functions found

**status**: valid assumption (research-verified)

### assumption 6: separate transformer file

**claim**: create new `asArtifactByPriority.ts` file

**question**: could inline the logic instead?

**resolution**:
- transformer is used in 2 places
- separate file enables isolated unit tests
- pure function extraction is idiomatic
- research recommends it

**status**: valid assumption (follows patterns)

### assumption 7: glob library behavior

**claim**: `.yield*` matches `.yield`, `.yield.md`, `.yield.json`

**question**: is this glob behavior consistent across platforms?

**resolution**:
- `fast-glob` and `glob` libraries standardize behavior
- `*` matches any character sequence, even empty
- tested behavior in node ecosystem

**status**: valid assumption (library-guaranteed)

## conclusion

all assumptions either trace to requirements (vision, criteria) or are verified by research. no hidden assumptions found that need correction.
