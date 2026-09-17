# domain.term: concern

term.chosen   = concern
term.kind     = noun                 # noun | verb | adj — reused across objects & operations
term.boundary = review.given
term.synonyms.forbidden:
- point           # `via-a-taken-per-point` predates the term; the rule's prose is the drift
- item
- issue
- comment
- feedback        # already forbidden as a synonym of `given` — see .reason
- critique

🟡 the -ing form is **not** listed above, and deliberately: `rule.forbid.gerunds` already forbids it
outright, so a synonym row would be a second home for one verdict.

## .what

**one unit of review feedback: exactly one blocker, or exactly one nitpick.**

it is the **atom** of the review domain — the finest grain any party addresses. a `given` carries N
concerns; a `stance` targets exactly one; the judge's tally is a sum over them.

🔴 **the engine carries no per-concern structure.** `getReviewCountsViaRegex` returns
`{ detected: true; blockers: number; nitpicks: number }` — two integers, and no identity for any
member. so a concern is a **domain** object the code does not declare, and the term is what makes it
addressable.

## .how a driver names one

a reviewer is **not** asked to mint an id. the driver names a concern by its **ordinal position
within one reviewer's own report**, and the severity axis it sits on:

```
--about nitpick.4 --with experience-coverage      # the 4th nitpick from that reviewer
--about blocker.3 --with mech-decode-friction     # the 3rd blocker from that reviewer
```

⇒ `contract.reviewer-output` already fixes the two severities, so the ordinal indexes into a set the
reviewer's own contract bounds. **the driver names a position; the reviewer's contract is untouched.**

⚠️ **a concern's identity is (reviewer, severity, ordinal) WITHIN one given** — never across givens.
a fresh round renumbers, exactly as `getLatestPeerGivensPerSlug` supersedes the prior given whole.

## 🔴 .the invariant it carries

> **a declaration discharges the concerns it NAMES. concerns it did not name survive it.**

⇒ `rule.forbid.suppression-of-undeclared-concerns` states it, and the twelve-row walk that measured it
sits at `1.vision.experience.case=11` on route `v2026_09_08.feat-dispute-or-concede-review-budget`.

## .refs

- `src/domain.operations/route/guard/review/getReviewCountsViaRegex.ts` — where a concern is
  counted and **not** identified
- `src/domain.operations/route/guard/review/computeReviewTotalsFromFiles.ts` — the sum over concerns
- `.agent/repo=bhrain/role=reviewer/briefs/contract.reviewer-output.md` — the two severities a
  concern may take

## .reason

see the ref-level cluster beside this choice:
- `term=route.guard.review.given.concern._.choice.reason.md` — etymology, the wisher's coinage, the
  words it beat, and why the term had to exist before the axis could
