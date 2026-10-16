# F62 — an exhausted lane's unreadable given defers to a dream

## .the fork

i013 lane `arch-hazards-maintenance`, nitpick.3: `getOneLatestReviewArtifactForSlug` reads an
undetected tally as `0 blockers / 0 nitpicks`, where `asPeerGivenVerdict` scores it as one blocker.

| option | what it does |
|---|---|
| **A — defer** | concede `better`, catch a dream with the fix shape |
| B — fix now | score undetected as one blocker, or carry `detected` onto the artifact |

## .taken — A, and why

- **the file is untouched by this branch** (`git diff origin/main` shows no change to it). the
  fallback predates the review-cost work
- **the fix changes passage.** this read feeds the exhausted-lane tally; a 0 → 1 flip can hold a
  stone that passes today. that is a behavior change on a path the review-cost criteria never cover
- **the harm is narrow.** it needs an exhausted lane AND a present given with no numeric footer.
  `rhx review` always writes the two lines, so only a foreign or truncated given reaches it

## .rework

dirty — the right fix touches `RouteStoneGuardReviewArtifact` and the passage tally.

## .confidence

70%. the 30%: an unreadable review that reads as clean is the exact failhide this repo forbids,
and a reader who weights that over scope would fix it here.

## .where

`.dream/v2026_09_27.fix.exhausted-lane-unreadable-given-reads-as-clean.md`, symlinked at
`$route/dreams/`.

## .verdict

🟡 BEST-GUESSED 2026-09-27 — option A.
