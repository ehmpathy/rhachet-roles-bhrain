# domain.term.choice.reason: grove

## .etymology

coined 2026-09-20, to complete a container pair whose inner half already existed.

this repo speaks `tree` for a git worktree — `rhx git.repo.get --tree`, and every roll-up that
groups `by tree`. the set of them had no word, so the first surface reached for `fleet`.

`fleet` is a mixed metaphor: a fleet is ships. a reader who holds `tree` cannot infer `fleet`
from it, which is the one job a container word has. a grove is what trees come in, so the pair
reads without a lookup.

## .the rejected peers

| word | why not |
|---|---|
| **fleet** | ships, not trees. breaks the metaphor the inner half already set |
| **farm** | implies cultivation and rows; a grove implies only proximity, which is the true relation |
| **forest** | unbounded and wild. a grove is a *bounded, known* set, which matches a filesystem walk |
| **workspace** | already an editor concept: it names one tree in most tools, and a multi-root set in some — an overload on both sides of the pair, so `term=git.tree` forbids it too |

## .the evidence

the word was settled by the wisher against the driver's `fleet`, in two rounds:

- **S4** named the defect: three surfaces on three name axes, and `fleet` among them
- **S5** caught that the fix had not landed — `F1` argued `grove` in its body and wrote `fleet`
  into its verdict, and every downstream artifact inherited the verdict

the second round is the evidence worth its ink. a container word can be argued, concluded, and
still not adopted, because a verdict line is what downstream copies and an argument already
concluded is what nobody re-reads.

## .the invariant

> a figure reported over a grove states its membership bound, or it misleads.

a grove is discovered by filesystem walk. two machines with the same repos checked out
differently yield different groves, so a grove-wide total is **real and machine-local**. a
render that omits that bound invites the reader to take it as organization-wide.

## .disputes

_(none yet)_
