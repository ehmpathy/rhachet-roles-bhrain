# F220 — a refusal snapshot carries the root error message by design

## .the fork

mech-test-intent (5.3, i001, partition review-cli) raised nitpick.1: the `reviewBrainPin` refusal
snapshot may ossify an incidental format — it named an embedded `lookup` stack string.

- **concede** — strip the `lookup` context from the refusal, or drop the snapshot
- **dispute** — the refusal text is the intended contract

## .taken — dispute, and why at the time

- the `lookup` field holds the upstream `BrainChoiceNotFoundError` message and the empty brain list.
  a grep of the `.snap` for stack frames (`    at `) finds none
- a refusal that names its root cause is what `rule.require.failloud` asks for; to strip it would
  hide why the pin failed
- the snapshot sits beside explicit assertions on the same stderr (`rule.require.snapshots`)

## .rework

clean — one context field in one refusal.

## .confidence

85% — the render is intended. the 15% is whether the upstream message is stable across package
bumps; a reword there would show as a snapshot diff, which is the snapshot at work.

## .where

`src/contract/cli/__snapshots__/reviewBrainPin.acceptance.test.ts.snap:51`

## .verdict

unruled — awaits the council.
