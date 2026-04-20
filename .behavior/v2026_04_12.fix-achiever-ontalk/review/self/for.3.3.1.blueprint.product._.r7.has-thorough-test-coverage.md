# self-review: has-thorough-test-coverage (r7)

## stone

`3.3.1.blueprint.product`

## verdict

**pass**

---

## methodology

I re-read:
1. the blueprint test coverage section (lines 133-213)
2. the criteria file (2.1.criteria.blackbox.yield.md)
3. traced each criterion to its matched test case

---

## layer coverage trace

### the five codepaths and their layers

| codepath | layer | why this layer |
|----------|-------|----------------|
| `extractPromptFromStdin` | transformer | pure: JSON parse + field extract, no I/O |
| `emitOnTalkReminder` | transformer | pure: string → console.error calls |
| `goalTriageInfer` (onTalk branch) | orchestrator | composes: extract + setAsk + emit |
| `goalTriageInfer` (onStop branch) | orchestrator | composes: getTriageState + emit + halt |
| `goal.triage.infer` CLI | contract | entry point |

### required vs declared test types

| codepath | required | declared | line | status |
|----------|----------|----------|------|--------|
| `extractPromptFromStdin` | unit | unit | 139 | match |
| `emitOnTalkReminder` | unit | integration (via snapshot) | 190-195 | acceptable |
| `goalTriageInfer` | integration | integration | 141 | match |
| CLI contract | integration | integration | 141 | match |

**note on emitOnTalkReminder:** blueprint tests output format via integration snapshot (lines 190-196, 206-213). this covers the transformer's output through the CLI contract. separate unit test would duplicate snapshot coverage. acceptable.

---

## criteria → test case trace

### usecase.1: ask accumulation via onTalk (criteria lines 5-30)

| criterion (line) | test case | blueprint line |
|------------------|-----------|----------------|
| ask appended (11) | case1 t0 | 175 |
| reminder emitted (13) | case1 t1 | 176 |
| exits 0 (15) | case1 t2 | 177 |
| each ask appended in order (19) | case3 t0 | 183-184 |
| duplicate messages separate entries (21) | case4 t0 | 185-186 |
| empty message no ask appended (26) | case2 t0 | 179 |
| empty exits 0 silently (28) | case2 t1 | 180 |

**verdict:** all usecase.1 criteria have matched test cases.

---

### usecase.2: coverage verification via onStop (criteria lines 34-48)

**correction:** the prior version (r6) incorrectly stated usecase.2 was "out of scope."

the blueprint lines 209-249 include journey tests for usecase.2:

| criterion | test case | blueprint line |
|-----------|-----------|----------------|
| uncovered asks enumerated | case1 t0-t2 | 214-217 |
| halts (exit 2) on uncovered | case1 t2 | 216 |
| multiple uncovered enumerated | case2 t0-t2 | 219-222 |
| covered asks = silent exit 0 | case3 t2-t3 | 226-227 |
| mixed coverage halts | case4 t2-t3 | 231-233 |
| incomplete goals enumerated | lines 244-248 | 244-248 |

**why journey tests?** usecase.2 spans two hooks:
1. onTalk accumulates asks
2. onStop verifies coverage

cannot test this flow without journey tests. the blueprint correctly includes `goal.journey.integration.test.ts` with 1 exhaustive case (13 timesteps) + 3 edge case journeys.

**why 13 timesteps?** a real user session goes through many states: send messages, create goals, check coverage, send more messages. if we split this into separate cases we miss state accumulation bugs. one exhaustive journey exercises the full lifecycle.

**verdict:** journey tests cover usecase.2. 7 journey snapshots verify output at critical state transitions.

---

### usecase.3: reminder output format (criteria lines 52-65)

| criterion (line) | test case | blueprint line |
|------------------|-----------|----------------|
| owl header first (57) | case1 t0 | 192 |
| full message shown (59) | case1 t1 | 193 |
| consider prompt present (61) | case1 t2 | 194 |
| triage command shown (63) | case1 t3 | 195 |
| snapshot | snapshot | 196 |

**verdict:** all usecase.3 criteria have matched test cases.

---

### usecase.4: stdin extraction (criteria lines 69-83)

| criterion (line) | test case | blueprint line |
|------------------|-----------|----------------|
| prompt field extracted (74) | case1 t0 | 159-160 |
| extracted prompt used as content (76) | implicit in case1 | via setAsk hash |
| empty stdin exits 0 (81) | case2 t0 | 161-162 |
| malformed exits 0 (81) | case3 t0 | 163-164 |

**verdict:** all usecase.4 criteria have matched test cases.

---

### edge cases (criteria lines 87-103)

| criterion (line) | test case | blueprint line |
|------------------|-----------|----------------|
| very long message in reminder (92) | case1 t0 | 199 |
| very long message in inventory (94) | case1 t1 | 200 |
| special chars hashed correctly (99) | case2 t0 | 202 |
| special chars saved to inventory (101) | case2 t1 | 203 |

**verdict:** all edge case criteria have matched test cases.

---

## snapshot coverage analysis

### blueprint declared snapshots: 11 total (7 journey + 4 integration)

**journey snapshots (7):**

| snapshot | what is captured |
|----------|-----------------|
| [t1] first message | onTalk reminder format |
| [t2] second message | onTalk reminder format |
| [t3] 2 uncovered asks | onStop halt with 2 asks |
| [t5] partial coverage | onStop halt with 1 uncovered |
| [t9] new uncovered | onStop halt with new ask |
| [t11] incomplete goal | onStop halt with incomplete |
| [case4] special chars | unicode in reminder |

**integration snapshots (4):**

| snapshot | what is captured |
|----------|-----------------|
| normal message | output format |
| multiline message | line iteration |
| very long message | no truncation |
| onStop halt format | halt stderr structure |

**total:** 11 snapshots

### snapshot exhaustiveness check

the guide requires "exhaustive for positive and negative cases."

**positive cases:** covered by 11 snapshots (7 journey + 4 integration).

**negative cases:** empty stdin and malformed JSON produce no output (exit 0 silently per criteria lines 28 and 81). no snapshot needed for empty output.

**verdict:** snapshots are exhaustive for cases that produce output.

---

## test tree verification

blueprint test tree (lines 145-153):

```
src/contract/cli/
├── [○] goal.ts
├── [~] goal.test.ts                       # unit tests for extractPromptFromStdin
├── [+] goal.onTalk.integration.test.ts    # integration tests for hook.onTalk mode
└── [+] goal.journey.integration.test.ts   # journey test: onTalk → onStop flow
```

**conventions check:**
- unit tests: collocated with source file (goal.test.ts) — correct
- integration tests: separate file with `.integration.test.ts` suffix — correct
- journey tests: separate file for multi-hook flow — correct
- test files in same directory as source — correct

**verdict:** test tree follows conventions.

---

## test count summary

| test type | cases | individual assertions |
|-----------|-------|----------------------|
| unit (extractPromptFromStdin) | 5 | 5 |
| integration (ask accumulation) | 5 | 9 |
| integration (output format) | 1 | 4 |
| integration (edge cases) | 2 | 4 |
| journey (1 exhaustive + 3 edge) | 4 | 13 timesteps + edge cases |
| snapshots | 11 | 11 (7 journey + 4 integration) |

**total:** 17 test cases, 11 snapshots, exhaustive coverage.

---

## reflection

I traced every criterion from 2.1.criteria.blackbox.yield.md to its matched test case in the blueprint. all criteria are covered:

- usecase.1 (ask accumulation): 7 criteria → integration test cases
- usecase.2 (onStop coverage): 6 criteria → 1 exhaustive journey (13 timesteps) + 3 edge case journeys + 7 snapshots
- usecase.3 (output format): 4 criteria → 4 test cases + 4 integration snapshots
- usecase.4 (stdin extraction): 4 criteria → 5 unit test cases
- edge cases: 4 criteria → 4 test cases

layer coverage is appropriate:
- transformers: unit tests
- orchestrators: integration tests
- contracts: integration + journey tests
- onTalk → onStop flow: 1 exhaustive journey (13 timesteps) exercises full session lifecycle

total: 11 snapshots (7 journey + 4 integration) capture contract outputs at critical state transitions.

no gaps found in test coverage.

