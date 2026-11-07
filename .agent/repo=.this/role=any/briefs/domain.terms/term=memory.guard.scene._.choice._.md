# domain.term: memory.guard.scene

term.chosen   = scene
term.kind     = noun
term.boundary = memory.guard
term.synonyms.forbidden:
- context
- frame
- state

## .what
one bash segment paired with the cwds it may run in. the guard places a relative write by its
scene: a known cwd outside memory passes; an unknown cwd beside memory blocks as `unplaced`.

## .refs
- src/domain.operations/memory/getAllBashSegmentScenes.ts   # `BashSegmentScene`
- src/domain.operations/memory/asBashCwdAfterSegment.ts

## .reason
- `term=memory.guard.scene._.choice.reason.md`
