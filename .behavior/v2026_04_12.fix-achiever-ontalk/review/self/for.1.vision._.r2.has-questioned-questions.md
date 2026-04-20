# self-review r2: has-questioned-questions

I reviewed all open questions in the vision and triaged them.

---

## questions triaged

### 1. does claude code actually pipe stdin to UserPromptSubmit hooks?

**can this be answered via extant docs or code now?**
yes. claude code documentation confirms this.

**answer:**
claude code passes JSON to stdin when UserPromptSubmit fires. the JSON includes:
- `session_id`
- `transcript_path`
- `cwd`
- `permission_mode`
- `hook_event_name`
- `prompt` — the user's message

**status:** [answered]

---

### 2. is the stdin the raw user message or preprocessed?

**can this be answered via extant docs or code now?**
yes. documentation confirms the format.

**answer:**
preprocessed JSON object. the raw message is in the `prompt` field.
extract via: `echo "$INPUT" | jq -r '.prompt'`

**status:** [answered]

---

## vision updated

both questions moved from `[validate]` to `[answered]` in the vision.

the implementation must:
1. read JSON from stdin via `cat`
2. extract prompt via `jq -r '.prompt'`
3. pass the prompt to `setAsk`

---

## residual assumptions

| assumption | holds? | why |
|------------|--------|-----|
| order matters | yes | wish line 120-121 explicitly requires order |
| dedup not needed at write | yes | coverage map handles semantics |

---

## summary

all open questions resolved via documentation. no research phase needed. no wisher input required.

