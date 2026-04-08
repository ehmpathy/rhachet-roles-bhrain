# self-review r3: has-questioned-deletables

## verdict: pass

## prior round issue: resolved

r2 identified that glob patterns could be simplified from 3 to 2:
- before: `.yield.*`, `.yield`, `*.md` (3 patterns)
- after: `.yield*`, `*.md` (2 patterns)

**verified**: blueprint updated. implementation details section now shows 2 globs.

## deeper deletion review

### priority levels

blueprint has 5 priority levels:
1. `.yield.md`
2. `.yield.*` (regex)
3. `.yield`
4. `.v1.i1.md`
5. `.i1.md`

**question**: can we reduce priority levels?

**answer**: no.
- levels 1-4 are from vision (explicit order)
- level 5 (`.i1.md`) is from research (test fixtures use it)

each level serves a distinct purpose. no reduction possible.

### transformer vs inline

**question**: can we delete `asArtifactByPriority` and inline the logic?

**answer**: no.
- used in `getAllStoneArtifacts`
- reused in `getAllStoneDriveArtifacts`
- transformer enables reuse without duplication
- pure function, easily testable

the transformer is the right abstraction. keep it.

### test cases

**question**: can we reduce acceptance test cases from 6 to fewer?

| case | purpose | deletable? |
|------|---------|------------|
| 1-3 | each pattern type | no - need coverage per type |
| 4 | backwards compat | no - explicit requirement |
| 5 | yield.md vs v1.i1.md priority | no - criteria requires this |
| 6 | mixed patterns | no - edge case coverage |

case 5 and 6 test different aspects of priority. keep both.

### regex pattern

**question**: can we simplify `/\.yield\.[^.]+$/`?

this matches `.yield.X` where X has no dots. alternatives:
- `/\.yield\..+$/` would match `.yield.a.b` (unintended)
- current pattern is precise

keep current regex.

## conclusion

r2 fix verified. no additional deletions found. every component serves a traced requirement. blueprint is minimal.
