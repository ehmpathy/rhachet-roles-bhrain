# seed S33 — declared partitions, and an overflow refusal that names the lever and where to upstream it

archived verbatim, before distillation (`rule.always.archive-the-wishers-words-verbatim`). typos
repaired; word choice and order kept. one thought, sent as a run of short messages. it sharpens S29,
which named partition and radius as options and left open who decides a partition.

## .the utterance

after the S32 split showed `review/` is mostly additions:

> and we can imagine ways to solve our problem here

> either via partitions or radiuses

> probably, if its partitions, we need to propose to the author to have them set the allowed
> partitions for each rule. i.e., guide them on failure to either set
> `--partitionable {blackbox,domain.operations/review,domain.operations/xyz}` for each reviewer.
> MAYBE, we even make that a review skill that allows folks who use the reviews to opt into
> partitions dynamically too. e.g. in this case we know that the warmer stuff is independent of the
> other stuff, so we can say `--partition-isolatable review/warmer` ; which says 'that one can have
> its own partition', dynamically

> and the 'context too large' stderr can guide the recipient to use that lever

> or, to use the lever to decrease the target suffixes or something

> i.e., guides to either narrow the review scope or declare isolatable partitions

> AND, it should also guide that if the reviewer is run out of a route, guide them to recommend any
> generically applicable isolations or narrowages upstream into the declaration of the route. (e.g.,
> into the bhuild behavior dir, if its a behavior route - based on the provenance reported)

then, after the driver explained the upstream row (a route's guards are stamped from a template
another repo owns, so a cut proven generic belongs in that template):

> yes, exactly. it should guide folks to dispatch a task with the suggestion upstream.

then, on a draft that shipped both `--partitionable` and `--partition-isolatable`:

> why do we have these synonyms?

> we should pick a flag and stick with it

## .settled

- 🔴 **whether a rule may be split is declared, never guessed** (this answers S29's open question
  of who decides):
  - the **author** declares it per reviewer: `--partitionable {a,b,c}`
  - the **user** may isolate one subtree at the call site — offered as a "MAYBE"
  - 🔴 **corrected: ONE flag, `--partitionable`.** the author's declaration and the caller's
    carve-out are one concept (a declared partition), so they share one flag; who typed it is not
    a distinction a flag should carry. it repeats, so a caller adds a subtree with one more
    `--partitionable`
- 🔴 **the overflow refusal names the lever, never only "reduce scope".** it guides to one of two:
  - **narrow the review scope**: a tighter bind, fewer target suffixes, a smaller radius. this
    reaches edited bodies
  - **declare partitions** (`--partitionable`): the only lever that reaches additions
- **when the reviewer ran from a route**, the refusal also says to recommend any cut that applies
  generically upstream into the route's declaration (e.g. the bhuild behavior templates). the
  destination is read from the run's provenance
- 🔴 **the upstream guidance is a dispatch, never a mention.** the refusal names the task to send
  to the template's owner — a suggestion that stays in stderr is lost with the round

## .open

- none. the three prior opens are best-guessed as `F90` (grammar, on the review line), `F92` (merge
  by sum into one output), and the provenance read by `getOneReviewGuardProvenance`

## .landed in

- `src/contract/cli/review.ts` — `--partitionable`, repeatable
- `src/domain.operations/review/partition/`
- `src/domain.operations/review/asReviewOverflowLeverLines.ts`
- `src/domain.operations/review/emitReviewOverflowRefusal.ts`
- `src/domain.roles/reviewer/briefs/howto.partition-an-overflowed-review.md`
- `src/domain.roles/driver/briefs/rule.always.diagnose-reviewer-malfunctions.md`
