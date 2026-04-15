# self-review: has-zero-test-skips (r3)

## pause to reflect

the guard asks: "did you verify zero skips — and REMOVE any you found?"

let me truly consider what could be skipped:

1. **explicit skips** (`.skip()`, `.only()`)
2. **silent credential bypasses** (early returns when keys absent)
3. **prior failures carried forward** (commented-out tests, todo markers)

## the examination

### 1. explicit skips

i searched the test file for `.skip(` and `.only(`:

```bash
grep -E '\.(skip|only)\(' blackbox/driver.route.stone.add.acceptance.test.ts
# no matches
```

**found**: none exist.

### 2. silent credential bypasses

this test file does not use external credentials. each test case:
- creates a fresh temp directory via `genTempDirForRhachet`
- clones fixture assets from `blackbox/.test/assets/route-driver/`
- links roles via `npx rhachet roles link`
- invokes the skill via `invokeRouteSkill`

there is no `EHMPATHY_API_KEY` or similar credential check. no `if (!process.env.KEY) return` pattern.

**found**: none exist.

### 3. prior failures carried forward

i searched for `// TODO`, `// FIXME`, `// skip`, commented-out `it(` or `then(`:

```bash
grep -E '(TODO|FIXME|// skip|// it\(|// then\()' blackbox/driver.route.stone.add.acceptance.test.ts
# no matches
```

**found**: none exist.

## why this matters

test skips create gaps:
- a skipped test is a behavior left unverified
- silent bypasses mask failures that should block CI
- carried-forward todos are technical debt that compounds

this test file has none of these. every test runs on every execution.

## the 10 test cases

| case | description | runs unconditionally? |
|------|-------------|----------------------|
| case1 | plan mode with literal source | yes |
| case2 | apply mode with literal source | yes |
| case3 | collision detection | yes |
| case4 | invalid stone name | yes |
| case5 | template source | yes |
| case6 | stdin source | yes |
| case7 | stdin with empty content | yes |
| case8 | template not found | yes |
| case9 | required args validation | yes |
| case10 | route not found | yes |

## conclusion

i have examined this test file for all forms of skips. zero found. the test suite executes completely on every run.
