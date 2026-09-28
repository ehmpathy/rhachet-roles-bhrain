# domain.term.choice.reason: active

## .etymology

`active` = capable of action, in motion. chosen for the route-drive predicate "the drive can still
advance on its own, so the reminder should nudge it". the vision's own prose uses it directly — "an
active drive", "an active-drive state the driver can advance alone" — so `active` is the wisher's
word, adopted, not invented.

rejected alternatives:
- **alive / live** — reserved for the narrower STATUS tier (see the two-tier note below). to reuse
  `live` for the full predicate would overload one word onto two concepts.
- **advanceable** — accurate but a coined mouthful; `active` reads plainer (rule.require.brevity).
- **awake / afoot / open** — informal or ambiguous; `open` especially collides with an open review.

## .the live-vs-active two-tier distinction (why two words, not one)

this is the crux the term exists to protect. the RouteReminder asks one question each cycle — should
i fire? — but the answer is TWO reads at two tiers, and to conflate them was a real defect this term
prevents:

| tier | word | op | reads |
|------|------|----|-------|
| status | **live** | `isReminderLiveForPassageStatus` / `getRouteReminderLiveness` | the tail-1 passage status permits a nudge |
| full predicate | **active** | `getRouteReminderDriveActivity` | `live` AND the drive is not complete |

the trap: a COMPLETED drive writes the SAME `passed` tail as a mid-route pause. by status alone it
reads LIVE — so a status-only predicate would nudge a finished route forever (the wish's forbidden
"no ifniloops"). the stone frontier (`getRouteDriveComplete`) is the discriminator the status tier
structurally cannot see. `active` folds both reads into one answer, so a completed drive is
live-by-status yet **inactive**, and the reminder reaps.

so `live` ⊃ `active`: every active drive is live, not every live drive is active. the two words name
two genuinely different sets; they are NOT synonyms, and neither should be renamed to the other.

## .evidence

- **discovery**: prior domain-term sweeps (2026-08-30, 2026-08-07) recorded "active drive (predicate)"
  as a candidate concept, explicitly deferred because no declared dobj/dop anchored it. the
  2026-09-03 round DECLARED `getRouteReminderDriveActivity`, so the anchor now exists and the term is
  itemized per rule.require.domain-term-itemization.
- **the pressure that coined it**: three peer reviewers (behavior-intent-coverage,
  arch-hazards-maintenance, arch-hazards-behavior) blocked on the terminal-completion no-ifniloop gap
  — a completed drive nudged forever because the daemon tick keyed on `live` (status) alone. the fix
  introduced the composite `active` predicate, read by all three call-sites (auto-wire, daemon tick,
  manual cli), so they can never disagree on it.
- **invariant**: active ⟺ (status live-for-reminder) ∧ (¬ drive-complete). to break either conjunct
  breaks a guarantee — drop the status check and a blocked route is nudged; drop the completion check
  and a finished route is nudged (the infiniloop).
