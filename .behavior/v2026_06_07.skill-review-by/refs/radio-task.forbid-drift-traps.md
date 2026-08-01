# radio task (queued — dispatch once push granted)

## dispatch

radio is globally blocked right now. once a human grants push, dispatch with:

```sh
cat .behavior/v2026_06_07.skill-review-by/refs/radio-task.forbid-drift-traps.md \
  | rhx radio.task.push \
      --via gh.issues \
      --into ehmpathy/rhachet-roles-ehmpathy \
      --title "feat(rule): forbid drift traps (parallel codepaths for one job)" \
      --description @stdin
```

(strip this dispatch header from the body before send, or keep it — the task body below stands on its own.)

---

## title

feat(rule): forbid drift traps — parallel codepaths that do one job two ways

## why

when two callers need the same job done (e.g. "run a review command → capture stdout/exit → tally → promote a no-verdict exit-0 to malfunction"), a shortcut is to give each caller its own implementation — one in-process, one subprocess. these parallel paths look harmless at birth but drift over time: a fix lands on one path, the other rots, and the two silently diverge. the divergence is a latent defect that surfaces far from its cause.

this came up in the bhrain `review.by` blueprint: the first draft had review.by call `stepReview` in-process while the route guard exec'd a subprocess for the identical verdict logic. the fix was to eject ONE shared runner both dispatch — a single execution path.

## what to add

a rule that forbids two codepaths that accomplish the same job via different mechanisms. prefer one shared operator both callers dispatch. related to, but distinct from, wet-over-dry (that is about premature abstraction of *similar* code; this is about *identical-intent* logic that must not fork).

## where

- primary candidate: **architect** role — this is a decomposition / most-common-denominator concern (pairs with `rule.prefer.most-common-denominator`, `rule.prefer.decomposable-architecture`).
- alt candidate: **mechanic** role under `code.prod/evolvable.architecture/`.

let the ehmpathy side pick the home.

## suggested shape

- directive: `forbid` (blocker) or `avoid` (nitpick) — ehmpathy's call. a nitpick may fit better, since "same job, two mechanisms" sometimes has a real justification (perf, isolation) that should be documented, not banned outright.
- the test: "do these two codepaths do the same job by different means? if yes, can one shared operator serve both, where callers pass only what genuinely differs (the cmd string, the result wrapper)?"
- contrast with wet-over-dry: three similar lines ≠ a drift trap. the trap is *identical intent* that will be maintained in lockstep forever.
- cite the review.by / runOneStoneGuardReview eject as the worked example.
