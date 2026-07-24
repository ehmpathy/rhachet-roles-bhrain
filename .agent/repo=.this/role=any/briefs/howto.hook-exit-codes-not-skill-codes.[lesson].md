# howto.hook-exit-codes-not-skill-codes

## .what

a claude-code **hook** exit code follows the hook dispatcher's contract, NOT the general
`rule.require.exit-code-semantics` (0/1/2) that governs skill/cli codes. the **stop hook
reserves exit `2`** to mean "block the stop — the agent must continue". so a halt that must
STOP the agent and summon a human cannot use `2`; it uses `3` to escape the reserved range.

## .why

two different contracts assign different senses to the same number:

| context | who reads the code | exit `2` means |
|---------|--------------------|----------------|
| skill / cli | a normal caller | constraint — caller must fix (`rule.require.exit-code-semantics`) |
| claude-code **stop hook** | the hook dispatcher | block the stop — the agent CONTINUES (stderr fed back) |

they collide on `2`. a value that means "the human must act" for a cli means "continue" for
the stop hook. so a code's sense depends on WHO consumes it.

## .the driver case (stepRouteDrive)

`stepRouteDrive` emits codes consumed by the claude-code hooks (`hook.onStop` = stop hook,
`hook.onBoot` = session-start hook). inside the SAME onStop path, two codes carry OPPOSITE
intents on purpose:

- **normal block** (stone not yet passed) → the driver SHOULD continue → `code: 2`
  (block the stop, so the driver drives on). the human's instinct "exit 2 = don't stop" is
  exactly right.
- **escalation halt** (guard malfunction at `:88`, stop-block cap reached at `:227`) → the
  driver MUST stop and reach a human → `code: 3`. it must NOT be `2`, because `2` would block
  the stop and permaloop the very loop the escalation exists to break.

`3` does not block on the stop hook: the stop proceeds, and stderr shows the escalation to the
human. `0` would also allow the stop but reads as a clean success; `1`/`3` allow the stop while
they mark it as an escalation. `3` is the convention here.

## .the trap (a real incident)

a peer reviewer flagged the escalation halts' `code: 3` as a `rule.require.exit-code-semantics`
violation and recommended "fix to `1`/`2`". that fix — `2` for the stop-block escalation —
would have created a **permaloop**: the halt that exists to break a 21-block loop would instead
force the agent to continue it. the general rule was pointed at a code it does not govern.

## .the rule

before you "correct" an exit code to satisfy `rule.require.exit-code-semantics`, check whether
the code is consumed by a **claude-code hook**:

- consumed by a hook → `2` is reserved for "block / continue"; a halt that must STOP uses a
  non-`2` code (`3` by convention). do NOT rewrite it to `2`.
- consumed by a normal skill/cli caller → `0`/`1`/`2` per `rule.require.exit-code-semantics`.

## .enforcement

- a flag of a hook escalation's `code: 3` as an exit-code-semantics violation = **false positive**.
- a "fix" that sets a stop-hook escalation halt to `code: 2` = **blocker** (permaloop hazard).

## .see also

- `rule.require.exit-code-semantics` (mechanic) — the 0/1/2 contract for skill/cli codes
- `stepRouteDrive.ts` — the escalation halts that use `code: 3` deliberately
