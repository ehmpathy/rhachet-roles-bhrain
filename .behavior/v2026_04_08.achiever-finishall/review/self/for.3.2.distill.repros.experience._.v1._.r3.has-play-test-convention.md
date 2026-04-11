# self-review: has-play-test-convention

## question: are journey tests named correctly?

### repo convention analysis

I reviewed the `blackbox/` directory to understand the repo's test conventions.

**found pattern:** `{domain}.{feature}.acceptance.test.ts`

examples:
- `achiever.goal.lifecycle.acceptance.test.ts`
- `achiever.goal.triage.acceptance.test.ts`
- `driver.route.drive.acceptance.test.ts`
- `driver.route.journey.acceptance.test.ts`

**no `.play.test.ts` files exist in this repo.**

### does the repo support .play.test.ts?

no. the repo uses `.acceptance.test.ts` for journey-style tests.

checked `package.json` test scripts:
- `test:acceptance:locally` runs tests in `blackbox/`
- no special runner for `.play.` suffix

### what should the new tests be named?

per repo convention:
- `achiever.goal.triage.next.acceptance.test.ts` — for goal.triage.next tests
- `achiever.goal.guard.acceptance.test.ts` — for goal.guard tests

### issue found?

**issue:** the stone instructions mention `.play.test.ts` convention, but this repo uses `.acceptance.test.ts`.

**resolution:** follow repo convention, not stone template.

---

## deeper reflection

### why does the convention matter?

the purpose of the `.play.test.ts` convention is to distinguish journey tests (multi-step user experience tests) from unit tests (single function tests). this repo achieves the same goal differently:

| distinction | .play.test.ts convention | this repo |
|-------------|--------------------------|-----------|
| location | same dir as unit tests | separate `blackbox/` dir |
| suffix | `.play.test.ts` | `.acceptance.test.ts` |
| runner | special command | `npm run test:acceptance:locally` |

both approaches achieve the goal: journey tests are clearly separate from unit tests.

### did I question this assumption?

yes. the question "should we introduce `.play.test.ts` to this repo?" deserves consideration.

**arguments for introduction:**
- aligns with the stone template
- explicit in the filename what kind of test it is

**arguments against introduction:**
- 50+ extant `.acceptance.test.ts` files set a clear precedent
- one outlier file would confuse future readers
- no functional benefit — the test runner doesn't care about the suffix

**verdict:** follow the repo. the repo has spoken. 50 files > 1 template.

### what if I were fresh?

if this repo had no tests yet, I might choose `.play.acceptance.test.ts` — combine both conventions. but the repo is not fresh. the convention is established. adapt, don't fight.

### is the artifact (3.2.distill.repros.experience) affected?

yes. the artifact mentions `.snap` files and journey test structure, but does not prescribe a filename suffix. the actual test filenames will be:
- `achiever.goal.triage.next.acceptance.test.ts`
- `achiever.goal.guard.acceptance.test.ts`

this is noted for implementation clarity.

---

## conclusion

**issue found:** yes — repo uses `.acceptance.test.ts`, not `.play.test.ts`

**resolution:** use `.acceptance.test.ts` per repo convention

**why it holds:**
1. 50+ extant files establish the convention
2. the `blackbox/` directory achieves the same separation goal
3. one outlier would confuse, not clarify
4. adapt to the repo, not the template

**lesson for future:** check repo conventions before test file creation. templates are guidance, not mandate.

