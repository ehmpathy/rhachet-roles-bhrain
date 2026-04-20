# self-review r2: has-questioned-assumptions (deeper pass)

I read the vision line by line again and found additional hidden assumptions.

---

## additional assumptions surfaced

### 6. empty messages should be saved (line 152)

**what do we assume?**
that empty string messages should be hashed and saved like any other ask.

**what evidence supports this?**
none explicit. the vision just says "empty string has valid hash."

**what if the opposite were true?**
- empty message = user hit enter accidentally
- saves pollute the inventory with noise
- coverage map would need to cover meaningless asks

**did the wisher say this?**
no. this was inferred.

**verdict:** assumption is WRONG. empty stdin should be detected and skipped. no point in stored empty asks.

**fix required:** update vision to say "empty message: skip (no meaningful ask)". update implementation to detect and skip empty stdin.

---

### 7. 100 chars is the right truncation (line 84)

**what do we assume?**
that 100 characters is the right length for display truncation.

**what evidence supports this?**
none. the number 100 was arbitrary.

**what if the opposite were true?**
- 50 chars might be too short (lose context)
- 200 chars might be too long (noisy output)
- no truncation might overwhelm the output

**did the wisher say this?**
no. the original vision (v2026_04_02) lines 399-414 don't specify truncation.

**verdict:** assumption needs thought. 100 is reasonable but arbitrary. consider: terminal width is typically 80-120 chars. 80 chars of content + indent = fits one line.

**decision:** keep 100 for now, but document it's arbitrary. can tune later.

---

### 8. output goes to stderr (line 70, 206)

**what do we assume?**
that the reminder should go to stderr, not stdout.

**what evidence supports this?**
- rule.forbid.stdout-on-exit-errors says errors go to stderr
- but this isn't an error — it's informational output

**what if the opposite were true?**
- stdout is for program output
- stderr is for errors and diagnostics
- hooks output might be captured differently

**did the wisher say this?**
the original vision shows output but doesn't specify stderr vs stdout.

**verdict:** assumption needs review. for hooks, stderr is safer (stdout might be piped). use stderr.

---

### 9. `receivedAt` uses date-only format (line 44)

**what do we assume?**
that `receivedAt` is date-only (YYYY-MM-DD), not full timestamp.

**what evidence supports this?**
- `setAsk.ts` line 23: `new Date().toISOString().split('T')[0]`
- this matches other route artifacts (rule.forbid.timestamps-in-route-artifacts)

**what if the opposite were true?**
- timestamp would show exact moment
- but conflicts with timestamp rule

**did the wisher say this?**
no, but briefs say timestamps in route artifacts are forbidden.

**verdict:** assumption holds. date-only aligns with brief.

---

### 10. branch-scoped inventory (line 225)

**what do we assume?**
that asks go to `.goals/$branch/asks.inventory.jsonl`.

**what evidence supports this?**
- original vision specifies `.goals/$branch/` structure
- branch isolation prevents cross-branch pollution

**what if the opposite were true?**
- repo-wide inventory would mix asks from different branches
- harder to reason about coverage per branch

**did the wisher say this?**
yes, original vision lines 29-39 show branch-scoped structure.

**verdict:** assumption holds. branch scope is explicit in original vision.

---

## issues found and fixed

| issue | status |
|-------|--------|
| empty asks should NOT be saved | vision needs update |
| 100 char truncation is arbitrary | document as tunable |

### fix for empty asks

in vision line 152, change:
```
| empty message | still hash and save (empty string has valid hash) |
```
to:
```
| empty message | skip (no meaningful ask to track) |
```

implementation should check if stdin is empty/whitespace-only and exit silently.

---

## summary

r2 found one actual issue: empty messages should not be saved. the vision and implementation should handle this edge case with a skip rather than inventory pollution.

other assumptions (truncation length, stderr, date format, branch scope) hold or are documented as tunable.
