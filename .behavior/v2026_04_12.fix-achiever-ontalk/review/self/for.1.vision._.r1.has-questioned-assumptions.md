# self-review: has-questioned-assumptions

## assumptions surfaced and questioned

### 1. claude code pipes user message to stdin

**what do we assume?**
that UserPromptSubmit hooks receive the user's message via stdin.

**what evidence supports this?**
- claude code hooks documentation
- the hook is named "UserPromptSubmit" which implies it receives the prompt

**what if the opposite were true?**
- if stdin is empty, we'd save empty asks
- the hash would still be computed (empty string has valid hash)
- coverage verification would work, but asks would be meaningless

**did the wisher say this?**
no, the original vision implied it but didn't explicitly verify.

**verdict:** assumption needs validation. added to open questions in vision. if stdin is empty, we should detect and skip rather than save empty asks.

**fix applied:** added validation question in vision. implementation should handle empty stdin gracefully.

---

### 2. order of asks matters

**what do we assume?**
that we must preserve insertion order in jsonl.

**what evidence supports this?**
- original vision lines 95-98: "in order of receipt"
- original wish lines 120-121: "critical that we collect the asks in order"

**what if the opposite were true?**
- if order didn't matter, we could use a set instead of jsonl
- but the wish explicitly says order helps diagnose abandoned/changed asks

**did the wisher say this?**
yes, explicitly in the wish.

**verdict:** assumption holds. order is explicitly required.

---

### 3. deduplication not needed at write time

**what do we assume?**
that same message sent twice should create two entries (not deduplicated).

**what evidence supports this?**
- coverage map handles the semantics of which asks are covered
- inventory is a raw log, not a unique set

**what if the opposite were true?**
- if we deduplicated at write, repeated messages would be lost
- user says "fix the test" twice → only one entry
- could lose context about when an ask was re-emphasized

**did the wisher say this?**
implied. the coverage map design assumes inventory can have duplicates.

**verdict:** assumption holds. raw log is the right model.

---

### 4. reminder output format matches original vision

**what do we assume?**
that the stdout journey format in `v2026_04_02.feat-achiever/1.vision.md` lines 399-414 is the correct format.

**what evidence supports this?**
- it's in the original vision specification
- it follows the treestruct output pattern used elsewhere

**what if the opposite were true?**
- we could use a shorter format
- but to deviate from vision without wisher input is risky

**did the wisher say this?**
yes, the format is explicitly specified in the vision.

**verdict:** assumption holds. follow the specified format.

---

### 5. UserPromptSubmit is the correct hook type

**what do we assume?**
that UserPromptSubmit fires when the human sends a message.

**what evidence supports this?**
- hook name suggests it fires on prompt submission
- the shell entrypoint is named `userpromptsubmit.ontalk.sh`

**what if the opposite were true?**
- if it fired at wrong time, we'd capture wrong content
- but the hook type is already chosen and the shell file exists

**did the wisher say this?**
implied by "onTalk" terminology in original vision.

**verdict:** assumption holds. hook type is correct.

---

## summary of findings

| assumption | status | action |
|------------|--------|--------|
| stdin contains message | needs validation | handle empty stdin gracefully |
| order matters | holds | no change |
| no dedup at write | holds | no change |
| output format | holds | follow vision spec |
| UserPromptSubmit hook | holds | no change |

one assumption needs validation (stdin content). the vision already includes this as an open question. implementation should handle the edge case of empty stdin.
