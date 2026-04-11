# self-review: has-ergonomics-reviewed

## question: did I review the ergonomics?

### input/output pair review

| journey | input | output | natural? | friction? |
|---------|-------|--------|----------|-----------|
| onStop inflight | `--when hook.onStop --scope repo` | owl + treestruct + inflight list | yes | none |
| onStop enqueued | `--when hook.onStop --scope repo` | owl + treestruct + enqueued list | yes | none |
| onStop no goals | `--when hook.onStop --scope repo` | (silent) | yes | none |
| guard block | stdin JSON `{tool_name, tool_input}` | owl + block message + skills list | yes | none |
| guard allow | stdin JSON | (silent) | yes | none |

### pit of success principles

| principle | goal.triage.next | goal.guard |
|-----------|------------------|------------|
| intuitive | yes — flag names are clear | yes — follows claude code hook pattern |
| convenient | yes — scope can be inferred | yes — receives all context via stdin |
| expressive | yes — can override scope | yes — path regex is tunable |
| composable | yes — exit codes enable composition | yes — fits PreToolUse contract |
| lower trust | yes — validates scope arg | yes — validates tool_input structure |
| deeper behavior | yes — handles empty goals gracefully | yes — handles non-match gracefully |

### input review

**goal.triage.next inputs:**
- `--when hook.onStop` — clear, matches trigger context
- `--scope repo|route` — clear, optional with inference

**why it holds:** inputs are minimal and inferrable. no required config.

**goal.guard inputs:**
- stdin JSON from claude code — standard hook contract
- `tool_name`, `tool_input.file_path`, `tool_input.command` — standard fields

**why it holds:** inputs follow claude code conventions. no custom config needed.

### output review

**goal.triage.next outputs:**
- owl wisdom header — consistent with extant skills
- crystal ball treestruct — matches skill output patterns
- goal list with slug, ask, status — essential info only
- exit code 0|2 — semantic (clear vs blocked)

**why it holds:** output follows treestruct pattern with turtle/owl vibes.

**goal.guard outputs:**
- owl wisdom header — "patience, friend"
- crystal ball treestruct — matches skill output patterns
- block reason + skills list — actionable guidance
- exit code 2 — semantic (blocked)

**why it holds:** output is actionable — tells bot what to use instead.

### friction analysis

| journey | potential friction | mitigated? |
|---------|-------------------|------------|
| onStop | could require manual scope | yes — inferred |
| onStop | could be verbose when no goals | yes — silent |
| guard | could block without guidance | yes — shows skills |
| guard | could false-positive on similar paths | yes — regex is precise |

**why it holds:** all potential friction points have been addressed.

---

## conclusion

**issues found:** none

**why it holds:**
1. inputs are natural and follow conventions (flags, stdin JSON)
2. outputs use extant treestruct patterns with owl vibes
3. friction is mitigated via inference, silence, and actionable messages
4. pit of success principles are satisfied for both features

no changes needed.

