# domain.term.choice.reason: fulcrum

## .etymology

a **fulcrum** is the point a lever pivots on — the place where a small force moves a large load.
the driver's own guide states the metaphor directly:

> *a fulcrum is a point where a small choice tips a large outcome. a name that will spread. a shape
> that many callers will lean on. a boundary that later work must respect.*
> — `howto.navigate-fulcrum-choices.[guide].md`

⇒ the word carries the **asymmetry**, which is the whole reason the record exists: one row costs
the driver seconds, and its absence costs the human a hunt.

the rejected alternatives, and what each loses:

| word | what it loses |
|---|---|
| `decision-point` | it names any decision. the leverage — what makes it worth a human's attention — is absent |
| `crossroads` | it presumes two visible paths, so it cannot name a low-confidence call with no rival in view |
| `pivot` | overloaded — in this org's prose a pivot is a change of direction taken, not a choice recorded |
| `judgment-call` | it names the act and not the artifact, and the artifact is what the council reads |

## .why it was owed a cluster — the `seed` precedent

`rule.require.domain-term-itemization`'s test asks whether the word composes a **declared** domain
object or operation. no TypeScript `Fulcrum` is declared, so a literal read says the term is not
owed.

**that read is refuted by this glossary's own contents.** `term=artifact.seed` was declared on identical
ground: no code object, one filename contract (`inventory.of=seeds`), and one rule that governs
it. `fulcrum` carries exactly the same three:

| | `seed` | `fulcrum` |
|---|---|---|
| a code dobj/dop | ✗ | ✗ |
| a coordinate in a filename contract | `of=seeds` | `of=fulcrums` |
| a rule that binds on it | `rule.always.archive-the-wishers-words-verbatim` | `rule.always.itemize-the-fulcrums-you-best-guess` |

⇒ **a coordinate IS a contract.** `rule.forbid.itemization-without-coordinates` makes
`of=$concept` the dereference mechanism, so the concept name is a promise every future reader
computes a path from. a word in that slot binds as tightly as a type name does.

## .disputes

### dispute: fork  —  raised 2026-08-30  —  status: RESOLVED (both stand; they name different concepts)
- raised.by  = the driver, mid-drive
- claim      = the driver rule opens *"when you best-guess a design **fork** mid-drive"*, and each
               entry carries a field literally named *"the fork"*. two words for one concept is
               what `rule.forbid.domain-term-synonyms` forbids, so one should go
- counter    = they are not one concept. a **fork** is two options in view with one taken; a
               **fulcrum** is a call the council should see. the 93%-confidence trigger, settled
               the same day, produces fulcrums with **no fork at all** — the entry's own field
               instructs the author to *"state what you would have weighed had one been in view"*,
               which is only sensible where no fork existed
- resolution = both stand. `fork` names a **part** of a fulcrum entry, never the whole. it is
               therefore **not** recorded as a forbidden synonym, and a brief may use it for the
               two-option shape. dispute closed

⚠️ **the confidence floor is what settled this**, and it did so the same day the word was paved.
before the floor, every fulcrum had a fork, and the two words were indistinguishable in practice —
which is precisely how a synonym pair survives unnoticed.

## .evidence

**the measured case for the record's existence.** on route
`v2026_07_26.feat-keyrack-vault-aws-params`, four fulcrums (#56 general-help pollution, #57
reference-set verify, #59 re-point terminology, #61 github-app journey) were recoverable **only**
by a read of the verification yield's prose. a summary would have surfaced all four at a glance.

**the wisher settled the artifact's form directly**, 2026-08-28:

> *"keep the `.fulcrums/` dir and also enumerate into `inventory.of=fulcrums._.md` and
> `inventory.of=fulcrums.case=$case.md`… thats the inventory pattern… always the inventory manifest
> file itself, along with each entry of each case in the inventory."*
>
> (`.behavior/*/.seeds/inventory.of=seeds.case=S09-fulcrums-are-an-inventory.md`)

**the wisher set the confidence threshold**, 2026-08-30:

> *"briefs that are less than 93% confident on, we should capture as fulcrums for human to review
> as separate fulcrum files"*

⇒ that utterance is the one that widened the concept past the fork, and it is why the `.what` leads
with *"a call… that a human should see"* rather than with a choice between options.

## .the invariant

**a fulcrum is appended at the moment it is made, never swept at the end.** three items are lost
in a sweep, and each is the half a reviewer needs most: the fork you rejected, the reason as it
stood at the time, and the live rework judgment. `rule.always.itemize-the-fulcrums-you-best-guess`
carries the enforcement.
