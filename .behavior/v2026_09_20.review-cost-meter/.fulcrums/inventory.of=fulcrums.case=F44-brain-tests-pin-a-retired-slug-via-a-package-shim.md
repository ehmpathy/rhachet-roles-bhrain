# fulcrum F44 — brain tests pin a retired slug, and pass via the brain package's shim

- rework = **clean** — one slug string per file, no contract moves
- status = 🔴 **OVERTURNED 2026-09-26 — option B, by measurement.** A's premise was false: the
  integration suites did NOT run via a shim — they threw `BrainChoiceNotFoundError:
  fireworks/deepseek/v4-flash` at setup. `DEFAULT_TEST_BRAIN` is now `fireworks/deepseek/flash/latest`
  (pinned through `PINNED_BY_LATEST_SLUG` in `genTestBrainContext`), and the literal slugs in the
  integration suites were retargeted to `flash/v4.1`. unit fixtures that name the slug are inert
  labels and stay
- confidence = ✅ **measured** (was 🟡 70% — and the premise it rested on was never run)
- raised.by = self, in the backcompat self review of the brain swap

## .the fork

the default brain moved to `fireworks/deepseek/flash/latest` (`F42`). eleven test files still name
`fireworks/deepseek/v4-flash` — `stepReview.caseBrain.deepseek-v4-flash.case1/2/3`,
`casePromptCache`, `genReviewWarmer`, `stepReflect.casePriorRules.deepseek-v4-flash`,
`getReviewCountsViaBrain.caseBrain.deepseek-v4-flash`, and several unit fixtures. they run today
because `rhachet-brains-fireworksai@0.2.0` maps the legacy slug to `flash/v4` and routes the retired
version forward. this repo wrote no line of that shim.

🟡 **most of them read one constant**: `DEFAULT_TEST_BRAIN` in `src/.test/genTestBrainContext.ts:22`.
the file names that say `deepseek-v4-flash` are labels; the brain they call comes from that line or
a literal beside it.

### A — leave them (taken)

they grade the test brain, which this wish never named. to move it moves the model under every
integration test in the repo — a change whose blast radius is the whole suite, not this diff.

### B — move `DEFAULT_TEST_BRAIN` to `flash/latest`

one line, not a sweep. `casePromptCache` and `genReviewWarmer` measure the default path, so they
would grade what the default grades. the file-name labels would then read stale, which is cosmetic.

### C — pin them to `flash/v4.1`

stable grades, and a 404 on the next retirement — the exact failure that opened S18.

## 🟡 .why confidence is 70%

- option A leans on a third-party shim with no promise of how long it lives. if it drops, every one
  of these tests 404s at once, the i011 shape at the scale of the suite
- the unit fixtures that name `v4-flash` are inert strings and need no change under any option;
  the integration tests are the real exposure

## .where

- the eleven files above, found by `rhx grepsafe --pattern 'v4-flash' --path src`
