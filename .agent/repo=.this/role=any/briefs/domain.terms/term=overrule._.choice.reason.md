# domain.term.choice.reason: overrule

## .etymology
why `overrule`: in law and debate, a superior authority **overrules** a subordinate's decision —
a judge overrules a sustained objection and sets it aside by the weight of a higher office. the
fit is exact: the human (the higher authority) sets aside a reviewer's block, not by a dispute of
its merit but by the authority to wave it through.

chosen over the rejected synonyms:
- **override** — too generic and mechanical (a config override, a method override); it names a
  value replacement, not an authoritative pardon of a specific gate.
- **bypass** / **skip** — each implies an escape *around* the gate, unseen. the whole point of
  this behavior is that you can NOT skip a rung; you can only authoritatively forgive one. to
  name the act "skip" would invite the exact defect the wish exists to close.
- **veto** — a veto blocks an action; an overrule *unblocks* one. opposite polarity.
- **wave-through** — informal, and already forbidden under `forgive`.

overrule vs forgive: `forgive` is the *effect* (a rung's blockers no longer gate passage);
`overrule` is one *mode* that causes it — the early, per-rung human grant. the other mode is the
late `--as approved`. so overrule is a distinct, narrower concept, not a synonym of forgive.

## .disputes

### dispute: overruledAll (a single overrule that forgives every rung) — raised 2026-07-25 — status: RESOLVED (ripped)
- raised.by  = wisher
- claim      = a judges-only stone had no peer *levels*, so its overrule was written level-less
               and read as `overruledAll` — a stone-wide grant that short-circuited every review
               and judge check at once (the largest-blast-radius escape).
- counter    = "zero level-less overruledAll bypass allowed. rip that shit out … it always goes
               one level at a time." an overrule that forgives more than one rung is a
               skeleton key: it destroys the per-rung, loud, attributable safety the ladder
               depends on. the judge is not a gate outside the ladder — it is the top rung
               (`JUDGE_LEVEL`), overruled the same way any rung is.
- resolution = the `overruledAll` marker was removed entirely. every overrule now scopes to
               exactly one rung; a judges-only stone's overrule targets the judge rung
               (`JUDGE_LEVEL`); a legacy level-less record maps to that same judge rung. one act,
               one rung — enforced in code (`define.review.human-forgiveness.md`).

## .evidence
- discovery: scenario narrative — the wish's day-in-the-life (overrule l1 → l3 becomes ready →
  driver must still drive l3 to terminal). the human-forgiveness brief distills the full
  experience suite (early overrule vs late approval) as a BDD-style timeline.
- invariant: every overrule forgives exactly ONE rung; the judge is the top rung. a single act
  that forgives more than one rung = defect (`define.review.human-forgiveness.md`,
  `define.invariant.review.peer.passage.md`).
