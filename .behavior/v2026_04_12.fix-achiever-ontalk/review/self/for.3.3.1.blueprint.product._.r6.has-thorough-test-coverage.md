# self-review: has-thorough-test-coverage (r6)

## stone

`3.3.1.blueprint.product`

## verdict

**pass**

---

## methodology

I re-read the blueprint test coverage section (lines 133-213) and the codepath tree (lines 31-76).

for each codepath, I verified:
1. layer → correct test type
2. case types → positive, negative, happy path, edge
3. snapshot coverage for contracts

---

## layer coverage analysis

### codepaths and their layers

| codepath | layer | required test | declared test |
|----------|-------|---------------|---------------|
| `extractPromptFromStdin` | transformer | unit | unit (line 139) |
| `emitOnTalkReminder` | transformer | unit | integration (via CLI) |
| `goalTriageInfer` (onTalk mode) | orchestrator | integration | integration (line 141) |
| `goal.triage.infer` CLI | contract | integration + acceptance | integration (line 141) |

**question: should `emitOnTalkReminder` have separate unit tests?**

analysis:
- it's a pure function (string → void with side effect to stderr)
- blueprint tests it via integration test snapshots
- the function is 17 lines of console.error calls
- unit test would just verify string output
- integration test snapshot verifies exact output format

**verdict:** integration test coverage is sufficient. the snapshot covers the exact output format. separate unit tests would duplicate this coverage.

---

## case coverage analysis

### extractPromptFromStdin (unit tests, lines 157-168)

| case | type | covered? |
|------|------|----------|
| valid JSON with prompt | positive | yes (case1) |
| empty stdin | edge | yes (case2) |
| malformed JSON | negative | yes (case3) |
| JSON without prompt field | negative | yes (case4) |
| prompt is empty string | edge | yes (case5) |

**verdict:** all case types covered.

### hook.onTalk ask accumulation (integration tests, lines 173-188)

| case | type | covered? |
|------|------|----------|
| normal message via stdin | happy path | yes (case1) |
| empty message via stdin | edge | yes (case2) |
| multiple messages in sequence | edge | yes (case3) |
| duplicate message | edge | yes (case4) |
| malformed JSON stdin | negative | yes (case5) |

**verdict:** all case types covered.

### hook.onTalk output format (integration tests, lines 190-196)

| case | type | covered? |
|------|------|----------|
| owl header present | positive | yes (case1 t0) |
| full message in sub.bucket | positive | yes (case1 t1) |
| consider prompt present | positive | yes (case1 t2) |
| triage command shown | positive | yes (case1 t3) |
| snapshot | positive | yes |

**verdict:** output format thoroughly verified.

### hook.onTalk edge cases (integration tests, lines 198-204)

| case | type | covered? |
|------|------|----------|
| very long message | edge | yes (case1) |
| special chars and emoji | edge | yes (case2) |

**verdict:** edge cases covered.

---

## journey test coverage analysis

### usecase.2: coverage verification via onStop

this usecase requires multi-hook verification. the blueprint declares 1 exhaustive journey case with 13 timesteps plus 3 edge case journeys.

**exhaustive journey (13 timesteps):**

| timestep | state | verifies |
|----------|-------|----------|
| t0 | before any interaction | no asks, no goals |
| t1 | onTalk with message1 | ask accumulated, reminder format |
| t2 | onTalk with message2 | second ask accumulated |
| t3 | onStop | halt: 2 uncovered asks |
| t4 | goal created that covers ask1 | 1 goal |
| t5 | onStop | halt: 1 uncovered (ask2) |
| t6 | goal updated to cover ask2 | coverage complete |
| t7 | onStop | no halt: all asks covered |
| t8 | onTalk with message3 | new ask after goals |
| t9 | onStop | halt: 1 uncovered (ask3) |
| t10 | goal marked incomplete | incomplete goal state |
| t11 | onStop | halt: incomplete goal |
| t12 | goal marked complete | back to covered |

**why 13 timesteps?**

a real user session goes through many states: send messages, create goals, check coverage, send more messages. if we split this into separate cases we miss state accumulation bugs. one exhaustive journey exercises the full lifecycle.

**edge case journeys (3):**

| case | verifies |
|------|----------|
| case2: empty messages | silent skip behavior |
| case3: duplicate messages | same hash coverage |
| case4: special chars/unicode | hash and display correct |

**verdict:** journey test coverage is exhaustive.

---

## snapshot coverage analysis

blueprint declares 11 snapshots total (7 journey + 4 integration):

**journey snapshots (7):**

| snapshot | what it captures |
|----------|-----------------|
| [t1] first message | onTalk reminder format |
| [t2] second message | onTalk reminder format |
| [t3] 2 uncovered asks | onStop halt with 2 asks |
| [t5] partial coverage | onStop halt with 1 uncovered |
| [t9] new uncovered | onStop halt with new ask |
| [t11] incomplete goal | onStop halt with incomplete |
| [case4] special chars | unicode in reminder |

**integration snapshots (4):**

| snapshot | what it captures |
|----------|-----------------|
| normal message | output format |
| multiline message | line iteration |
| very long message | no truncation |
| onStop halt format | halt stderr structure |

**question: are negative case snapshots needed?**

analysis:
- negative cases (empty stdin, malformed JSON) produce no output
- exit 0 silently per criteria
- snapshots for "no output" would be empty strings
- not useful to snapshot

**verdict:** snapshot coverage is appropriate. 11 snapshots capture distinct contract outputs at critical state transitions.

---

## test tree analysis

blueprint test tree at lines 145-150:

```
src/contract/cli/
├── [○] goal.ts
├── [~] goal.test.ts                       # add unit tests for extractPromptFromStdin
├── [+] goal.onTalk.integration.test.ts    # integration tests for hook.onTalk mode
└── [+] goal.journey.integration.test.ts   # exhaustive journey tests (13 timesteps + 3 edge cases)
```

**verification:**
- unit tests: collocated in goal.test.ts (correct)
- integration tests: separate file goal.onTalk.integration.test.ts (correct)
- journey tests: separate file goal.journey.integration.test.ts (correct)
- file locations follow convention

**verdict:** test tree is complete and follows conventions.

---

## gap check

| requirement | status |
|-------------|--------|
| transformers have unit tests | yes (extractPromptFromStdin) |
| orchestrators have integration tests | yes (goalTriageInfer onTalk mode) |
| contracts have integration tests | yes |
| positive cases covered | yes |
| negative cases covered | yes |
| happy path covered | yes |
| edge cases covered | yes |
| journey tests for multi-hook flow | yes (1 exhaustive + 3 edge case journeys) |
| snapshots for contract output | yes (11 snapshots: 7 journey + 4 integration) |
| test tree declared | yes |

**no gaps found.**

---

## reflection

the blueprint test coverage is thorough:
- 5 unit test cases for the transformer
- 12 integration test cases for hook.onTalk behavior
- 1 exhaustive journey case with 13 timesteps + 3 edge case journeys
- 11 snapshots (7 journey + 4 integration)

each layer has the appropriate test type. case coverage spans positive, negative, and edge. the exhaustive journey test verifies the full session lifecycle from first message to goal completion. snapshots capture contract outputs at critical state transitions.

