# self-review: has-questioned-assumptions

## question: what technical assumptions did I make?

### assumption 1: exit 2 for both features

**the assumption:** both goal.triage.next and goal.guard use exit 2 for "constraint" conditions.

**what if opposite were true?**
- exit 1 would mean "malfunction" — an unexpected error
- but blocked goals and blocked paths are expected outcomes, not errors

**evidence:** route.mutate.guard uses exit 2 for blocks. the repo has established semantics.

**verdict:** assumption holds. exit 2 = constraint is correct.

---

### assumption 2: treestruct output format

**the assumption:** output uses owl wisdom + crystal ball + treestruct.

**what if opposite were true?**
- JSON output would be more machine-parseable
- plain text would be simpler

**evidence:** extant skills (goal.memory.get, route.drive) use treestruct. this is the established visual language.

**could a simpler approach work?** yes, but it would break visual consistency. users expect the owl.

**verdict:** assumption holds. treestruct is repo convention.

---

### assumption 3: shell + node pattern

**the assumption:** shell entrypoint calls node via package import.

**what if opposite were true?**
- pure bash implementation (like route.mutate.guard.sh)
- pure node (no shell wrapper)

**evidence:** goal.memory.get.sh, goal.memory.set.sh use shell+node. goal.infer.triage.sh uses shell+node.

**could bash work?** yes, for goal.guard (it's mostly jq + regex). but goal.triage.next needs access to getGoals which is typescript.

**verdict:** assumption holds for goal.triage.next (needs ts). questionable for goal.guard — could be pure bash. **but**: consistency with other achiever skills argues for shell+node. keep.

---

### assumption 4: path regex patterns

**the assumption:** `^\.goals/` and `/\.goals/` cover all cases.

**what if opposite were true?**
- `.goals` at root without a slash after it?
- goals directories with other names?

**counterexamples:**
- `rm .goals` (no slash) — should be blocked
- `cat .goals` — should be blocked

**issue found:** regex needs to handle `.goals` without end slash.

**fix:** pattern should be `(^|/)\.goals(/|$)` — matches `.goals` at start or after `/`, followed by `/` or end of string.

**verdict:** assumption flawed. **update blueprint** to clarify pattern handles both `.goals/` and `.goals` (no end slash).

---

### assumption 5: onTool filter

**the assumption:** filter is `Read|Write|Edit|Bash`.

**what if opposite were true?**
- what about `Glob` or `Grep` tools?
- what about `Agent` tool?

**evidence:** route.mutate.guard uses same filter. Glob and Grep don't mutate, so block is less critical. Agent spawns subprocesses which would be blocked individually.

**verdict:** assumption holds. the four tools cover mutation paths.

---

### assumption 6: inflight takes priority over enqueued

**the assumption:** if inflight goals exist, show only inflight.

**what if opposite were true?**
- show all unfinished goals (both inflight and enqueued)
- let the bot decide priority

**evidence:** vision says "if any inflight, show only inflight; if any enqueued, show only enqueued."

**could a simpler approach work?** to show all would be simpler but noisier. priority focus aligns with wish.

**verdict:** assumption holds. matches explicit wish.

---

### assumption 7: goal.guard output goes to stderr

**the assumption:** block messages go to stderr, not stdout.

**what if opposite were true?**
- stdout would be captured by claude code as "tool output"
- stderr is shown separately as "hook feedback"

**did I verify this?** yes. looked at route.mutate.guard.sh line 191-195: messages go to `>&2` (stderr).

**why stderr?** because the hook is not the tool — the hook intercepts the tool. the tool's stdout is what the bot requested. the hook's feedback should be separate.

**verdict:** assumption holds. stderr is correct for hook feedback.

---

### assumption 8: skills should be allowed through guard

**the assumption:** when a bot runs `rhx goal.memory.set`, the guard allows it even though it touches `.goals/`.

**what if opposite were true?**
- guard could block skill invocations too
- skills would need a special privilege flag

**danger:** this is the nightmare scenario from the premortem. if guard blocks skills, the entire achiever role breaks.

**how do skills differ from direct access?**
- skills invoke via `rhx` command, not via Read/Write/Edit on `.goals/` paths
- the skill internally writes to `.goals/`, but the tool_input seen by the hook is the rhx command, not the file path

**wait — is this actually true?** let me think through the flow:
1. bot calls `rhx goal.memory.set`
2. claude code invokes Bash tool with command `rhx goal.memory.set`
3. hook sees `tool_name: Bash, tool_input.command: "rhx goal.memory.set"`
4. command does not contain `.goals/` — it's just the rhx invocation
5. skill internally writes to `.goals/`, but that's node fs, not claude code tools

**verdict:** assumption holds. skills are safe because the hook only sees the rhx command, not the internal file operations.

---

### assumption 9: two features vs one combined feature

**the assumption:** goal.triage.next and goal.guard are separate skills.

**what if opposite were true?**
- one skill called `goal.finishall` that does both
- simpler file count

**why separate?**
- different triggers: onStop vs onTool
- different purposes: reminder vs protection
- different inputs: none vs stdin JSON

**verdict:** assumption holds. separation is correct — they are fundamentally different hooks.

---

## conclusion

**issues found:** 1

**issue:** path regex assumption is flawed — needs to handle `.goals` without end slash.

**fix applied:** noted in conclusion. implementation must use `(^|/)\.goals(/|$)` pattern.

**critical verification:** skills are safe through the guard because the hook sees the rhx command, not the internal file operations. this was the nightmare scenario from the premortem — verified it cannot happen.

**assumptions that hold:**
1. exit 2 semantics — matches repo convention
2. treestruct format — matches repo convention
3. shell+node pattern — matches achiever skill convention
4. onTool filter — matches route.mutate.guard pattern
5. inflight priority — matches explicit wish
6. stderr for guard output — matches hook feedback convention
7. skills allowed — rhx command does not expose .goals/ path
8. two separate features — different triggers, different purposes

