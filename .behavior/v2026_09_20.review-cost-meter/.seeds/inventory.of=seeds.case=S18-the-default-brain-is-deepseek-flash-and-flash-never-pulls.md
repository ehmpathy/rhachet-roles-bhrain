# seed S18 — the default brain is deepseek flash, and flash never runs `--focus pull`

archived verbatim, before distillation (`rule.always.archive-the-wishers-words-verbatim`).

## .the utterance

> oh yeah swap the default brain to fireworks/deepseek/flash btw

and, a moment later:

> and defo no --focus pull for deepseek flash

## .settled

- the default review brain is **deepseek flash**, on the fireworks provider — for `rhx review`,
  for `rhx review.by`, and for the tally sub-brain
- deepseek flash is an atom brain with no tool use. a pull-mode review hands the brain paths and
  expects it to read them, so on flash **every lane runs `--focus push`**
- the brain package names no bare `fireworks/deepseek/flash`. its versionless generic is
  `fireworks/deepseek/flash/latest`, which the package re-aims as the provider retires a version.
  that is the slug taken, and the call is recorded as a fulcrum

## .what prompted it

the pinned `fireworks/deepseek/v4-flash` answered `404 model not found` on 2026-09-26, and two
guard lanes refused because they asked an atom brain for `--focus pull`.

## .landed in

- `src/contract/cli/review.ts` — `DEFAULT_BRAIN`
- `src/contract/cli/review.by.ts` — `DEFAULT_REVIEW_BRAIN`
- `src/domain.operations/route/genReviewBrainSupply.ts` — `FIXED_FALLBACK_BRAIN`
- `5.1.execution.from_vision.guard` — `--focus pull` dropped from every lane
