# fulcrum F42 — `deepseek/flash` names no slug, so `flash/latest` is taken

- rework = **clean** — three constants and three snapshot lines
- status = ✅ **RULED 2026-09-26 — option A, `flash/latest`, pinned at the lookup** (seed S21).
  the defaults stay versionless; `getOneBrainChoicePinned` maps a `…/latest` choice to the package's
  `PINNED_BY_LATEST_SLUG` entry at each `genContextBrain` call, so the lookup still receives a
  registered slug. the brief interlude on `flash/v4.1` (option B) fixed the throw and re-armed the
  retirement failure; the wisher struck it the same hour. enruled as
  `rule.require.versionless-brain-defaults`. clamped by `reviewDefaultBrains.test.ts` — each default
  ends in `/latest` AND its pin is registered
- confidence = ✅ **measured**
- 🟡 a persisted record of WHICH model ran names the pin, never `latest` — the tally footer does so
  (clamped, proven red); the live tree label does not yet (`F50`)
- raised.by = self, in the execution of seed S18

## .the fork

S18 asks for the default brain `fireworks/deepseek/flash`. the installed
`rhachet-brains-fireworksai@0.2.0` accepts three deepseek flash names, and none of them bare:

| name | resolves to | behavior as fireworks retires a version |
|---|---|---|
| `fireworks/deepseek/flash/latest` | `flash/v4.1` today | re-aimed by the package, no edit here |
| `fireworks/deepseek/flash/v4.1` | `flash/v4.1` | pinned, byte-stable, 404s the day it retires |
| `fireworks/deepseek/flash/v4` | routed to `flash/v4.1` | already retired |

### A — `flash/latest` (taken)

it is the only name that means *"deepseek flash"* with no version, which is what the utterance
said. and the defect that prompted S18 was a pinned slug that went 404: a versionless name is the
repair for that class, not merely for this instance.

### B — `flash/v4.1`

byte-stable, so a cache prefix and a rate card never shift under a run. 🔴 and it strands the
defaults again the day v4.1 retires, which is the exact failure that opened S18.

## 🟡 .why confidence is 80%, not higher

- the utterance names a slug that does not exist, so the choice reads intent rather than text
- `latest` can re-aim to a model with a different rate card, so a figure measured today may not
  hold next month. the research brief now says so beside its rate card
- a package author could add a bare `fireworks/deepseek/flash` alias; if they do, this is a
  one-line rename

## .where

- `src/contract/cli/review.ts` — `DEFAULT_BRAIN`
- `src/contract/cli/review.by.ts` — `DEFAULT_REVIEW_BRAIN`
- `src/domain.operations/route/genReviewBrainSupply.ts` — `FIXED_FALLBACK_BRAIN`
