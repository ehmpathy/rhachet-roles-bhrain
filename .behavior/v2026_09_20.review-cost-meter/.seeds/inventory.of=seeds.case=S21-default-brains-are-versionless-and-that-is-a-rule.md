# seed S21 — default brains are versionless, and that is a rule

archived verbatim, before distillation (`rule.always.archive-the-wishers-words-verbatim`).

## .the utterance

> why not flash/latest ?

> that way when v4.1 gets deprecated, we dont get stuck

> enrule that

## .settled

- a default brain names a tier, never a version: `fireworks/deepseek/flash/latest`. the brains
  package re-aims `latest` when a version retires, so a package bump is the whole upgrade
- the lookup matches registered slugs only, so `latest` is pinned **at the lookup**, via the
  package's own `PINNED_BY_LATEST_SLUG` — never in the constant
- it is a rule, so the next default typed obeys it without a re-argument

## .what prompted it

the fireworks brains package renamed `deepseek/v4-flash` to `deepseek/flash/v4.1`; every
integration suite that pinned the old slug failed at setup. the driver re-pinned to the new
version, which would strand again on the next retirement. this corrects `S18`'s later drift from
`latest` back to a pin.

## .landed in

- `.agent/repo=.this/role=any/briefs/rule.require.versionless-brain-defaults.md`
- `src/domain.operations/brain/getOneBrainChoicePinned.ts` — the edge pin, at every `genContextBrain`
- `DEFAULT_BRAIN`, `DEFAULT_REVIEW_BRAIN`, `FIXED_FALLBACK_BRAIN`, `DEFAULT_TEST_BRAIN`
- `reviewDefaultBrains.test.ts` — clamp: versionless, and its pin registered
