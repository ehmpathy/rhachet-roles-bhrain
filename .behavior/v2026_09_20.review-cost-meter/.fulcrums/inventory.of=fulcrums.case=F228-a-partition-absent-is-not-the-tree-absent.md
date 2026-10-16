# F228 — a partition's absent is not the tree's absent

## .the fork

5.3 i002 r003 `mech-external-contracts` ran in partitions. five of its concerns claim a live-cache
proof is absent: `blocker.1` (the warmer `[case4]` shape), `blocker.2` (no live-provider test in the
target), `nitpick.2` (eval-track), `nitpick.3` (the suite not visible), and `blocker.3` (the live
prompt-cache test absent from the diff).

the suite they ask for is `src/domain.operations/review/stepReview.casePromptCache.integration.test.ts`.
it is on the branch, and it holds the two-arm proof: one arm cold, one arm warm, with the cache-read
token count asserted. it was in a peer partition, so none of these five partitions saw it.

two answers: **(a)** concede, and add a second copy of the proof to each partition's scope ·
**(b)** dispute: the proof exists, and the review saw only part of the tree

## .taken

**(b)**, plus a fix in the tool. a partition only ever sees its own slice, so a file graded in
another partition looks, to it, like a file absent from the branch. that is a defect of the
partition prompt, not of the branch. so the prompt now names its peer partitions and their globs
after `</target>`, with the rule: a file absent from `<target>` is not evidence that the file is
absent from the branch (`asPromptTailVariable`, `getAllPartitionPeersOf`). the note goes after the
target, so the prefix that all the partitions share still caches.

## .rework

**clean.** if the council wants the live proof inside every partition that cites it, that is a
glob edit in the guard's partition declaration: one line per partition.

## .confidence

🟢 **93%** — the file exists, and its two arms carry the assertions the concerns name. what is
left of the doubt is F100 (the SOME grade of a live run on CI) and F186 (a cache-blind host,
deferred upstream). those are separate questions, and each already has its own fulcrum.

## .where

`src/domain.operations/review/stepReview.casePromptCache.integration.test.ts` ·
`src/domain.operations/review/asPromptTailVariable.ts` ·
`src/domain.operations/review/partition/getAllPartitionPeersOf.ts`

## .verdict

unruled — awaits the council.
