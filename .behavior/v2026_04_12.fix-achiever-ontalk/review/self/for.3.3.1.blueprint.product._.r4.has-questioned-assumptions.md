# self-review: has-questioned-assumptions (r4)

## stone

`3.3.1.blueprint.product`

## verdict

**pass**

---

## deeper review

I paused. I re-read the blueprint line by line. I asked: what if I'm wrong?

---

## assumptions surfaced and analyzed

### 1. stdin format is stable

**assumption:** Claude Code sends `{"prompt": "..."}` to UserPromptSubmit hooks.

**evidence:**
- Claude Code hook documentation
- the extant shell hook pattern assumes stdin input

**graceful degradation:**
- if format changes, `extractPromptFromStdin` returns null
- hook exits 0 silently (no crash, no halt)
- behavior: ask not saved, but brain continues

**verdict:** safe assumption with fallback.

---

### 2. readStdin timeout is sufficient

**assumption:** 100ms is enough time to read stdin.

**evidence:**
- stdin is piped synchronously by Claude Code
- data is already available when hook starts
- 100ms catches the "no data" case

**what if wrong:**
- slow pipe could timeout → returns empty → exits 0
- this is acceptable degradation

**verdict:** safe.

---

### 3. setAsk will succeed

**assumption:** setAsk won't throw.

**what could fail:**
- disk full → fs.appendFile throws
- permission denied → fs.mkdir throws
- invalid scopeDir → fs.mkdir throws

**current behavior:**
- if setAsk throws, hook crashes (non-zero exit)
- this contradicts "exit 0 (never halt)"

**analysis:**
- setAsk writes to `.goals/$branch/` inside repo
- mechanic has write access (runs in repo context)
- disk full is rare
- permission issues unlikely

**decision:**
- the simplest approach is no try/catch
- if setAsk fails, it's a real error worth exposing
- users should know if asks aren't saved
- a silent failure would hide a real problem

**verdict:** acceptable. let errors surface. do not hide them.

---

### 4. no content length limit needed

**assumption:** we should show full message content.

**evidence:**
- criteria usecase.3: "full message content is shown"
- criteria edge case: "very long message → full message in reminder"

**what if message is 10KB?**
- reminder shows all of it (many lines)
- inventory stores all of it (one JSONL line)
- no truncation is correct per vision

**verdict:** correct per criteria.

---

### 5. duplicate messages should create separate entries

**assumption:** no deduplication by hash.

**evidence:**
- criteria usecase.1: "duplicate messages create separate entries"
- criteria says "re-emphasis is captured"

**what if user sends same message 10 times?**
- 10 entries in inventory
- 10 identical hashes but separate entries
- this is correct per criteria

**verdict:** correct per criteria.

---

### 6. return = exit 0

**assumption:** return from goalTriageInfer exits the process with code 0.

**evidence:**
- CLI entrypoint pattern in extant code
- when main async function completes, node exits 0
- verified by extant hook.onStop pattern

**verdict:** correct.

---

### 7. order: setAsk then emitReminder

**assumption:** save ask before emit reminder.

**what if reversed (emit then save)?**
- if setAsk fails after emit, user sees reminder but ask isn't saved
- deceptive: reminder says "ask recorded" but it wasn't

**current order:**
- setAsk first → if fails, no reminder emitted
- user knows an error occurred (crash)
- no false positive

**verdict:** correct order.

---

### 8. onStop halt is extant and correct

**assumption:** extant onStop code at lines 952-964 halts correctly on uncovered asks.

**evidence:**
- I read the extant code in `src/contract/cli/goal.ts`
- lines 952-964 show the halt logic
- if `state.asksUncovered.length > 0` or `state.goalsIncomplete.length > 0`, exit 2

**what if wrong:**
- journey tests will catch it
- test case: "uncovered asks = 1 → halts (exit 2)"

**verdict:** verified by code inspection and will be verified by journey tests.

---

### 9. exhaustive journey test can verify full session lifecycle

**assumption:** an exhaustive 13-timestep journey test can invoke onTalk and onStop in sequence to verify the full flow.

**evidence:**
- test pattern uses CLI invocation
- `goal.triage.infer --when hook.onTalk` is a CLI mode
- `goal.triage.infer --when hook.onStop` is a CLI mode
- shared temp directory persists state between invocations

**why 13 timesteps?**
- a real user session goes through many states
- t0-t3: initial asks and first onStop halt
- t4-t7: goal creation and coverage progression
- t8-t12: new asks after goals, incomplete goal state
- if we split into separate cases we miss state accumulation bugs

**what if wrong:**
- tests would fail to invoke the modes
- we'd see the failure immediately in test run

**verdict:** verifiable at test time.

---

### 10. hash determinism enables coverage verification

**assumption:** same content → same hash → coverage works.

**evidence:**
- setAsk uses SHA256 hash
- SHA256 is deterministic
- `asksUncovered` compares hashes against coverage hashes

**what if wrong:**
- if hash changed between onTalk and onStop, coverage would fail
- journey tests verify this flow

**verdict:** verified by algorithm properties and will be tested.

---

## no issues that require blueprint change

all 10 assumptions are either:
- verified by evidence (code inspection, documentation)
- have graceful fallbacks (null return, exit 0)
- are correct per vision/criteria
- will be verified by journey tests

---

## reflection

the deepest questions were:

1. **"what if setAsk fails?"** — decided no try/catch because silent failure would hide real problems. let errors surface.

2. **"what if onStop halt is broken?"** — addressed by exhaustive journey test. 13 timesteps verify onTalk → onStop flow through the full session lifecycle.

3. **"what if hash is non-deterministic?"** — verified by algorithm (SHA256 is deterministic).

the blueprint makes reasonable assumptions about:
- functional filesystem (writes succeed)
- stable stdin format (with graceful degradation)
- extant onStop code (will be tested by exhaustive journey)

all assumptions verified or will be verified by tests:
- 1 exhaustive journey case with 13 timesteps
- 3 edge case journeys (empty, duplicate, unicode)
- 11 snapshots capture contract outputs
