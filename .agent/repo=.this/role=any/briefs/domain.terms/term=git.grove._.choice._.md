# domain.term: grove

term.chosen   = grove
term.kind     = noun
term.boundary = git           # every worktree discoverable on one machine
term.synonyms.forbidden:
- fleet
- farm
- forest
- workspace    # an editor's overload — one tree in most tools, a multi-root set in some; forbidden for both halves (`tree` too)

## .what

a **grove** is every git worktree discoverable on one machine — the container `tree` comes in.

a grove is machine-local, and that is a property, never an oversight. it is discovered by
filesystem walk, so its membership is "every tree checked out here", never "every tree that
exists." a figure reported over a grove carries that bound and must state it.

`tree` is git's own word, imported. `grove` is ours: git declares no container for a set of
worktrees, so the concept had no name until it was coined.

## .refs

- src/contract/cli/review._.cost.ts                         # `--of grove`
- src/domain.operations/review/grove/getAllReviewTrees.ts   # the walk that defines membership
- .behavior/v2026_09_20.review-cost-meter/1.vision.experience.dimensions.md   # the `breadth` axis

## .reason

- `term=git.grove._.choice.reason.md`
