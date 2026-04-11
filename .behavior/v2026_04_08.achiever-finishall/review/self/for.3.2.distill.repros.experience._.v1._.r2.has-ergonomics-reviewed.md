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

**did I question this?**

yes. the `--when hook.onStop` flag feels verbose. could we infer the trigger context from environment variables or caller identity?

answer: no. explicit flags are better than implicit magic. a bot that calls `goal.triage.next` manually (for debug) should see the same output as the hook. the flag makes the context explicit and testable.

**why it holds:** inputs are minimal and inferrable. the `--when` flag documents intent without hidden inference. scope detection via route bind state is legitimate inference (the bind exists, it is authoritative).

**goal.guard inputs:**
- stdin JSON from claude code — standard hook contract
- `tool_name`, `tool_input.file_path`, `tool_input.command` — standard fields

**did I question this?**

yes. should we also check `tool_input.content` for Write operations? a bot could Write goal data to a different path and then mv it.

answer: no. the mv would be blocked. the threat model is "bot tries to touch .goals/ directly." if the bot writes to /tmp and then mv's, the mv is blocked. edge cases like this are defense-in-depth, not primary protection.

**why it holds:** inputs follow claude code conventions. no custom parsing needed. the hook receives exactly what it needs to make a block decision.

### output review

**goal.triage.next outputs:**
- owl wisdom header — consistent with extant skills
- crystal ball treestruct — matches skill output patterns
- goal list with slug, ask, status — essential info only
- exit code 0|2 — semantic (clear vs blocked)

**did I question this?**

yes. is the stop hand emoji (`✋`) too harsh? should "finish this first" be softer?

answer: no. the stop hand is intentional. this is accountability enforcement. the message is not "please consider" — it is "stop. you have unfinished work." softness here would defeat the purpose.

yes. should both inflight and enqueued exit with code 2?

answer: yes. both represent broken promises. the only difference is urgency (inflight = started, enqueued = committed but not started). in both cases, the bot should not leave without explicit human override.

**why it holds:** output follows treestruct pattern with owl vibes. the stop hand is appropriate for the accountability use case. exit 2 for both unfinished states ensures consistency.

**goal.guard outputs:**
- owl wisdom header — "patience, friend"
- crystal ball treestruct — matches skill output patterns
- block reason + skills list — actionable guidance
- exit code 2 — semantic (blocked)

**did I question this?**

yes. is "patience, friend" too soft for a block message?

answer: no. the message is not a rebuke — it is a redirect. "patience, friend" says "slow down, there is a better way." the block is firm (exit 2), but the tone is instructive.

yes. should the skills list be exhaustive or minimal?

answer: minimal. four skills cover all legitimate operations. more would overwhelm. fewer would be incomplete.

**why it holds:** output is actionable — tells bot what to use instead. the tone is wise, not punitive.

### friction analysis

| journey | potential friction | mitigated? |
|---------|-------------------|------------|
| onStop | could require manual scope | yes — inferred via route bind |
| onStop | could be verbose when no goals | yes — silent exit 0 |
| guard | could block without guidance | yes — shows four skills |
| guard | could false-positive on similar paths | yes — regex is precise |

**did I question this?**

yes. the regex precision claim — is `.goals/` vs `.goals-archive/` distinction reliable?

answer: yes. the regex matches `^\.goals/` for root scope and `/\.goals/` for route scope. the pattern `.goals-archive/` does not match either (the `/` before `.goals` is required in the second pattern, and `.goals-archive` does not start with `.goals/`).

yes. what if a legitimate file path contains `.goals/` as a substring?

answer: unlikely but possible. example: `docs/.goals/readme.md` would be blocked. this is intentional — any `.goals/` directory, anywhere, should use skills. if this becomes a real problem, we can add an allowlist. for now, defense-in-depth wins.

**why it holds:** all potential friction points have been addressed. the regex has been reasoned about and is precise for the threat model.

---

## conclusion

**issues found:** none

**reflections:**

1. the `--when hook.onStop` flag felt verbose at first, but explicit is better than magic
2. the stop hand emoji is appropriate — accountability needs firmness
3. "patience, friend" balances block severity with instructive tone
4. the regex precision claim holds under scrutiny

**why it holds:**
1. inputs are natural and follow conventions (flags, stdin JSON)
2. outputs use extant treestruct patterns with owl vibes
3. friction is mitigated via inference, silence, and actionable messages
4. pit of success principles are satisfied for both features

no changes needed.

