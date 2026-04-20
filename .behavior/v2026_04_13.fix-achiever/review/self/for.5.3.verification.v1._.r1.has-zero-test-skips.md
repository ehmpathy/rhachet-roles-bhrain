# self-review: has-zero-test-skips

## summary

verified achiever-related tests have zero skips. all tests run.

---

## verification

### achiever acceptance tests

searched `blackbox/*achiever*.test.ts` for `.skip()` or `.only()`:

**result**: no matches found

files checked:
- `blackbox/achiever.goal.lifecycle.acceptance.test.ts`
- `blackbox/achiever.goal.triage.acceptance.test.ts`
- `blackbox/achiever.goal.triage.next.acceptance.test.ts`

### goal cli unit tests

searched `src/contract/cli/goal.test.ts` for `.skip()` or `.only()`:

**result**: no matches found

---

## skips found elsewhere (out of scope)

grep found skips in unrelated areas:

| file | reason |
|------|--------|
| `src/domain.roles/thinker/.scratch/**` | experimental scratch code, not production |
| `src/domain.roles/thinker/skills/**` | thinker role, not achiever |
| `stepReview.caseBrain.claude-sonnet.integration.test.ts` | review brain tests, not achiever |

these are outside the scope of fix-achiever behavior.

---

## silent credential bypasses

no credential-related conditionals in achiever tests. tests either:
- use mocked fixtures (goal lifecycle tests)
- invoke real skills (acceptance tests require build)

---

## prior failures carried forward

acceptance tests ran clean:
- 1250 passed, 0 failed, 0 skipped
- all achiever tests included in that count

---

## holds

achiever tests have zero skips. all behavior coverage runs.

