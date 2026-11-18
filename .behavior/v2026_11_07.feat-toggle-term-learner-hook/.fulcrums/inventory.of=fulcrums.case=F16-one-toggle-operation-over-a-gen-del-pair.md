# F16 — one toggle operation over a gen/del pair

## .the fork

- **A.** one orchestrator `setTermsHookToggle({ mode })`: hold, re-pick, read, no-op check, then the arm for the mode
- **B.** `genTermsHookEnabled` and `delTermsHookEnabled` over a shared `withTermsHookSettingsHeld` scaffold

## .taken — A

the two arms share every step but the last transform, and the last transform is already two named transformers (`asSettingsWithTermsHook`, `asSettingsWithoutTermsHook`). the shared part (pick, hold, re-pick, read, no-op) is the part with the race rules, so one copy keeps them in one place. the cli maps the outcome through one record; an `enable` that returns `removed` cannot arise, since each arm returns its own literals.

## .rework — clean

a split into two files plus a scaffold; callers are the cli alone.

## .confidence — 80%, why not higher

two typed outcomes would let the type system say what the arms already guarantee.

## .where

`src/domain.operations/learn/termsHook/setTermsHookToggle.ts`
