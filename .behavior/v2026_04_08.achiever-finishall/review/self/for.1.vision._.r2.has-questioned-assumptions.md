# self-review r2: has-questioned-assumptions

*breathe. look again.*

---

## fresh look at the vision

i re-read `1.vision.md` slowly. line by line. here's what i notice with fresh eyes:

---

## assumption i missed: "inflight" implies "started"

the vision says:
> "if inflight goals exist → show inflight only, exit 2 (soft block)"

**hidden assumption:** inflight goals were *started* by the bot and should be *finished* before leave.

**but what if:**
- a goal was marked inflight by accident?
- a goal was marked inflight by a prior session that crashed?
- the bot inherited inflight goals it didn't start?

**question:** should the bot be held accountable for goals it didn't start?

**analysis:**
- the wisher said bots should "finish what they started"
- but the goal system doesn't track *who* started a goal
- the `source` field tracks who *created* the goal, not who marked it inflight

**verdict:** this is a gap. if bot A marks a goal inflight and bot B resumes the session, bot B will be blocked by bot A's inflight goals.

**fix options:**
1. track who marked the goal inflight (add `inflightBy` field)
2. accept this as intentional — the session is responsible, not the individual bot
3. add a way to "transfer" inflight goals between sessions

**decision:** option 2 is simplest and aligns with the wisher's intent. the *session* is accountable, not the *individual bot instance*. this is already how the extant achiever works. no change needed.

---

## assumption i missed: "enqueued" is less urgent than "inflight"

the vision says:
> "if no inflight but enqueued exist → show enqueued, exit 0 (reminder)"

**hidden assumption:** enqueued goals are less urgent and don't deserve a soft block.

**but what if:**
- all three asks were enqueued but none were started?
- the bot is about to leave without work on *any* of them?
- the human expects all asks to be addressed?

**analysis:**
- the wisher said "if any inflight, show only inflight; if any enqueued, show only enqueued"
- this implies a priority: inflight > enqueued
- the wisher didn't say enqueued should block

**question:** should a bot be allowed to leave with many enqueued but zero inflight goals?

**verdict:** yes, this is intentional. the human can see the enqueued goals in the output and decide whether to intervene. exit 0 respects human agency while still visible.

**why it holds:** the distinction is deliberate:
- inflight = bot made a commitment, must finish
- enqueued = bot captured the ask, may start later

---

## assumption i missed: "fulfilled" means done

the vision says goals can be `fulfilled`. but what verifies this?

**hidden assumption:** when a bot marks a goal `fulfilled`, it is actually done.

**but what if:**
- the bot lies and marks a goal fulfilled without complete work?
- the verification (`gate`) wasn't checked?

**analysis:**
- the goal has a `how.gate` field that describes how to verify completion
- but no mechanism enforces that the bot actually checked the gate
- the bot could mark `fulfilled` without evidence

**verdict:** this is a known gap. the goal system is *trust-based*. it tracks what the bot *claims*, not what the bot *did*.

**why it holds:** enforcement of gate verification would require a review or judge system. that's out of scope for this feature. the `status.reason` field is where the bot provides evidence.

**future improvement:** a `goal.verify` skill that checks the gate conditions.

---

## assumption i missed: one scope per session

the vision assumes a single scope (repo or route) per check.

**but what if:**
- a bot has goals in *both* repo and route scope?
- the onStop hook checks only one scope?
- the bot escapes accountability for the other scope?

**analysis:**
- the extant achiever skills have a `--scope` flag
- the onStop hook currently uses `goal.infer.triage --mode hook.onStop`
- what scope does it check?

let me check the extant hook in the role definition:

```typescript
onStop: [
  {
    command: './node_modules/.bin/rhx goal.infer.triage --mode hook.onStop',
    timeout: 'PT10S',
  },
],
```

it doesn't pass `--scope`, so it likely uses the default (detect from route bind).

**verdict:** this is correct behavior. if bound to a route, check route scope. if not bound, check repo scope. a session is typically in one context or the other.

**why it holds:** the scope detection is already handled by `getDefaultScope()` in the extant code.

---

## assumption i missed: the protection hook is technically feasible

the vision assumes we can hook Bash, Read, Write, Edit for path checks.

**but what hook event would we use?**

looking at extant hooks:
- `pretooluse.forbid-terms.gerunds` hooks into the `PreToolUse` event
- it receives the tool name and arguments

**can we access file paths in PreToolUse?**
- for Read/Write/Edit: the `file_path` parameter is available
- for Bash: the `command` parameter is available (need to parse for paths)

**verdict:** this is feasible. the extant hooks prove the pattern works.

---

## summary of r2 review

**issues found:**
1. no track of *who* marked goal inflight — accepted as intentional (session accountability)
2. no enforcement of gate verification — accepted as trust-based (out of scope)

**assumptions that hold:**
1. inflight > enqueued priority — explicit in wisher's words
2. enqueued reminder (exit 0) vs inflight block (exit 2) — respects human agency
3. scope detection — extant code handles this
4. PreToolUse hook feasibility — extant hooks prove the pattern

**no changes to vision required.** the assumptions are either:
- validated by the wisher's explicit intent
- accepted as known limitations of the trust-based system
- handled by extant code patterns

🦉 the pond ripples now.
