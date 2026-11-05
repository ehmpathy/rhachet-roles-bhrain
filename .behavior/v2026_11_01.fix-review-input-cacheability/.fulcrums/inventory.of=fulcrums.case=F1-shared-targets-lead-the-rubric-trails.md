# F1 — shared targets lead, the rubric trails

## .the fork

- **A, taken.** the head (system message, pin source) holds instructions + output format + targets;
  the tail holds the lane's rubric, refs, then conversation. a level's lanes that bind one corpus
  share one head and one prime.
- **B.** keep the rubric in the head (today). each lane's head is unique; lanes share only ~2.3k
  chars of instructions, and pay the corpus each.

## .why A

breadth outranks stability (`rule.require.order-prompt-bytes-by-reuse-breadth`): the corpus is
shared by 8 of 9 lanes within seconds; the rubric by one. measured on
`rhachet-roles-bhrain.beav.fix-status-line-cpu`: targets are ~88% of a `5.1` prompt, rules + refs
7.3%. A trades ≤7.3% of cross-round reuse (and heavy rounds mostly arrive past the reach anyway)
for (N−1)/N of the corpus within the round.

## .rework

clean. a layout change behind `compileReviewPrompt` and its census markers; no caller contract,
no route artifact, no stored state depends on the order. a revert is the same diff backwards.

## .confidence — 75%, and why low

- it reverses a deliberate design: the head was built rubric-in-the-system-slot, and tests clamp
  it (`reviewPromptCacheAnatomy.test.ts:525-528`)
- the verdict effect of rubric-last is unmeasured. the content is identical and the instructions
  read correctly in either order, but a model may weigh a late rubric differently. only a live A/B
  settles it, and the bounds forbid a live call in ci
- it assumes lanes of one level bind byte-identical targets — true of the guard read, unproven
  across every guard template
- the openrouter adapter sends no affinity pin, so the cross-lane read lands on a shared replica by
  the floor's host choice and chance, not by construction, until the pin is dispatched and lands
- the rubric-in-head design rested on a pin this adapter does not have; the clamp that holds it
  guards a premise that is false

## .where

`src/domain.operations/review/asPromptHeadStatic.ts:125-139` (rules + refs inside the head) ·
`src/domain.operations/review/compileReviewPrompt.ts:107-121` (head, then tail)

## .verdict

ruled 2026-11-05 by the director: **A**. the rubric and refs trail the corpus a level's lanes share.
the verdict bar is content equality — the same content in a new order — with no hand-run review.
the lever is the corpus a level shares, not a lane's second round.

## .consequences measured after the verdict

the verdict named the layout, not each test it retired. these are its measured costs, recorded so a
later reader can weigh them against it. none is a separate verdict; the director may overturn any by
name:

- the cross-round prefix majority on the one-target worst case is lost: `reviewPromptCacheAnatomy`
  `[case1]` falls 79.1% → 33.9% and 70.5% → 30.2%; its floor is re-pinned at 0.25
- a lane's own second round shares less: `[case5]`'s margin over the counterfactual falls to 51.8%
  vs 51.0%; `[case6]` 82.2% → 56.9% and 44.1% → 18.9%
- the prefix ends ahead of `## rules`: a rubric edit no longer voids the corpus, and a corpus edit
  voids the rubric
- one rubric on a new target no longer reads warm (the retired `casePromptCache` premise)

each has a row in `5.3.verification.yield.md` `### test lock-ins retired`.
