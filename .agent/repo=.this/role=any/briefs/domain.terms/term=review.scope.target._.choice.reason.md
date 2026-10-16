# domain.term.choice.reason: target

## .etymology

a target is what a shot is aimed at. a review aims its rubric at a set of files and may hit only
those; that is the sense the word carries, and the contract already spoke it before any cluster
did — `scope.targetFiles`, and some twenty declared operations named `*Target*`.

rejected:
- **subject** — reads well for the whole set (*"the subject of this review"*), and so cannot also
  name one member of it
- **candidate** — implies a filter not yet applied. a target has passed every filter: the bind,
  the polluter check, the join
- **input** — already a prompt-block word (`PromptInputName`). a target is sent AS one or two
  inputs, so to call it an input fuses the file with the bytes that carry it

## .boundary

`target` also appears in this repo outside review scope — `computeStoneGuardOverruleTarget` names
the stone a human overrule is aimed at, and `validateTargetDirectory` names the dir a reflection
writes into. the boundary `review.scope` keeps this sense apart: one file a review judges.

## .evidence

- the declared shape: `scope: { ruleFiles, refFiles, targetFiles }` (`setInputArtifacts.ts`)
- the family of declared operations above, all built on this one noun, with no rival word in any
  of them
- invariant: every target is graded by exactly one reviewer call; under a partition split, a
  `common` target is graded once and read as context in the rest
