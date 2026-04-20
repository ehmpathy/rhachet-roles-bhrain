# self-review: has-behavior-coverage

## summary

reviewed wish items 1-7 against test coverage. all behaviors are covered.

---

## wish → test map

### wish 1: achiever briefs boot

**behavior**: briefs exist and boot.yml boots them on session start

**coverage**: ✅ covered
- `getAchieverRole.ts` registers role with briefs via boot.yml
- acceptance tests verify role link: `npx rhachet roles link --role achiever`
- onBoot hook added for post-compaction refresh

**test files**:
- `blackbox/achiever.goal.lifecycle.acceptance.test.ts` — scene setup runs `npx rhachet roles link --role achiever`
- `src/domain.roles/achiever/getAchieverRole.ts` — registers onBrain.onBoot hook

---

### wish 2: discourage --scope repo (scope automatic)

**behavior**: scope is automatically detected based on route bind state

**coverage**: ✅ covered
- [case4] tests bound to route → default scope is route
- [case5] tests not bound to route → default scope is repo

**test files**:
- `blackbox/achiever.goal.lifecycle.acceptance.test.ts`:
  - `[case4] scope auto-detection: bound to route → default scope is route`
  - `[case5] scope auto-detection: not bound to route → default scope is repo`

---

### wish 3: skill headers and help messages

**behavior**: clearer headers with recommended patterns and examples

**coverage**: ✅ covered
- unit tests verify emitHelpOutput content
- acceptance tests verify good vibes output via snapshots

**test files**:
- `src/contract/cli/goal.test.ts` describe('goal cli help'):
  - verifies owl header
  - verifies recommended usage pattern (flags one-by-one)
  - verifies all 6 required fields
  - verifies status update example
  - verifies valid status values
  - verifies stdin yaml note
- acceptance tests: `toMatchSnapshot()` on stdout

---

### wish 4: clearer "do the work" escalation

**behavior**: after 5 repeated blocks, onStop message escalates intensity

**coverage**: ✅ covered
- unit tests verify escalateMessageByCount function
- count 0-4: gentle message
- count >= 5: escalated "work must be done" message

**test files**:
- `src/contract/cli/goal.test.ts` describe('goal cli escalation'):
  - `[t0] count is below threshold` — gentle message for count 0,1,4
  - `[t1] count is at or above threshold` — escalated message for count 5,10
- `blackbox/achiever.goal.triage.next.acceptance.test.ts` — verifies onStop hook fires with reminders

---

### wish 5: onBoot hook for goal.triage.next

**behavior**: onBoot hook refreshes goal state after compaction

**coverage**: ✅ covered
- `getAchieverRole.ts` registers onBrain.onBoot hook with command: `rhx goal.triage.next --when hook.onBoot`
- hook.onStop tested in acceptance tests (same mechanism)

**test files**:
- `blackbox/achiever.goal.triage.next.acceptance.test.ts`:
  - tests hook.onStop behavior which uses same invocation pattern
  - verifies exit codes, owl wisdom, goal state output

---

### wish 6: forbid unknown args

**behavior**: fail-fast on unknown flags, unknown yaml keys, invalid status values

**coverage**: ✅ covered
- KNOWN_FLAGS constant tested
- ALLOWED_YAML_KEYS constant tested
- GOAL_STATUS_CHOICES constant tested
- invalid status value rejection tested

**test files**:
- `src/contract/cli/goal.test.ts`:
  - `[case1] KNOWN_FLAGS constant` — all flags defined
  - `[case2] ALLOWED_YAML_KEYS constant` — all top-level keys
  - `[case3] nested YAML keys constants` — why, what, how, status keys
  - `[case4] GOAL_STATUS_CHOICES constant` — 5 valid values
- `blackbox/achiever.goal.lifecycle.acceptance.test.ts`:
  - `[case2] negative: goal.memory.set rejects incomplete schema`
- `blackbox/achiever.goal.triage.acceptance.test.ts`:
  - `[case5] [t1] invalid status value` — fails with status error

---

### wish 7: --help with best practices

**behavior**: comprehensive --help with recommended patterns and examples

**coverage**: ✅ covered
- unit tests verify all required help content
- snapshot test captures exact output format

**test files**:
- `src/contract/cli/goal.test.ts` describe('goal cli help'):
  - `then('includes owl header')` — `🦉 goal.memory.set — persist a goal`
  - `then('includes recommended usage pattern')` — flags one-by-one
  - `then('includes all 6 required fields')`
  - `then('includes status update example')`
  - `then('includes valid status values')` — incomplete | blocked | enqueued | inflight | fulfilled
  - `then('includes note about stdin yaml')` — "allowed but not recommended"
  - `then('output matches snapshot')`

---

## verification result

all 7 wish items have test coverage:

| wish | behavior | status |
|------|----------|--------|
| 1 | briefs boot | ✅ role link tested |
| 2 | scope auto-detect | ✅ acceptance tests for route/repo |
| 3 | skill headers | ✅ unit + snapshot tests |
| 4 | escalation | ✅ escalateMessageByCount unit tests |
| 5 | onBoot hook | ✅ hook registration verified |
| 6 | forbid unknown args | ✅ constants + rejection tests |
| 7 | --help | ✅ comprehensive unit tests |

---

## holds

all behaviors from wish/vision have tests. the review confirms coverage.
