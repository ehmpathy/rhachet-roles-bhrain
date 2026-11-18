---
case: F13
rework: dirty
ground: dirty
confidence: 0.70
status: open
owed: human
holds: [enroll-impl-behavior-intent/i004/blocker.2]
lean: the linter enforces the frontmatter; the summary-row derive ships in its own route, already caught as a dream
verdict: null
---

# F13 — the summary-row derive ships in its own route

## .the fork

invariant 5 says a fulcrum's summary row is derived from its frontmatter, never typed twice. this
route ships the frontmatter, its parser, its linter, and the dispute-time check. it ships no tool
that writes or checks the summary row.

- A: ship the derive here — a generator that rewrites `inventory.of=fulcrums._.md` from the
  frontmatter, or a lint row that refuses a summary that disagrees with it
- B: ship the frontmatter and its linter here; the summary derive ships in its own route, from
  `.dream/v2026_11_17.feat.fulcrum-summary-row-derived-from-frontmatter.md`

## .taken, why

B. the summary files across this repo's routes do not share one column set, so a derive must first
settle that set, then migrate every extant summary. that is a format change with its own review,
not a gate on this one. the halt, the gates, and the lever read the frontmatter alone, never the
summary, so no gate trusts a hand-typed row.

## .rework, why

dirty. a derive rewrites every route's summary file and fixes a column set other routes then build
on. a later reversal would touch each of them.

## .confidence, why low

the wish names the derive as part of invariant 5, and the brief this route ships states it as a
blocker. B leaves the brief ahead of the tool. 70%.

## .where

`src/domain.roles/driver/briefs/define.invariant.review.peer.dispute.the-fulcrum-is-the-one-home.md`
· `.dream/v2026_11_17.feat.fulcrum-summary-row-derived-from-frontmatter.md` · the 5.1 yield caveats.

## .verdict

open. owed to the human at the PR.
