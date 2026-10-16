# domain.term.choice.reason: tree

## .etymology

git calls the unit a `worktree` — a checked-out tree of files, as against the object store it
comes from. this repo shortened it to `tree` in every surface that speaks of one: `rhx
git.repo.get --tree`, the `--of tree` breadth, and each roll-up that groups `by tree`. the short
form reads as one syllable beside `run` and `grove`, the other two positions of the `breadth` axis.

## .rejected peers

- `checkout` — the act that fills a tree. to name the tree by it confuses an operation with its
  product
- `workdir` — a shell idiom for a cwd. a cwd may sit deep inside a tree, and a tree's identity is
  its root, never the dir a command ran from
- `workspace` — an editor concept that names one tree in most tools and a multi-root SET in some
  (a vscode multi-root workspace). one word on both sides of the pair is the overload
  `term=git.grove` rejects it for, so it is forbidden for the member and the container alike
- `repo` — a repo is the object store; one repo may have many trees. the grove walk keys on the
  tree root precisely because two trees of one repo are two cost scopes

## .boundary

`git`, a peer of `git.grove`. the concept is git's; the cost meter is merely the first reader
that needed a word for it at every breadth.

## .disputes

### dispute: worktree — raised 2026-10-03 — status: RESOLVED (keep both, one concept)
- raised.by  = the `repo-rules-briefs` lane, i054, which named `tree` un-itemized
- claim      = `tree` and `worktree` are two words for one concept, which
               `rule.forbid.domain-term-inconsistency` forbids
- counter    = `worktree` is git's own long form, imported, and extant contracts carry it
               (`worktreeName` in the reflect scope). `tree` is its short form, not a rival
               word. a forbid on `worktree` would brand git's own vocabulary a synonym
- resolution = `tree` is chosen for new contracts; `worktree` stays legal as git's long form
               and is never forbidden. the two never name different concepts

## .evidence

- declared op `getAllReviewTrees` — its noun is `tree`
- `--of tree`, a declared position of the `breadth` axis (`term=review.breadth`)
- `term=git.grove` names `tree` as the half its coinage completes
