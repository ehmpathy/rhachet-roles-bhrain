# seed S23 — enroll lanes stay, and they take the computed scope via `$targets`

archived verbatim, before distillation (`rule.always.archive-the-wishers-words-verbatim`).

## .the utterances, in order

> should this be fixed structurally? - One reviewer correctly pointed out that my reviewer prompts only covered tracked changes, while most of this feature is untracked files. Both prompts now cover the diff plus untracked files.

> i.e., why was that possible?

> why wouldn't we just pull that in now  ?

> the point is to make low budget reviews possible for everyone easiest

> oh. so thats only for enroll brains?

> those dont use our review skill

> no no

> they should be enroll reviewers still
> sounds great on the addition of $targets var

## .settled

- a scope defect found in one prompt is a symptom; the class is that an enroll lane has no
  computed scope, so each author re-derives one in prose
- the cure is structural and ships now, not as a dream: the guard computes the review targets with
  the same function `rhx review` uses, and hands them to any guard command as `$targets`
- enroll lanes remain enroll lanes — the cure gives them the computed scope; it does not convert
  them to `rhx review` lanes
- the motive is cost: a reviewer handed its file list does not spend its budget to find one

## .landed in

- `src/domain.operations/route/guard/RUNTIME_GUARD_VAR_NAMES.ts`
- `src/domain.operations/route/guard/review/runStoneGuardReviews.ts`
- `5.1.execution.from_vision.guard` — both enroll prompts
