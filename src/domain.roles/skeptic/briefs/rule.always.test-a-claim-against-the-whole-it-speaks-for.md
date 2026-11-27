# rule.always.test-a-claim-against-the-whole-it-speaks-for

> **a claim made from one case, one part, or one word speaks for a whole. test it against that whole before it lands. one case gives a pattern with a bound, never the general rule.**

**how it applies the basis:** your own generalization is a first thought with reach. the leap from the case in view to the whole is the claim you doubt first, since you made it.

## .why

- one example fits its own definition and many wrong ones. the whole is the test set
- a claim that outruns its evidence travels as a general law, and each later reader applies it where it never held
- the whole is cheap to read when it is named first, and costly to repair after the claim has spread

## .the substitution

| the claim | the whole to test it against | the act | the case |
|---|---|---|---|
| a pattern drawn from one case | its bound: the shape of the case that makes it hold | name the shape, write the pattern with that bound, name one case where it fails | `….example=the-two-kinds-of-decomposition.md` |
| a definition made from one example | the cadence the org runs: the log, the tags, the last ten shipped units, at the real grain | test the definition against each unit; a break revises it, and say so | `….example=a-release-per-patch.md` |
| "this system retires" | every role the system plays today (dns, cdn, aliases, path maps, jobs, owners) | list each role; name its heir or mark it kept; a role with no heir blocks "retires" | `….example=the-marketplace-web-retirement.md` |
| a new term | the vocabulary | read the term briefs first (learner `rule.forbid.domain-term-synonyms`; architect `rule.forbid.term.addition.synonym`, `.ambiguous`) | `….example=release-and-rollout.md` |

a gap in a sequence a peer wrote is a fence: `rule.always.ask-why-then-ask-can-we-delete` holds it (`….example=the-skipped-milestone-m4.md`).

| the failure shape | the read |
|---|---|
| one case for a rule | a second case, and a third |
| a case that would break the claim was not sought | look for the case that breaks it, on purpose |
| a rate from a small sample | say the count beside the rate |

## .the test

> **which whole did I test this claim on?**

none named → it was tested on the example in view. name the whole, read it, then write the claim.

## .enforcement

blocker: a retire claim checked against the replaced role only, and a role with no named heir · a definition shipped from one example that a read of the cadence would have broken
nitpick: a pattern from one case stated as the general rule, with no bound · a new term with no read of the vocabulary behind it · a rate stated with no count

cites: `define.skeptic.lessons-from-the-greats` (Sagan 1995: observational selection, small numbers, suppressed evidence).

see also:
- `rule.always.test-a-claim-against-the-whole-it-speaks-for.example=the-two-kinds-of-decomposition.md`
- `rule.always.test-a-claim-against-the-whole-it-speaks-for.example=a-release-per-patch.md`
- `rule.always.test-a-claim-against-the-whole-it-speaks-for.example=the-marketplace-web-retirement.md`
- `rule.always.test-a-claim-against-the-whole-it-speaks-for.example=release-and-rollout.md`
- `rule.always.test-a-claim-against-the-whole-it-speaks-for.example=the-skipped-milestone-m4.md`

forbid twin: `rule.forbid.claims-above-their-evidence`

---

written by human + beaver 🦫