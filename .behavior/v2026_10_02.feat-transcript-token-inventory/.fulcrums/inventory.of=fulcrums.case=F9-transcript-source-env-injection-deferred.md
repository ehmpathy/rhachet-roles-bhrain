# F9 — `getTranscriptSource` keeps its own `process.env` read; injection deferred for dirt

## .the fork

the arch-defects reviewer (r011, concern B) noted `getTranscriptSource` reads
`process.env.CLAUDE_CONFIG_DIR` and `HOME` inside a leaf, where `getTokenSpendReport` takes the same
values as an injected `env` input. two choices:

- **A — inject now**: add `env` to `getTranscriptSource`'s input, thread it through
  `captureSnapshot`'s input, the `reflect.snapshot` cli, and both integration test call sites
- **B — defer**: leave the one leaf read in place; catch a dream with the shape of the fix

## .taken — B, and why at the time

- the leaf predates this route; this route only fixed its hardcoded root (F5) by a shared helper
- A is safe but not clean: it ripples into `captureSnapshot`'s contract, a second cli, and test
  call sites this route never opened — a smuggled refactor the CLEAN question refuses
- the behavior is correct today: both roots are read, and the new tool's own path is injected

## .rework — clean

one input field added and threaded through two callers; no stored shape changes.

## .confidence — 80%, and why it is low

the reviewer may hold that a leaf touched by this route owes the injection now. the touch was the
root fix alone, so the call sits on the dirt side of the line, but the line is a judgment.

## .where

- `src/domain.operations/reflect/transcript/getTranscriptSource.ts` — the `env` input
- `src/domain.operations/reflect/snapshot/captureSnapshot.ts` — where the env is read and injected

## .verdict

reversed to A at 5.3 peer review (i004 r001): the leaf was touched, and the rework was clean. the
leaf now takes `env` as input; `captureSnapshot` — the orchestrator — reads `process.env` and
injects it, so neither its contract nor the `reflect.snapshot` cli changed. the integration suite
injects env per case and no longer mutates `process.env`. the dream it caught is retired.
