# self-review: has-questioned-deletables (r3)

## stone

`3.3.1.blueprint.product`

## verdict

**pass with simplification**

---

## deep review

I paused. I re-read the blueprint. I asked: what can be deleted?

---

## found: emitSubBucketStderr can be inlined

### the question

`emitSubBucketStderr` is an 8-line function called once by `emitOnTalkReminder`. is the abstraction worth it?

### the analysis

**if I keep it separate:**
- 2 functions (emitSubBucketStderr + emitOnTalkReminder)
- 8 + 11 = 19 lines
- unit tests for emitSubBucketStderr (2 test cases)
- separate testability

**if I inline it:**
- 1 function (emitOnTalkReminder with sub.bucket inlined)
- 17 lines
- integration test snapshot covers the output
- one less function to name, export, test

### the decision criteria

> "if we deleted this and had to add it back, would we?"

when would we need a standalone `emitSubBucketStderr`?
- another hook mode that emits to stderr
- but onStop uses stdout, not stderr
- no other modes are planned

**answer: no**, we would not add it back. the abstraction exists "just in case" — that violates rule.prefer.wet-over-dry.

### the verdict

**delete `emitSubBucketStderr`** and inline the sub.bucket output in `emitOnTalkReminder`.

---

## components retained

### extractPromptFromStdin

**can it be deleted?** no.

**why?** it encapsulates stdin JSON parse logic. 5 unit test cases justify separate function:
- valid JSON with prompt
- empty stdin
- malformed JSON
- JSON without prompt field
- prompt is empty string

these tests run faster as unit tests than as integration tests. the abstraction pays for itself.

### emitOnTalkReminder

**can it be deleted?** no.

**why?** 17 lines of console.error calls. extraction from goalTriageInfer keeps the main function readable.

### mode type union

**can it be deleted?** no.

**why?** required to recognize `--when hook.onTalk`. one-line change.

### hook.onTalk branch

**can it be deleted?** no.

**why?** this IS the implementation. deletion removes the feature.

---

## blueprint update required

the changes to `3.3.1.blueprint.product.yield.md`:

1. remove `emitSubBucketStderr` from codepath tree
2. remove `emitSubBucketStderr` function definition from "new functions"
3. update `emitOnTalkReminder` to include inlined sub.bucket
4. remove unit tests for `emitSubBucketStderr` from test tree

---

## fix applied

all 4 changes made to `3.3.1.blueprint.product.yield.md`:

1. **codepath tree**: updated `emitOnTalkReminder` to show inlined sub.bucket lines instead of `emitSubBucketStderr(content, '   │  ')`

2. **new functions section**: removed entire `emitSubBucketStderr` function definition (14 lines deleted)

3. **emitOnTalkReminder function**: expanded from 11 lines to 17 lines with inlined sub.bucket loop

4. **test tree**: changed `goal.test.ts` comment from "add unit tests for extractPromptFromStdin, emitSubBucketStderr" to "add unit tests for extractPromptFromStdin"

5. **execution order**: reduced from 8 steps to 7 steps, removed "add emitSubBucketStderr function" step

---

## test files questioned

### goal.onTalk.integration.test.ts

**can it be deleted?** no.

**why?** criteria usecase.1 requires integration tests for ask accumulation. this file tests the hook.onTalk mode in isolation.

**can it be merged into goal.test.ts?** questioned. but goal.test.ts is for unit tests of extractPromptFromStdin. integration tests should be separate by convention.

### goal.journey.integration.test.ts

**can it be deleted?** questioned.

**alternative:** could usecase.2 be tested in goal.onTalk.integration.test.ts?

**answer:** no. journey tests verify the flow across multiple hook invocations:
1. onTalk accumulates asks
2. onStop verifies coverage
3. onStop halts if uncovered

this flow cannot be tested with a single hook invocation. the journey tests exist because the behavior requires multi-step verification.

**why an exhaustive 13-timestep journey?**

the journey test has 1 exhaustive case with 13 timesteps plus 3 edge case journeys. a real user session goes through many states: send messages, create goals, check coverage, send more messages. if we split this into separate cases we would miss state accumulation bugs. one exhaustive journey exercises the full lifecycle.

| timestep range | what it tests | deletable? |
|----------------|---------------|------------|
| t0-t3 | initial asks and first onStop halt | no |
| t4-t7 | goal creation and coverage progression | no |
| t8-t12 | new asks after goals, incomplete goal state | no |

**edge case journeys:**

| case | what it tests | deletable? |
|------|---------------|------------|
| case2 | empty/malformed messages | no - silent skip behavior |
| case3 | duplicate messages | no - same hash coverage |
| case4 | special chars and unicode | no - hash and display |

all timesteps and edge cases test distinct state transitions. none are redundant.

### snapshot coverage

**can any snapshots be deleted?**

I examined each snapshot in the blueprint:

**journey snapshots (7):**

| snapshot | deletable? | reason |
|----------|------------|--------|
| [t1] first message | no | onTalk reminder format |
| [t2] second message | no | onTalk reminder format |
| [t3] 2 uncovered asks | no | onStop halt with 2 asks |
| [t5] partial coverage | no | onStop halt with 1 uncovered |
| [t9] new uncovered | no | onStop halt with new ask |
| [t11] incomplete goal | no | onStop halt with incomplete |
| [case4] special chars | no | unicode in reminder |

**integration snapshots (4):**

| snapshot | deletable? | reason |
|----------|------------|--------|
| normal message | no | criteria usecase.3: output format |
| multiline message | no | verifies line iteration |
| very long message | no | verifies no truncation |
| onStop halt format | no | halt stderr structure |

all 11 snapshots (7 journey + 4 integration) are distinct. each captures a unique contract output.

---

## reflection

self-review found one deletable component. `emitSubBucketStderr` was inlined.

the journey tests and snapshots were questioned but retained:
- 1 exhaustive case with 13 timesteps tests full session lifecycle
- 3 edge case journeys test empty, duplicate, unicode messages
- 11 snapshots (7 journey + 4 integration) verify distinct contract outputs
- no redundancy found

the blueprint is now simpler:
- 2 new functions instead of 3
- exhaustive journey test covers full user session from first message to completion
- snapshots capture contract outputs at critical state transitions
