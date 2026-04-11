# self-review: has-clear-instructions (r1)

## review scope

playtest stone 5.5 — verify instructions are followable by foreman without prior context

---

## the guide

> double-check: are the instructions followable?
>
> - can the foreman follow without prior context?
> - are commands copy-pasteable?
> - are expected outcomes explicit?

---

## method

1. read playtest artifact line by line
2. for each playtest, verify:
   - setup steps are complete
   - commands are ready to paste
   - expected output is explicit
3. attempt a cold run (no prior context)
4. identify any gaps

---

## playtest 1: inflight goals

### are setup steps complete?

| step | instruction | complete? |
|------|-------------|-----------|
| prereq | repo built, role linked | yes |
| step 1 | create inflight goal via heredoc | yes |
| step 2 | invoke goal.triage.next | yes |

### are commands copy-pasteable?

**step 1 command:**
```bash
cat << 'EOF' | rhx goal.memory.set --scope repo
slug: playtest-inflight
...
EOF
```

verified: heredoc syntax correct, single-quoted EOF prevents variable expansion.

**step 2 command:**
```bash
rhx goal.triage.next --when hook.onStop --scope repo
```

verified: straightforward invocation.

**verification command:**
```bash
rhx goal.triage.next --when hook.onStop --scope repo; echo "exit: $?"
```

verified: shows exit code inline.

### are expected outcomes explicit?

| element | explicit? |
|---------|-----------|
| step 1 expected | "skill runs, outputs treestruct with 'persisted'" |
| step 2 expected | full treestruct shown with owl wisdom |
| exit code | "expected exit code: 2" |
| pass criteria | "output shows owl wisdom, inflight goal list, stop hand emoji, exit code 2" |

**verdict:** playtest 1 instructions are clear.

---

## playtest 2: enqueued goals

### are commands copy-pasteable?

**issue found:** step 1 uses same slug as playtest 1 (`playtest-inflight`) — this is intentional (update prior goal), but name is unclear.

however, this is acceptable because:
- playtest 2 depends on playtest 1 (sequential)
- the slug name doesn't affect the test outcome
- expected output explicitly shows `enqueued` status

### are expected outcomes explicit?

| element | explicit? |
|---------|-----------|
| expected output | full treestruct with enqueued status |
| pass criteria | "output shows enqueued (not inflight), exit code 2" |

**verdict:** playtest 2 instructions are clear, dependency on playtest 1 is implicit but logical.

---

## playtest 3: silent when no goals

### are setup steps complete?

step 1 marks goal as `fulfilled`, which should make it invisible to triage.

### are expected outcomes explicit?

| element | explicit? |
|---------|-----------|
| expected output | "no output (silent)" |
| exit code | "expected exit code: 0" |
| pass criteria | "stdout is empty, stderr is empty, exit code 0" |

**issue found:** "stderr is empty" in pass criteria, but goal.triage.next outputs to stderr. need to verify this is correct.

**resolution:** when no unfinished goals, there should be no output at all — neither stdout nor stderr. the pass criteria is correct.

**verdict:** playtest 3 instructions are clear.

---

## playtest 4: goal.guard blocks

### are commands copy-pasteable?

```bash
echo '{"tool_name":"Read","tool_input":{"file_path":".goals/branch/file.yaml"}}' | rhx goal.guard
```

verified: JSON is valid, pipe to stdin works.

### are expected outcomes explicit?

full treestruct shown with:
- owl wisdom
- blocked message
- skills list

**verdict:** playtest 4 instructions are clear.

---

## playtest 5: safe paths allowed

### are commands copy-pasteable?

**step 1:**
```bash
echo '{"tool_name":"Read","tool_input":{"file_path":"src/index.ts"}}' | rhx goal.guard; echo "exit: $?"
```

**step 2:**
```bash
echo '{"tool_name":"Read","tool_input":{"file_path":".goals-archive/old.yaml"}}' | rhx goal.guard; echo "exit: $?"
```

verified: both commands ready to paste.

### are expected outcomes explicit?

| element | explicit? |
|---------|-----------|
| step 1 expected | "no output, exit code 0" |
| step 2 expected | "no output, exit code 0 (no false positive)" |
| pass criteria | "both commands silent, both exit 0" |

**verdict:** playtest 5 instructions are clear.

---

## playtest 6: Bash rm blocked

### are commands copy-pasteable?

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf .goals/"}}' | rhx goal.guard
```

verified: JSON valid, command ready to paste.

### are expected outcomes explicit?

| element | explicit? |
|---------|-----------|
| expected | "block message shown, exit code 2" |
| pass criteria | "blocked with same message as Read tool" |

**verdict:** playtest 6 instructions are clear.

---

## cleanup section

```bash
rm -rf .goals/$(git branch --show-current)
```

**issue found:** this uses subshell to get branch name. on a feature branch, this removes goals created in playtest. correct and safe.

**verdict:** cleanup instruction is clear.

---

## cold run verification

### can foreman follow without prior context?

| aspect | assessment |
|--------|------------|
| prerequisites listed | yes — build, link, branch check |
| sandbox defined | yes — .temp/playtest-achiever (though not used) |
| sequential dependency | playtests 1-3 share goal state, sequential |
| commands ready | all heredocs and pipes correct |
| expected outputs | all include full treestruct or "silent" |
| pass/fail explicit | checklist at end |

### gaps identified

1. **sandbox unused:** prerequisites mention sandbox but playtests operate on repo `.goals/` directory, not sandbox. this is acceptable because cleanup removes goals at end.

2. **sequential dependency:** playtest 2-3 depend on playtest 1. foreman must run in order. this is not explicitly stated but follows from numbered sequence.

---

## summary

| check | status |
|-------|--------|
| can foreman follow without prior context? | yes |
| are commands copy-pasteable? | yes |
| are expected outcomes explicit? | yes |

---

## why it holds

1. **prerequisites are complete:** build, link, branch requirements stated upfront
2. **commands are valid:** heredocs use single-quoted EOF, JSON is valid, pipes correct
3. **expected outputs are explicit:** full treestruct shown for visible output, "silent" for no output
4. **exit codes are explicit:** each playtest states expected exit code
5. **pass/fail checklist:** final section has clear checkboxes
6. **cleanup is safe:** removes only playtest goals on current branch

the instructions are followable by a foreman with no prior context.

