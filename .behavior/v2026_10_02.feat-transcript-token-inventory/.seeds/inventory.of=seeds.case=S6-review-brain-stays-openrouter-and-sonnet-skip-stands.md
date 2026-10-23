# S6 — the review brain stays openrouter; the claude-sonnet skip stands

## .said

> (4) brain: the default review brain stays openrouter/deepseek/flash while fireworks is suspended; the claude-sonnet skip stands, on cost. record both as ruled fulcrums.

## .settled

the review default brain is `openrouter/deepseek/flash`, and it holds while the fireworks account
is suspended. the `stepReview.caseBrain.claude-sonnet` suite stays skipped: an anthropic api run is
too costly for ci, so its skip is a deliberate cost choice, not a silent bypass.

## .landed

- `.fulcrums/inventory.of=fulcrums.case=F19-review-default-brain-is-openrouter.md`
- `.fulcrums/inventory.of=fulcrums.case=F20-claude-sonnet-review-suite-stays-skipped.md`
- `5.3.verification.handoff.v1.to_foreman.md` · `5.3.verification.yield.md`
