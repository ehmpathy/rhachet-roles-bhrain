# domain.term: reach

term.chosen   = reach
term.kind     = noun · verb     # the set of sessions whose stops the hook runs at; to be in it
term.boundary = learn.terms.hook
term.synonyms.forbidden:
- scope        # `review.scope` holds it for the files a review judges
- audience     # implies a reader; the hook runs, it is not read

## .what

the **reach** of the term hook is the set of sessions whose stops run it. on the split layout it
reaches sessions enrolled via `rhx enroll` that hold the learner; on the old layout, every claude
session in the repo while the learner is linked. a plain `claude` on the split layout is not
reached. `enable` and `get` name the reach, so a caller whose own stops never hold is not surprised.

## .refs

- src/contract/cli/asTermsHookReachLeaves.ts    # the `reaches` and `plain claude` leaves
- src/domain.operations/learn/termsHook/getOneTermsHookTarget.ts  # the layout that decides it

## .reason

- `term=learn.terms.hook.reach._.choice.reason.md`
