# domain.term: tree

term.chosen   = tree
term.kind     = noun
term.boundary = git           # one checked-out git worktree, on one machine
term.synonyms.forbidden:
- checkout     # names the act that fills a tree, never the tree
- workdir      # a shell idiom; it names a cwd, which may sit deep inside a tree
- workspace    # an editor's overload — one tree in most tools, a multi-root set in some; forbidden for both halves (`grove` too)
- repo         # binds only where it would name a TREE: a repo is the object store, one repo may
               # hold many trees, and each tree is its own cost scope. `repo` for the store stays legal

## .what

a **tree** is one checked-out git worktree: a directory with its own HEAD, its own index, and its
own `.log/`. it is the contained half of the `grove` pair — a grove is every tree on one machine.

`tree` is the short form of git's own `worktree`. both name one concept; `worktree` stays legal
where git's long form is the clearer read (`worktreeName`), and `tree` is the form every new
contract takes.

## .refs

- src/contract/cli/review._.cost.ts                         # `--of tree`
- src/domain.operations/review/grove/getAllReviewTrees.ts   # `get` + `all` + `review` + `tree`
- `term=review.breadth._.choice._.md`                       # `tree`, a position of `--of`
- `term=git.grove._.choice._.md`                            # the container

## .reason

- `term=git.tree._.choice.reason.md`
