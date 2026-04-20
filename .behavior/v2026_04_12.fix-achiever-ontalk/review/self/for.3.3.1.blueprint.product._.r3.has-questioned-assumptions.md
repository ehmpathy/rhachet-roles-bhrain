# self-review: has-questioned-assumptions (r3)

## stone

`3.3.1.blueprint.product`

## verdict

**pass**

---

## methodology

I read through the blueprint and identified every technical assumption. for each, I asked: "what if this were wrong?"

---

## assumptions identified and questioned

### 1. stdin contains JSON with a `prompt` field

**the assumption:** Claude Code pipes JSON with a `prompt` field to UserPromptSubmit hooks.

**what if wrong?**
- Claude Code could change the field name
- user could invoke skill directly without stdin
- malformed JSON could be piped

**why it holds:** the blueprint handles all cases:
- `extractPromptFromStdin` returns null on malformed JSON
- returns null if `prompt` field is absent or not a string
- hook.onTalk branch exits 0 silently on null
- no crash, no halt, graceful degradation

**evidence:** Claude Code documentation and the extant shell hook pattern.

---

### 2. readStdin() works for hook use case

**the assumption:** the extant `readStdin()` function can read hook stdin.

**what if wrong?**
- could timeout before data arrives
- could miss data if stdin is slow

**why it holds:**
- research verified readStdin at lines 474-491 in goal.ts
- uses `execSync('cat')` with 100ms timeout
- handles TTY detection (returns empty string for interactive)
- handles timeout via error catch (returns empty string)
- hooks receive stdin synchronously before invocation - no race

**evidence:** extant hook.onStop uses same pattern successfully.

---

### 3. setAsk is the correct domain operation

**the assumption:** `setAsk` accumulates asks correctly.

**what if wrong?**
- could miss hash computation
- could write wrong format
- could not create directory

**why it holds:**
- research verified setAsk at src/domain.operations/goal/setAsk.ts
- computes SHA256 hash from content
- creates directory with `fs.mkdir({ recursive: true })`
- appends JSON line to asks.inventory.jsonl
- matches wish requirements exactly

**evidence:** research citation [3] in `3.1.3.research.internal.product.code.prod._.yield.md`.

---

### 4. stderr is correct output channel

**the assumption:** hook output should go to stderr, not stdout.

**what if wrong?**
- Claude Code might not show stderr
- output might be lost

**why it holds:**
- extant hook.onStop uses stderr (console.error)
- Unix convention: stderr for diagnostics, stdout for data
- Claude Code shows stderr as hook feedback
- consistent with codebase patterns

**evidence:** research citation [7] shows hook.onStop uses console.error.

---

### 5. exit 0 means "continue, don't halt"

**the assumption:** exit code 0 tells Claude Code to continue.

**what if wrong?**
- could halt on 0
- could ignore exit code

**why it holds:**
- Unix convention: 0 = success, non-zero = error
- extant shell hook ends with `exit 0`
- wish explicitly says "exit 0 (never halt)"
- hook.onStop uses exit 2 to halt - different codes mean different things

**evidence:** wish document line that specifies exit 0.

---

### 6. synchronous stdin read is acceptable

**the assumption:** a block on stdin is OK for a hook.

**what if wrong?**
- could block forever
- could degrade performance

**why it holds:**
- hooks run once and exit
- not a long-active server
- stdin is already available when hook starts
- 100ms timeout prevents infinite block
- empty stdin returns empty string, not error

**evidence:** extant readStdin implementation with timeout.

---

### 7. scopeDir will be created if absent

**the assumption:** setAsk creates the directory.

**what if wrong?**
- could fail on first run
- could need manual setup

**why it holds:**
- setAsk calls `fs.mkdir(input.scopeDir, { recursive: true })`
- verified in research citation [3]
- no manual setup required

**evidence:** setAsk source code.

---

### 8. onStop reads asks from correct inventory

**the assumption:** onStop reads asks.inventory.jsonl to verify coverage.

**what if wrong?**
- could read from wrong file
- could miss asks from onTalk

**why it holds:**
- onTalk writes to `asks.inventory.jsonl` via setAsk
- onStop reads from same file via `getTriageState`
- same scopeDir used by both hooks
- journey tests verify the flow end-to-end

**evidence:** extant onStop code at lines 952-964 in goal.ts.

---

### 9. onStop halt behavior is correct

**the assumption:** onStop halts (exit 2) when uncovered asks exist.

**what if wrong?**
- could fail silently
- could not enumerate asks

**why it holds:**
- extant code verified in research
- lines 952-964 show the halt logic
- journey tests verify this behavior with snapshots

**evidence:** research citation [7] and extant code.

---

### 10. exhaustive journey test can verify multi-hook flow

**the assumption:** an exhaustive 13-timestep journey test can verify the full session lifecycle.

**what if wrong?**
- state might not persist between invocations
- temp directory might be cleared
- 13 timesteps might be overkill

**why it holds:**
- test pattern uses shared temp directory
- onTalk writes to `.goals/$branch/asks.inventory.jsonl`
- onStop reads from same path
- each timestep verifies state before it continues
- 13 timesteps cover: initial asks, coverage progression, new asks after goals, incomplete goals

**why 13 timesteps?**
- a real user session goes through many states
- if we split into separate cases we miss state accumulation bugs
- one exhaustive journey exercises the full lifecycle

**evidence:** research citation [1] in test research: temp directory pattern.

---

## no issues found

all 10 assumptions have evidence and graceful error case treatment.

---

## reflection

the blueprint makes assumptions based on research:

**for onTalk:**
- stdin format documented by Claude Code
- extant patterns (readStdin, setAsk, stderr output) proven
- error cases return null and exit 0

**for onStop:**
- extant halt behavior verified in research
- lines 952-964 show the logic
- exhaustive journey test provides end-to-end verification

**for tests:**
- temp directory pattern proven in extant tests
- exhaustive 13-timestep journey tests full session lifecycle
- 3 edge case journeys cover empty, duplicate, unicode
- 11 snapshots verify contract outputs

all assumptions verified. no issues found.
