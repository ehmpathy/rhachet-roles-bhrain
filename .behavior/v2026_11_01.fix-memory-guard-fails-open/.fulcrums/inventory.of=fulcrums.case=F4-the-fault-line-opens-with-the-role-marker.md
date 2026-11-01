# F4: the fault line opens with the role marker

## .the fork

the guard's fault line is a notice a human reads. open it with the role marker (`📜 memory.guard: could not run (…)`), or with a qualified error class (`💥 MalfunctionError: …` / `✋ ConstraintError: …`)?

## .taken: the role marker

- **the class header carries an exit code, and this line must not.** `rule.require.qualified-error-headers` pairs `✋ ConstraintError` with exit 2 and a PreToolUse `💥 MalfunctionError` with exit 2 too ("exit 1 fails the gate open"). this guard's whole contract is the opposite: a fault MUST fail open (F1, exit 1). a class header here would tell a reader "this blocked", and the rule's own PreToolUse clause would demand exit 2 — the crews' exact stall.
- **this repo's voice rule settles the prefix.** `define.bhrain-repo-mascot`: an error prefix is the role marker plus the surface (`🗿 route.foreground guard: failed to parse …`). the learner's marker is 📜, and the guard's halt nudge already renders `📜 memory.guard`. one label, one glyph, on both of its surfaces.
- **the line is not an error the caller fixes or the call fails on.** the call proceeds. it is a notice that the guard stood down.
- the gap is real and upstream: the mechanic rule has no shape for an advisory guard that must fail open. caught as `.dream/v2026_11_01.reseed.qualified-error-headers-split-safety-gates-from-advisory-guards.md`, to reseed into ehmpathy/rhachet-roles-ehmpathy.

## .rework: clean

one format string in `emit_fault`, one in the node fault, one in the hook command, and the test's `asFaultLine` and `NOT_LINKED_LINE`. no caller parses the line.

## .confidence: 85%

high that a class header plus exit 1 would mislead, and the repo rule names the prefix outright. below 93% because a mechanic rule reads as if it binds every human-read error.

## .where

`src/domain.roles/learner/skills/memory.guard.sh` `emit_fault`, the node fault; `getLearnerRoleHookCommand.ts`.

## .verdict

open for the human.
