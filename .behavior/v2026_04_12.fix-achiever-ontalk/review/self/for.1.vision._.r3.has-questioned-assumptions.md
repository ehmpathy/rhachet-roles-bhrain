# self-review r3: has-questioned-assumptions (original vision comparison)

I compared the fix vision against the original v2026_04_02 vision and found discrepancies.

---

## discrepancies found

### 11. CLI arg format: `--from --when` (aligned after rebase)

**what the original vision says (line 402):**
```
🔮 goal.triage.infer --from peer --when hook.onTalk
```

**what the fix vision says:**
```
🔮 goal.triage.infer --from peer --when hook.onTalk
```

**what the current code uses:**
the shell entrypoint calls `goal.triage.infer --when hook.onTalk`

**assessment:**
after rebase onto v0.25.1, the CLI now uses `--when` flag (was `--mode`). the fix vision matches the original vision.

**verdict:** aligned. no deviation.

---

### 12. message truncation (fixed to match original)

**what the original vision says (line 407):**
```
│  │  fix the flaky test and update the readme
```
shows full message, no truncation mention.

**what the fix vision says (line 84):**
```
│  │  {the user's message}
```
shows full message, matches original.

**assessment:**
initially added truncation but removed it to match original exactly. full message required because compaction could lose conversation context.

**verdict:** aligned. no truncation.

---

### 13. output on every message could be noisy

**what the original vision implies:**
the hook fires on every message and emits 10+ lines of output.

**what if this is too noisy?**
- brain sees this on every single user message
- could distract
- original vision didn't consider message volume

**did the wisher address this?**
no. the wish says "just remind it" (line 93-94) which suggests brevity.

**verdict:** potential issue. consider whether the full treestruct output is needed or if a shorter reminder would suffice. the original vision shows full format, so keep it, but this might need adjustment based on user feedback.

---

## summary of all issues across r1, r2, r3

| issue | status | action |
|-------|--------|--------|
| requirements all hold | r1 | no change |
| stdin assumption needs validation | r1/r2 | answered via docs |
| empty messages should skip | r2 | vision fixed |
| `--when` flag aligned after rebase | r3 | no deviation |
| no truncation (full message) | r3 | matches original |
| output might be noisy | r3 | keep for now, tune later |

---

## conclusion

the fix vision is fully aligned with the original vision after rebase:
1. `--when hook.onTalk` matches original spec
2. full message shown (no truncation) since compaction could lose context
3. empty asks skipped instead of saved (bug fix)

the vision is ready to proceed.
