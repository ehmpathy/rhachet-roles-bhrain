# define.invariant.review.peer.dispute.sure-misread-owes-a-reflection

## .what

> **a dispute the driver is sure the reviewer misread owes a reflection, never a halt.** the driver
> names the rule or rubric line that misled the reviewer and dispatches its fix upstream, so the same
> misfire stops in every repo.

## .kind

**nurture.** the team chose it. a sure misread is a defect in the rubric, not a question for this
human. to route it to the human fixes the one repo and leaves the rubric to misfire again. the 0.90
line is a policy, a self-graded one, drawn where a driver would defend the call against the reviewer.

## .invariant

```
F.owed = reflect  ⟺  F.ground = wrong ∧ F.confidence ≥ 0.90
F.owed = human    ⟺  otherwise

--as disputed, F.owed = reflect  ⟹  refused without --reflect <owner>/<repo>#N
--reflect on a dispute with F.owed = human  ⟹  refused, as a false report
```

- `ground` is `wrong` (the concern is not a defect: the reviewer misread, or it is out of scope) or
  `dirty` (the concern is real, and its fix is massively dirty). the two grounds are the only ones
  (`term=route.guard.review.absorption.dispute`)
- `confidence` is the weakest call the fulcrum holds, read from the `--why` fulcrum's frontmatter. no
  `--confidence` flag exists: the number lives in one home (`the-fulcrum-is-the-one-home`)
- `--reflect` names the upstream task, a GitHub issue, as `<owner>/<repo>#N`. the dispatch rides the
  extant `radio.task.push`

## .why

a reviewer that is wrong in a way a driver is sure of is a rubric that misleads. a human who rules on
it fixes this one stone, once. a dispatch to the rubric's owner fixes every later review in every
repo. the same misfire, seen twice, is a cost the fleet pays twice.

⇒ the reflection is the cheap fix for a sure misread, and the human is the wrong reader for it: the
human cannot repair a rubric they do not own, and the driver has already read the evidence.

🔴 **a dirty dispute has no misled reviewer.** the reviewer was right, and the fix costs too much for
this pull. no rubric line is at fault, so `--reflect` has no honest target. a dirty call is a scope
call, and a scope call is the human's. so a dirty dispute owes a human at every confidence, and
`--reflect` on one is refused as a false report.

## .scope

- it governs `--as disputed` at write, where the fulcrum's frontmatter is read (a fulcrum with absent
  or invalid frontmatter is refused at the same moment, with the field list the linter names)
- `owed` is derived at write from `ground × band`, never typed by hand
- it does not govern a concession. a driver that agrees with the reviewer fixes the concern
- the reflection is a defect report for the rubric's owner. it does not settle the stone's concern:
  the dispute still sheds that one concern from the tally, as every dispute does

## .the litigation

the first rule read "at 0.90 or more, force a reflection". that holds for a misread and breaks for a
dirty call: a driver would write a rubric defect against a reviewer who was right, so the
reflection would be a lie told to satisfy a flag. the band alone is the wrong key. the key is ground
and band together: only a wrong ground at 0.90 or more reflects. every other cell goes to a human.

the number is read from the fulcrum, never typed on the command. a flag would hold the number twice,
once in the file and once on the line, and two homes drift.

## .the counter-argument

*"the line is a self-grade, so a driver who wants to skip the human grades 0.91."* stated fairly, and
real. two things bound it. the reflection costs a real upstream issue, with a named rule and a named
fix, and a driver that fabricates one leaves the fabrication in the owner's tracker where it is read
and closed as noise. and a wrong-ground dispute at 0.91 still sheds only the one concern it names,
and the fulcrum stays on the route for any later reader. the restraint is social and countable,
never mechanical, the same shape as the grade of an `urgent` concession.

## .what would overturn it

- a measured case where upstream reflections were closed as noise at a high rate. that would argue
  that the band is too low, or that the reflection needs a second reader
- a rubric owner that cannot be named for a repo (no upstream). `--reflect` would then need a local
  target, and the invariant stays

## .enforcement

- a wrong-ground dispute at 0.90 or more accepted with no `--reflect` = **blocker**
- `--reflect` accepted on a dirty-ground dispute, or under 0.90 = **blocker** (a false report)
- a dirty-ground dispute derived `owed: reflect` at any confidence = **blocker**
- a `--confidence` flag that stands beside the frontmatter number = **blocker** (two homes)
- enforcer: the dispute path in `route.stone.set` (`setStoneAsConcernAbsorbed.ts`), with
  `--reflect` admitted by the flag owner (`getStrayFlagRefusal.ts`). the clamp: a wrong-ground dispute
  at 95% with no `--reflect` is refused; with the enforcer reverted, it is accepted

## .see also

- `define.invariant.review.peer.dispute.reconciled-at-the-human-gate` — where `owed: human` lands
- `define.invariant.review.peer.dispute.the-fulcrum-is-the-one-home` — where the confidence lives
- `term=route.guard.review.absorption.dispute` — the two grounds
- `rule.forbid.lazy-review-deferrals` — a dirty dispute is never "minor" or "later"
