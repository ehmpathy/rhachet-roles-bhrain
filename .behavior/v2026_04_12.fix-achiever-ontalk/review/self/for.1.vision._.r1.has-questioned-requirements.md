# self-review: has-questioned-requirements

## requirements questioned

### 1. must accumulate asks via `setAsk`

**who said this was needed?**
the original vision (`v2026_04_02.feat-achiever/1.vision.md` lines 82-86, 95-98) explicitly specified this behavior.

**what evidence supports this?**
- `setAsk` already exists with full integration tests
- the vision describes the exact jsonl format and hash semantics
- `getTriageState` already reads from `asks.inventory.jsonl`

**what if we didn't do this?**
- `onStop` triage would have no asks to check coverage against
- the goal system would be incomplete — goals without asks to cover
- the "no ask forgotten" promise would be broken

**verdict:** requirement holds. this is the core gap that broke the feature.

---

### 2. must read stdin

**who said this was needed?**
the vision implies it (lines 82-86: "fires when peer sends message"). UserPromptSubmit hooks receive stdin.

**what if we didn't do this?**
- we'd have no content to hash and save
- the ask would be empty

**could we achieve this simpler?**
- we could hardcode a placeholder, but that defeats the purpose
- we could read from conversation context, but stdin is the direct source

**verdict:** requirement holds. stdin is the natural source.

---

### 3. must emit reminder to stderr

**who said this was needed?**
original vision lines 399-414 show the exact output format.

**what if we didn't do this?**
- the brain wouldn't be reminded to consider goal impact
- still functional, but less aligned with vision

**is the scope too large?**
the output format in the vision is 10+ lines. this might be noisy on every message.

**could we simplify?**
- shorter reminder? yes, but would deviate from vision
- no reminder at all? breaks the "remind but don't halt" contract

**verdict:** requirement holds, but consider truncating long messages in display.

---

### 4. must exit 0 (not halt)

**who said this was needed?**
vision line 85: "does NOT halt brain if inflight"

**what if we didn't do this?**
- brain would halt on every message waiting for triage
- workflow would be unusable

**verdict:** requirement holds. this is non-negotiable.

---

### 5. must not change extant onStop behavior

**who said this was needed?**
implicit — we're fixing onTalk, not rewriting onStop.

**what if we didn't do this?**
- could break the working triage flow
- regression in shipped feature

**verdict:** requirement holds. don't break what works.

---

## scope assessment

**is scope too large?**
no. we're wiring up one function call (`setAsk`) and adding one mode handler.

**is scope too small?**
no. we're completing the feature as specified.

**is scope misdirected?**
no. the gap is clear: `setAsk` exists but isn't called. we're connecting the dots.

---

## simpler alternatives considered

1. **save asks in the shell entrypoint instead of CLI** — would duplicate hash logic, violate single responsibility

2. **skip the reminder, just save** — would work, but deviates from vision

3. **don't save, just remind** — would not solve the coverage verification problem

**conclusion:** the proposed implementation is the simplest path that fulfills the vision.

---

## summary

all requirements hold. the scope is appropriate. no simpler alternative achieves the goal.

the fix is: add `hook.onTalk` mode to `goalInferTriage` that reads stdin, calls `setAsk`, emits reminder, exits 0.
