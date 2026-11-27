# rule.forbid.i-dont-know-answers.example=the-pnpm-patch-skill-mods

> 2026-11-18, nheuron. the human asked whether rhachet needs a task to support pnpm-patch style skill mods. the seat answered "I do not know". one call held the answer.

## .the shape, in any life

a shop clerk tells a customer "no idea if we stock that". the stock list is one click away on the screen at her hand. what could I look up in one step, before I say I do not know?

the case below: the answer was one issue pull away, and the phrase "I do not know" cost the human three corrections.

## .the question

inbox 2026-11-18: whether a task must be dispatched to teach rhachet pnpm-patch style skill mods. it follows two entries on the same subject (, ): that the pioneer role must lift mods up through `repo=.mods`.

## .the answer given

an "I do not know" (relayed by the surdirector's coordinator; the text is in the director seat's transcript). within the next eight minutes the human replied three times: the phrase is no answer, it is forbidden, and the seat can always figure it out.

## .the read that settles it

`rhx radio.task.pull --via gh.issues --from ehmpathy/rhachet --exid 702` returned:

> issue #702 is not a radio task … "title": "feat(roles): mod a consumed role in place, via .agent/repo=.mods"

the feature the human asked about is an open issue, so the answer to "do we need to dispatch a task" has a first part: no new task for the base feature; cite #702. the read ran once and cost one call.

## .the answer the rule owes

> no new task for the base feature: ehmpathy/rhachet#702 (`feat(roles): mod a consumed role in place, via .agent/repo=.mods`) covers it. open: whether its scope reaches a patch of one skill file, as pnpm patch reaches one file of a package. read: the body of #702 · open: the title says "in place", the body decides file grain.

the open part names a read and the reason the read did not settle it, never "I do not know".

## .the cost

the human's turn, three corrections, and an order to forbid the phrase.

## .the lesson, by law

- the limit "I do not know" was a read not run. the issue was one call away
- a Stop check was built to refuse the reply that held the phrase; it matched words, flagged honest prose as often as a dodge, and left the role on 2026-11-26. the ban rests on the rule

up: `rule.forbid.i-dont-know-answers`
