# F21 — the review tally brain is `openrouter/deepseek/flash`; this branch adds only its live clamp

## .the fork

every prose-verdict l3 lane ended in `review tally fallback failed`. the fixed tally brain answered
each call with `412 Account … is suspended`. three choices:

- **A — point `FIXED_FALLBACK_BRAIN` at `openrouter/deepseek/flash`**, the provider F19 already
  ruled for the `review` default
- **B — make the tally brain follow the review default** through one shared constant
- **C — leave it**, and ask each reviewer to emit numeric counts so the fallback is never reached

## .taken — A, and why at the time

the same deepseek flash model, on the provider that answers; one constant, one clamp. B is the
tidier shape but couples two contracts the code deliberately keeps apart (the tally brain is not
configurable per route). C leaves a guard that cannot read a prose verdict, which is the case the
fallback exists for.

## .shrunk — main already carries the move

the merge of `origin/main` brought the same move, landed upstream: `FIXED_FALLBACK_BRAIN` is
`openrouter/deepseek/flash` in its own file under `brain/`, held versionless and registered by
`reviewDefaultBrains.test.ts`. this branch's constant edit resolved to main's.

what main does not carry is a **live** call on that slug: its registered-slug clamp passes against
a provider that refuses every call, and its live tally suite rides `DEFAULT_TEST_BRAIN`, never the
production slug. so the one piece this fulcrum still holds is the clamp, ported onto main's
choiceless supply.

## .rework — clean

one integration test; delete it and naught else moves.

## .confidence — 85%, and why it is low

a live test of a production slug spends a real call per run; a reader may judge the registered-slug
clamp enough.

## .where

- `src/domain.operations/brain/genReviewBrainSupply.integration.test.ts` — the clamp, red on a
  provider that refuses the call

## .verdict

open.
