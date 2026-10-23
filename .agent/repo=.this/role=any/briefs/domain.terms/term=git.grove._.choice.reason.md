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

### dispute: grove, as rhachet's settings layer  —  raised 2026-10-16  —  status: RESOLVED (qualify, no coinage)
- raised.by  = driver, self-review of `.behavior/v2026_10_16.fix-status-line-binds-own-actor`
- claim      = rhachet ≥1.49 names a brain dir's user-level layer `settings.of.grove.json` (an
               arrow to `~/.claude/settings.json`), so a driver init that reads that layer says
               "the grove" — a second referent for this repo's `git.grove`
- counter    = the two senses differ by BOUNDARY, never by root: both name "what this machine
               holds", one as a set of worktrees, one as the claude settings every tree on it
               inherits. per `rule.require.boundary-qualified-terms` that is a qualify, not a split
- resolution = in prose, the settings sense is written qualified — "the grove settings layer"
               or "rhachet's grove layer" — and always beside its path `~/.claude/settings.json`.
               a bare `grove` stays `git.grove`. the label `layer = grove` in the status-line
               init's stdout stands: it mirrors rhachet's own filename, and the `settings =` leaf
               beside it prints the path
