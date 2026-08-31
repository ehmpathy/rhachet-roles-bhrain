# seed: a brief that compensates dies with its defect

**2026-08-31. a question that turned a defect-fix into a brief-retirement — and named a class the
repo had no cue for.**

## .said

> this seems like once its fixed upstream will not be even relevant right?
>
> src/domain.roles/driver/briefs/rule.always.rerun-dark-review-lanes-scoped.md.min

## .settled

**a brief written to teach a reader around a defect is mostly deleted by the fix, and the residue
belongs inside the rule that already owns the case — never beside it.**

worked against the brief in question, once an overflowed lane grades `malfunction` rather than
`constraint`:

| what it teaches | survives the fix? |
|---|---|
| *"a dark lane reads much like a lane that ran — treat it as a task, never a verdict"* | 🔴 dies. the generic rule says this once the class is right |
| the `constraint` / `malfunction` disambiguation rows | 🔴 dies. already in the generic rule |
| the **scoped re-run recipe** | ✅ survives |
| *"do NOT re-derive the inherited diff scope"*, with its cited evidence | ✅ survives |

⇒ so the residue is **one row in a table that already exists**, not a peer brief. and the reason the
peer brief had to exist at all is that the generic rule's cause list **omitted the overflow case** —
a gap that only became visible once the classification was questioned.

## 🔴 .the durable cue

> **when a brief's job is to teach a reader around a defect, its lifespan is the defect's. before
> you write one, ask what survives the fix — and put THAT in the rule that owns the case.**

⚠️ **the tell is retrospective and cheap: a brief that exists to reinterpret a status code.** it
reads as domain knowledge and is really a workaround with a filename
(`im_an.obsessive_learner`'s *fix at source* cue, applied to a brief rather than a skill).

⇒ and it composes with `rule.always.catch-dreams-for-followups`: a dream that repairs a defect must
also name **what the repair retires**, or the workaround artifact outlives its reason and teaches a
reader to route around a defect that is gone.

## .landed

- `.dream/v2026_08_31.fix.overflowed-lane-grades-constraint-not-malfunction.md`
- `src/domain.roles/driver/briefs/rule.always.diagnose-reviewer-malfunctions.md`
- `src/domain.roles/driver/boot.yml`
- `.dream/v2026_08_14.reseed.rhachet-remove-ejected-driver-rules.md`
