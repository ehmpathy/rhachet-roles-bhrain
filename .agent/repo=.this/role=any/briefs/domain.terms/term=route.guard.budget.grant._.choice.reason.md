# domain.term.choice.reason: grant

## .etymology

**grant** — from anglo-french *granter*, *"to consent, to allow"*. the whole force of the word is
that **another party permits it**. you do not grant yourself; a grant is made to you.

⇒ that is precisely the claim this behavior needed to make. the budget was a lever a driver pulled;
it became a bound a driver may pass only where the round was earned. **a word that carries "someone
else allows this" states the change in one syllable**, and every refused peer below states the
opposite.

### why not the peers

| the candidate | why it was refused |
|---|---|
| 🔴 **topup** | it names a self-service act — you top up your own phone, your own tank. the word would have *undone* the design in the glossary while the code enforced it. ⚠️ it is also the extant word in `formatReviewBudgetTopupCommand`, so this is a live inconsistency the rename does not sweep (see below) |
| **extension** | it names the RESULT and hides who allowed it. it also collides with a file extension, which this repo reads constantly (`.guard`, `.stone`) |
| **increase** / **bump** | pure arithmetic. neither carries a permission, and `bump` is casual enough to trivialize a bound that costs a written harm claim |
| **credit** | it implies a balance that may be spent later. a grant is consumed by the round it buys, per reviewer — there is no balance to carry |

## 🟡 .the extant `topup` inconsistency — recorded, not swept

`formatReviewBudgetTopupCommand` is the canonical renderer of the command string, and its name
carries the refused word. so the repo currently speaks both.

⇒ **it is left in place until disturbed**, per `rule.forbid.domain-term-synonyms`: a synonym already
in a contract may stay until a change touches it, and a bulk rename is forbidden outright here —
a find-and-replace cannot part a CITATION of the old name from an INSTANCE of it, and several sites
quote shipped render text verbatim.

🟡 the honest read: **`topup` names the COMMAND a driver runs, and `grant` names what the gate
decides about it.** those are arguably two concepts, which is why the inconsistency is a nitpick
rather than a defect. a later traveler may settle it either way.

## 🔴 .the collision with `route.mutate grant` — two concepts, one word, two boundaries

| | this term | the other |
|---|---|---|
| **boundary** | `route.guard.budget` | `route.mutate` |
| **what it permits** | one raise of a reviewer's budget | a WRITE to the route's own files |
| **who may earn it** | a driver, with a warrant | a human only — it checks the actor |
| **what it leaves** | a raised `budget:` + a warrant line on stdout | a privilege flag on disk |

⇒ **this is not a `rule.forbid.domain-term-ambiguity` violation, and the boundary rule is why.**
that rule's own repair table sorts by the test *"$word, of WHAT?"* — two answers means QUALIFY, one
answer with two referents means SPLIT. here there are two answers (*of a budget* · *of a mutation*),
so the qualified pair is legal and the flat namespace never has to hold both.

⚠️ **the hazard is real in PROSE, where the boundary is not written.** a sentence that says *"the
grant is refused"* is ambiguous between them, and this behavior's own vision hit that: a line that
read *"∨ the caller is a human"* in the budget gate's formula had imported the OTHER grant's actor
check (raised i002/r009 n1). ⇒ prose that names either must say which.

## .disputes

none raised.

## .evidence

- **the cue that fired** — i002/r001 n1. `computeBudgetGrantRefusal` and `BudgetGrantMeter` are
  declared contracts that compose the word, and `rule.require.domain-term-itemization` binds it
- **the measured collision** — the `--help` text and `term=route.guard.budget._.choice._.md` each
  carried *"a human may grant regardless"*, imported from the `route.mutate` sense. a human who runs
  `route.guard.budget` is refused exactly as a driver is. ⇒ one word over two boundaries produced a
  false claim in a published cli surface, which is the strongest evidence this cluster could carry
  for why the boundary must be written
- **five candidates were enumerated before the word was kept**, per
  `rule.require.enumerate-before-you-name`
