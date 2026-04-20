# self-review: has-questioned-deletables (r2)

## stone

`3.3.1.blueprint.product`

## verdict

**pass**

---

## methodology

I examined each function, test file, and test case in the blueprint. for each, I asked:
- does this trace to a requirement?
- can this be deleted?
- what is the simplest version?

---

## features questioned

### extractPromptFromStdin

**can it be deleted?** no.

**traceability:** criteria usecase.4 requires stdin JSON read and prompt field extraction.

**why it must exist:** Claude Code pipes JSON to stdin with a `prompt` field. without extraction, we cannot get the user's message content.

**simplest version:** the blueprint specifies the minimal implementation — read, parse, extract, return. no extra validation or transformation.

---

### emitSubBucketStderr

**can it be deleted?** questioned, but no.

**traceability:** criteria usecase.3 specifies "full message content is shown" in a treestruct format.

**why not reuse extant emitSubBucket?** the extant function uses `console.log` (stdout). hooks must emit to stderr. to parameterize the extant function would require signature changes that could break other callers.

**simplest version:** a separate function that mirrors `emitSubBucket` but uses `console.error`. 8 lines total.

---

### emitOnTalkReminder

**can it be deleted?** no.

**traceability:** criteria usecase.3 specifies the exact output format with owl header, ask content, and consider prompt.

**why not inline in goalTriageInfer?** clarity. the reminder output is 11 lines of console.error calls. extraction keeps the main function readable.

**simplest version:** direct console.error calls with no intermediate string construction.

---

### mode type union update

**can it be deleted?** no.

**traceability:** criteria usecase.1 requires `--when hook.onTalk` to be recognized.

**simplest version:** add one string literal to the union type. minimal change.

---

### hook.onTalk branch

**can it be deleted?** no.

**traceability:** this IS the main implementation. usecase.1 defines it.

**simplest version:** 5 lines in the branch — extract prompt, check empty, call setAsk, emit reminder, return.

---

## components questioned

### why three separate functions instead of one?

**questioned:** could `emitOnTalkReminder` inline `emitSubBucketStderr`?

**answer:** separate functions allow `emitSubBucketStderr` to be reused if other modes need stderr sub.buckets. but more importantly, separation keeps each function under 15 lines. readable units.

**verdict:** keep separate.

---

### why not modify emitSubBucket to accept an output parameter?

**questioned:** could we add `output: 'stdout' | 'stderr'` to the extant function?

**answer:** this would require:
1. extant function signature modification
2. update of all extant callers (if any pass explicit args)
3. conditional added in the function body

for a function used in one new place, this is over-engineered. a separate 8-line function is simpler.

**verdict:** keep separate stderr variant.

---

## test files questioned

### goal.onTalk.integration.test.ts

**can it be deleted?** no.

**traceability:** criteria usecase.1 (ask accumulation) requires integration tests.

**why a separate file?** hook.onTalk mode is a distinct behavior from extant modes. separate file keeps tests focused.

---

### goal.journey.integration.test.ts

**can it be deleted?** questioned, but no.

**traceability:** criteria usecase.2 (coverage verification) requires end-to-end verification of onTalk → onStop flow.

**why journey tests?** unit tests verify functions in isolation. integration tests verify modes in isolation. journey tests verify the full flow: onTalk accumulates asks, onStop verifies coverage. this flow cannot be tested without journey tests.

**why 13 timesteps in one case?** a real user session goes through many states: send messages, create goals, check coverage, send more messages. if we split this into separate cases we would miss state accumulation bugs. one exhaustive journey exercises the full lifecycle.

**simplest version:** 1 exhaustive journey case with 13 timesteps + 3 edge case journeys:
- t0-t3: initial asks and first onStop halt
- t4-t7: goal creation and coverage progression
- t8-t12: new asks after goals, incomplete goal state
- edge cases: empty, duplicate, unicode messages

---

### snapshot coverage

**can snapshots be deleted?** questioned each.

| snapshot | traceability | deletable? |
|----------|-------------|------------|
| journey: [t1] first message | usecase.1: reminder format | no |
| journey: [t2] second message | usecase.1: reminder format | no |
| journey: [t3] 2 uncovered asks | usecase.2: halt output | no |
| journey: [t5] partial coverage | usecase.2: halt output | no |
| journey: [t9] new uncovered | usecase.2: halt output | no |
| journey: [t11] incomplete goal | usecase.2: halt output | no |
| journey: [case4] special chars | usecase.1: unicode support | no |
| integration: normal message | criteria usecase.3: output format | no |
| integration: multiline message | criteria usecase.3: full message | no |
| integration: very long message | criteria usecase.3: full message | no |
| integration: onStop halt | criteria usecase.2: halt output | no |

11 snapshots total (7 journey + 4 integration). all trace to criteria. none are decorative.

---

## deletions made

none. all components trace to requirements.

---

## why it holds

the blueprint specifies the minimum viable implementation:
- one mode branch (required by wish)
- three small functions (each < 15 lines)
- two new test files (one integration, one journey)
- 11 snapshots (7 journey + 4 integration, all trace to criteria)
- 13 journey timesteps (full session lifecycle)
- 3 edge case journeys (empty, duplicate, unicode)
- zero new dependencies
- zero changes to extant behavior

every component traces to a criterion. no component was added "just in case".
