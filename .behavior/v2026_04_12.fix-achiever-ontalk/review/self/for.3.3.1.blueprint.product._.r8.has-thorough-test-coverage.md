# self-review: has-thorough-test-coverage (r8)

## stone

`3.3.1.blueprint.product`

## verdict

**pass**

---

## methodology

I re-read the blueprint test coverage sections:
1. test coverage by layer (lines 133-144)
2. test tree (lines 145-153)
3. test cases for unit/integration (lines 155-207)
4. journey tests (lines 209-249)
5. snapshot coverage (lines 251-265)
6. acceptance criteria map (lines 281-292)

---

## layer coverage

### codepaths and their layers

| codepath | layer | required test type |
|----------|-------|-------------------|
| `extractPromptFromStdin` | transformer | unit |
| `emitOnTalkReminder` | transformer | unit (or integration snapshot) |
| `goalTriageInfer` (onTalk branch) | orchestrator | integration |
| `goalTriageInfer` (onStop branch) | orchestrator | integration |
| `goal.triage.infer` CLI | contract | integration + acceptance |

### declared vs required

| codepath | required | declared | blueprint lines | status |
|----------|----------|----------|-----------------|--------|
| `extractPromptFromStdin` | unit | unit | 157-171 | match |
| `emitOnTalkReminder` | unit | integration snapshot | 192-198, 253-257 | acceptable |
| onTalk orchestrator | integration | integration | 173-207 | match |
| onStop orchestrator | integration | journey integration | 209-249 | match |
| CLI contract | integration | integration + journey | 141-143 | match |

**note:** emitOnTalkReminder is tested via integration snapshot which covers the output format through the full CLI path. acceptable.

---

## case coverage by usecase

### usecase.1: ask accumulation (blueprint lines 173-191)

| case type | criterion | test case | line |
|-----------|-----------|-----------|------|
| positive | ask appended | case1 t0 | 178 |
| positive | reminder emitted | case1 t1 | 179 |
| positive | exits 0 | case1 t2 | 180 |
| positive | multiple asks in order | case3 t0 | 185 |
| positive | duplicate creates separate entry | case4 t0 | 187 |
| negative | empty stdin no ask | case2 t0 | 182 |
| negative | empty exits 0 silently | case2 t1 | 183 |
| negative | malformed JSON no ask | case5 t0 | 189 |
| negative | malformed exits 0 | case5 t1 | 190 |

**verdict:** positive and negative cases covered.

---

### usecase.2: coverage verification via onStop (blueprint lines 209-309)

the r7 review incorrectly stated usecase.2 was "out of scope." it is in scope. the blueprint includes an exhaustive journey test with 13 timesteps.

**exhaustive journey (case1, 13 timesteps):**

| timestep | state | criterion | line |
|----------|-------|-----------|------|
| t0 | before any asks | baseline | 216-218 |
| t1 | first message via onTalk | ask accumulated | 220-225 |
| t2 | second message via onTalk | second ask accumulated | 227-231 |
| t3 | onStop fires | 2 uncovered, halt, exit 2 | 233-237 |
| t4 | goal covers first ask | partial coverage | 239-241 |
| t5 | onStop fires | 1 uncovered, halt | 243-248 |
| t6 | goal covers second ask | full coverage | 250-252 |
| t7 | onStop fires | no uncovered, silent exit 0 | 254-257 |
| t8 | third message via onTalk | new ask after goals | 259-262 |
| t9 | onStop fires | 1 uncovered, halt | 264-269 |
| t10 | goal marked fulfilled | incomplete goal | 271-273 |
| t11 | onStop fires | incomplete goal enumerated | 275-280 |
| t12 | final state verification | all state correct | 282-285 |

**edge case journeys:**

| case | scenario | criterion |
|------|----------|-----------|
| case2 | empty/malformed messages | silent skip |
| case3 | duplicate messages | separate entries, same hash coverage |
| case4 | special chars and unicode | hash and display correct |

**verdict:** usecase.2 has exhaustive journey test coverage. 13 timesteps cover the full session lifecycle.

---

### usecase.3: reminder output format (blueprint lines 192-198)

| case type | criterion | test case | line |
|-----------|-----------|-----------|------|
| positive | owl header | case1 t0 | 194 |
| positive | full message | case1 t1 | 195 |
| positive | consider prompt | case1 t2 | 196 |
| positive | triage command | case1 t3 | 197 |
| positive | snapshot | snapshot | 198 |

**verdict:** all criteria covered with snapshot.

---

### usecase.4: stdin extraction (blueprint lines 157-171)

| case type | criterion | test case | line |
|-----------|-----------|-----------|------|
| positive | valid JSON returns prompt | case1 t0 | 162 |
| negative | empty stdin returns null | case2 t0 | 164 |
| negative | malformed JSON returns null | case3 t0 | 166 |
| negative | no prompt field returns null | case4 t0 | 168 |
| negative | empty prompt returns null | case5 t0 | 170 |

**verdict:** 5 cases cover positive and all negative paths.

---

### edge cases (blueprint lines 200-206)

| case type | criterion | test case | line |
|-----------|-----------|-----------|------|
| edge | very long message in reminder | case1 t0 | 202 |
| edge | very long message in inventory | case1 t1 | 203 |
| edge | special chars hashed | case2 t0 | 205 |
| edge | special chars saved | case2 t1 | 206 |

**verdict:** edge cases covered.

---

## snapshot coverage

### declared snapshots (lines 311-329)

**journey snapshots (7):**

| snapshot | timestep | what it verifies |
|----------|----------|------------------|
| journey: [t1] first message | t1 | onTalk reminder format |
| journey: [t2] second message | t2 | onTalk reminder format |
| journey: [t3] 2 uncovered asks | t3 | onStop halt with 2 asks |
| journey: [t5] partial coverage | t5 | onStop halt with 1 uncovered |
| journey: [t9] new uncovered | t9 | onStop halt with new ask |
| journey: [t11] incomplete goal | t11 | onStop halt with incomplete |
| journey: [case4] special chars | case4 | unicode in reminder |

**integration snapshots (4):**

| snapshot | what it verifies |
|----------|------------------|
| onTalk: normal message | full stderr format |
| onTalk: multiline message | multi-line sub.bucket |
| onTalk: very long message | full message preserved |
| onStop: halt format | halt stderr structure |

**total:** 11 snapshots (7 journey + 4 integration)

**exhaustiveness:**
- positive output cases: covered
- negative cases (empty/malformed): no output → no snapshot needed
- error paths: onStop halt outputs covered at key timesteps
- journey captures contract outputs at critical state transitions

**verdict:** snapshots are exhaustive.

---

## test tree (lines 145-153)

```
src/contract/cli/
├── [○] goal.ts
├── [~] goal.test.ts                       # unit tests for extractPromptFromStdin
├── [+] goal.onTalk.integration.test.ts    # integration tests for hook.onTalk mode
└── [+] goal.journey.integration.test.ts   # journey test: onTalk → onStop flow
```

**conventions check:**
- unit: collocated `.test.ts` — correct
- integration: `.integration.test.ts` suffix — correct
- journey: separate file for multi-hook flow — correct

**verdict:** test tree follows conventions.

---

## test count summary

| test type | file | cases | timesteps |
|-----------|------|-------|-----------|
| unit | goal.test.ts | 5 | 5 |
| integration | goal.onTalk.integration.test.ts | 12 | 20 |
| journey: exhaustive | goal.journey.integration.test.ts | 1 | 13 |
| journey: edge cases | goal.journey.integration.test.ts | 3 | 12 |
| **total** | | **21** | **50** |

**snapshots:** 11 (7 journey + 4 integration)

---

## correction from r7

r7 incorrectly stated: "usecase.2 (onStop): correctly excluded (out of scope)"

this was wrong. the blueprint now declares an exhaustive journey test with 13 timesteps:
- t0-t3: initial asks and first onStop halt
- t4-t7: goal creation and coverage progression
- t8-t12: new asks after goals, incomplete goal state

plus 3 edge case journeys for empty, duplicate, and unicode messages.

the acceptance criteria map (lines 345-356) confirms:
```
| usecase.2: onStop halts on uncovered | extant code (lines 952-964) | goal.journey.integration.test.ts + snapshots |
| usecase.2: onStop silent when covered | extant code | goal.journey.integration.test.ts |
```

**verdict:** usecase.2 is now covered by exhaustive journey tests with 11 snapshots.

---

## reflection

I traced every usecase to its test coverage:

| usecase | test type | coverage | snapshots |
|---------|-----------|----------|-----------|
| usecase.1 | integration | 9 cases | 3 |
| usecase.2 | journey | 13 timesteps + 3 edge cases | 7 |
| usecase.3 | integration | 4 cases | 1 |
| usecase.4 | unit | 5 cases | 0 |
| edge cases | integration + journey | 4 cases | 0 |

all layers have appropriate test types. all usecases have coverage.

**journey test exhaustiveness:**
- 1 exhaustive case with 13 timesteps covers full session lifecycle
- 3 edge case journeys cover empty, duplicate, and unicode messages
- 7 snapshots capture contract outputs at critical state transitions
- 4 integration snapshots capture onTalk/onStop output formats

11 total snapshots cover all contract outputs. no gaps found.

