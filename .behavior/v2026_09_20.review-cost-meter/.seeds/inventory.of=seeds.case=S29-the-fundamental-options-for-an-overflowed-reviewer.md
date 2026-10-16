# seed S29 — the fundamental options for an overflowed reviewer

archived verbatim, before distillation (`rule.always.archive-the-wishers-words-verbatim`). typos
repaired; word choice and order kept.

## .the utterance

asked after `5.3.verification` arrived and 8 of 9 peer reviewers refused for overflow:

> hold on. why isnt this already automatically done?

> like are the changes on main actually that large? or are they mostly polluted

> what are tactics we can employ to either eliminate pollution or tune what inputs we send

> ideally, all would fit within the given bounds already

> hold on. this still doesnt answer the question of what our fundamental options are

> for example (1) split the review targets in parallel, (2) allow fetch of full files via turns via
> progressive disclosure - but always push the diffs, (3) show only the radius of lines around the
> diffs, etc

> ok, lets catch dreams for the fundamental options i proposed above

> and also, how do we know if some reviewers are partitionable or not?

> and if they are partitionable, how do we track when the contents were not changed -> that that
> partition's result is cacheable ?

> lets catch those questions in the partition dream

## .settled

- an overflow is a **design** question, not a per-guard chore: a reviewer whose scope exceeds the
  window should still fit "within the given bounds already", by a mechanism the tool owns
- three fundamental options, each a dream:
  1. **partition** the targets across parallel calls under one rubric
  2. **progressive disclosure** — always push the diffs; the reviewer fetches full files over turns
  3. **a radius** of lines around each diff hunk, in place of the whole file
- partition carries two open questions, owed an answer before the build: **which rubrics may be
  partitioned**, and **when a partition's verdict may be reused** because its contents did not change

## .landed in

- `.dream/v2026_10_04.amend.review-partitions-its-targets-across-parallel-calls-when-a-reviewer-overflows.md`
  (both open questions inside it)
- `.dream/v2026_09_30.feat.reviewers-progressively-disclose-their-own-targets-via-tooluse.md`
  (amended — the option was already a dream; a second was not laid beside it)
- `.dream/v2026_10_04.amend.review-sends-a-radius-of-lines-around-each-diff-hunk.md`
