# F19 — the review default brain is `openrouter/deepseek/flash`, not `fireworks/deepseek/v4-flash`

## .the fork

`a8ba83bd` moved the `review` and `review.by` default brain to `openrouter/deepseek/flash` after the
vision-stage reviews failed on fireworks. the switch sits outside the wish (a token inventory) and
carried no human approval at the time.

- **A — keep** `openrouter/deepseek/flash` as the default
- **B — revert** to `fireworks/deepseek/v4-flash` (a one-line change in `src/contract/cli/review.ts`
  and `review.by.ts`, plus the `review.conversation-help` snap and the four fixture links)

## .taken — A, and why at the time

the fireworks account answers every call with a 412 suspension, so B would fail every brain-backed
review on the same wall. A is the only default that can review at all.

## .rework — clean

a one-line revert per file, plus one snap and four fixture `package.json` links.

## .confidence — 85%, and why it is low

the switch was a driver's call on a contract outside the wish; a human had not confirmed it.

## .where

- `src/contract/cli/review.ts` · `src/contract/cli/review.by.ts`
- `blackbox/.test/assets/*/package.json` (four fixtures) · `review.conversation-help` snap

## .verdict

ruled — A, by the efficiency director at 5.3 (seed S6): the default stays
`openrouter/deepseek/flash` while fireworks is suspended. revisit once the account is restored.
