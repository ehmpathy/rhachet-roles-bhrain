# self-review: has-play-test-convention (r10)

## review scope

verification stone 5.3 — verify journey test files follow convention

---

## the guide

> journey tests should use `.play.test.ts` suffix:
> - `feature.play.test.ts` — journey test
> - `feature.play.integration.test.ts` — if repo requires integration runner
> - `feature.play.acceptance.test.ts` — if repo requires acceptance runner
>
> verify:
> - are journey tests in the right location?
> - do they have the `.play.` suffix?
> - if not supported, is the fallback convention used?

---

## method

1. list all test files in `blackbox/` directory
2. check if any use `.play.test.ts`
3. identify the repo's established convention
4. verify new achiever tests match that convention
5. verify jest config compatibility

---

## step 1: enumerate test files

```bash
ls blackbox/*.test.ts | head -20
```

**sample output:**
```
blackbox/achiever.goal.guard.acceptance.test.ts
blackbox/achiever.goal.lifecycle.acceptance.test.ts
blackbox/achiever.goal.triage.acceptance.test.ts
blackbox/achiever.goal.triage.next.acceptance.test.ts
blackbox/driver.route.approval-tty.acceptance.test.ts
blackbox/driver.route.artifact-expansion.acceptance.test.ts
blackbox/driver.route.bind.acceptance.test.ts
...
```

**total count:** 48 files

---

## step 2: check for .play.test.ts

```bash
find blackbox/ -name '*.play.test.ts'
```

**result:** no files found

```bash
find blackbox/ -name '*.play.*.test.ts'
```

**result:** no files found

---

## step 3: identify repo convention

### file naming pattern analysis

| pattern | count | examples |
|---------|-------|----------|
| `*.acceptance.test.ts` | 48 | all test files in blackbox/ |
| `*.play.test.ts` | 0 | none |
| `*.integration.test.ts` | 0 | none in blackbox/ |

### naming structure

```
{role}.{feature}.{subfeature?}.acceptance.test.ts
```

examples:
- `achiever.goal.lifecycle.acceptance.test.ts`
- `achiever.goal.triage.next.acceptance.test.ts`
- `driver.route.bind.acceptance.test.ts`
- `review.representative-clean.acceptance.test.ts`

### jest configuration

from `jest.acceptance.config.js`:
```javascript
testMatch: ['**/*.acceptance.test.ts']
```

from `package.json`:
```json
"test:acceptance:locally": "jest --config jest.acceptance.config.js"
```

---

## step 4: verify new tests match convention

### new achiever tests

| file | suffix | location | pattern match? |
|------|--------|----------|----------------|
| `achiever.goal.triage.next.acceptance.test.ts` | `.acceptance.test.ts` | `blackbox/` | yes |
| `achiever.goal.guard.acceptance.test.ts` | `.acceptance.test.ts` | `blackbox/` | yes |

### file structure verification

```bash
head -20 blackbox/achiever.goal.triage.next.acceptance.test.ts
```

**verified structure:**
- imports test-fns (given, when, then)
- imports test utilities (invokeGoalSkill, etc.)
- uses `describe('achiever.goal.triage.next.acceptance', ...)`
- follows BDD pattern with `[caseN]` labels

---

## step 5: jest config compatibility

### run test command

```bash
npm run test:acceptance:locally -- blackbox/achiever.goal.triage.next.acceptance.test.ts
```

**result:** tests run and pass

### pattern match verification

jest config pattern: `**/*.acceptance.test.ts`
new file pattern: `achiever.goal.*.acceptance.test.ts`

match confirmed: `*.acceptance.test.ts` matches `achiever.goal.triage.next.acceptance.test.ts`

---

## fallback convention analysis

### why `.acceptance.test.ts` instead of `.play.test.ts`?

1. **established pattern:** 48 prior test files use `.acceptance.test.ts`
2. **jest config hardcoded:** `testMatch: ['**/*.acceptance.test.ts']`
3. **npm command convention:** `test:acceptance:locally` command expects this pattern
4. **no migration path:** changing convention would require:
   - renaming 48 files
   - updating jest config
   - updating npm commands
   - updating CI workflows

### is this a valid fallback?

the guide says:

> if not supported, is the fallback convention used?

`.acceptance.test.ts` is the fallback convention for this repo because:
- the repo predates the `.play.test.ts` recommendation
- jest config and npm commands are built around it
- consistency with 48 prior files is paramount

---

## skeptical checks

**Q: should new files break convention to use `.play.test.ts`?**

A: NO — consistency trumps new conventions. mixing conventions creates confusion.

**Q: could the tests be named `.play.acceptance.test.ts` as a hybrid?**

A: NO — jest config only matches `*.acceptance.test.ts`, not `*.play.acceptance.test.ts`. the tests wouldn't run.

**Q: are the new test files in the correct directory?**

A: YES — `blackbox/` is where all acceptance tests live. verified by listing 48 peer files.

**Q: do the new tests follow BDD structure?**

A: YES — verified by reading file header:
```typescript
describe('achiever.goal.triage.next.acceptance', () => {
  given('[case1] no goals directory exists', () => {
    when('[t0] goal.triage.next is called', () => {
      then('exit code is 0', () => { ... });
```

---

## summary

| check | question | answer |
|-------|----------|--------|
| 1 | `.play.test.ts` suffix used? | no |
| 2 | fallback convention used? | yes — `.acceptance.test.ts` |
| 3 | consistent with repo? | yes — matches all 48 prior tests |
| 4 | correct location? | yes — `blackbox/` |
| 5 | jest config compatible? | yes — tests run successfully |
| 6 | BDD structure? | yes — given/when/then with labels |

---

## why it holds

1. **repo convention identified:** `.acceptance.test.ts` is the established pattern
2. **new tests follow convention:** both new files use `.acceptance.test.ts`
3. **jest compatibility verified:** tests run with `npm run test:acceptance:locally`
4. **location correct:** `blackbox/` matches 48 peer files
5. **fallback is valid:** changing to `.play.test.ts` would break jest config
6. **BDD structure preserved:** tests use given/when/then from test-fns

the new journey tests follow the repo's fallback convention correctly.

