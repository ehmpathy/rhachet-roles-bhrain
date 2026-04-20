# self-review r3: has-questioned-questions (deep triage)

I went through the vision line by line to find every question, assumption, and uncertainty. Then I triaged each one.

---

## the two explicit questions

### question 1: does claude code actually pipe stdin to UserPromptSubmit hooks?

**triage method:** can this be answered via extant docs or code now?

**research conducted:**
- spawned claude-code-guide agent to check documentation
- agent found: https://code.claude.com/docs/en/hooks.md
- agent found: https://code.claude.com/docs/en/hooks-guide.md

**finding:**
yes. claude code passes a JSON object to stdin when UserPromptSubmit fires:

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/session.jsonl",
  "cwd": "/working/dir",
  "permission_mode": "default",
  "hook_event_name": "UserPromptSubmit",
  "prompt": "the user's message"
}
```

**why this matters:**
the implementation cannot just `cat` stdin and pass it to `setAsk`. it must:
1. read the JSON
2. extract the `prompt` field via `jq -r '.prompt'`
3. pass the extracted prompt to the cli

**status:** [answered] — resolved via documentation

---

### question 2: is the stdin the raw user message or preprocessed?

**triage method:** can this be answered via extant docs or code now?

**research conducted:**
same claude-code-guide agent answered both questions from docs

**finding:**
preprocessed. the message is wrapped in a JSON envelope. the raw message is in the `prompt` field.

**why this matters:**
- if we assumed raw text, we'd hash the entire JSON envelope
- that would mean the same message with different session_ids would hash differently
- by extracting `prompt`, we hash only the user's actual words

**status:** [answered] — resolved via documentation

---

## implicit questions I found by re-read

### question 3: what happens if jq is not installed?

**triage method:** can this be answered via logic now?

**answer:**
jq is a standard tool in most unix environments and is installed in the rhachet dev environment. if not present, the shell command will fail loudly — this is acceptable fail-fast behavior.

**mitigation:**
the shell entrypoint should exit non-zero if jq extraction fails, which it will naturally do.

**status:** [answered] — acceptable failure mode

---

### question 4: what if the JSON is malformed?

**triage method:** can this be answered via logic now?

**answer:**
if claude code sends malformed JSON, `jq` will exit non-zero and the prompt will be empty. the implementation should check for empty prompt and skip (as the vision specifies for empty messages).

**why this matters:**
the empty-message-skip behavior handles both:
- user sent blank message
- jq failed to extract prompt

**status:** [answered] — covered by empty message handling

---

### question 5: should we log failed extractions?

**triage method:** does only the wisher know the answer?

**answer:**
no, this can be answered via logic. the original vision says "does NOT halt brain if inflight." a failed extraction should not halt the brain. it should log to stderr and exit 0.

**status:** [answered] — non-halt requirement implies graceful degradation

---

## questions moved from [validate] to [answered]

in the vision, I updated:

| before | after |
|--------|-------|
| `[validate]` does claude code pipe stdin? | `[answered]` yes, JSON with `prompt` field |
| `[validate]` raw or preprocessed? | `[answered]` preprocessed JSON |

---

## no questions require research or wisher input

| category | count | items |
|----------|-------|-------|
| [answered] | 5 | all questions above |
| [research] | 0 | none |
| [wisher] | 0 | none |

---

## implementation implications

the shell entrypoint must be updated:

**before (assumed raw text):**
```bash
rhx goal.triage.infer --when hook.onTalk
```

**after (extract from JSON):**
```bash
INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty')
if [ -n "$PROMPT" ]; then
  echo "$PROMPT" | rhx goal.triage.infer --when hook.onTalk
fi
```

this change flows from the answered questions.

---

## summary

all questions triaged to [answered]. no external research needed. no wisher input needed.

the triage revealed that the implementation must extract the `prompt` field from the JSON envelope — this was not obvious from the original vision but is now documented.

