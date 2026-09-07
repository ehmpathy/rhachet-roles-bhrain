# domain.term: contrastive

term.chosen   = contrastive
term.kind     = adj
term.boundary = prose
term.synonyms.forbidden:
- comparative
- oppositional
- exclusionary

## .what
`contrastive` describes **a clause that excludes ONE named alternative in a stated binary** — *"a
claim, never a verdict"* · *"structure, never voice"*.

it wears the same words as `prose.absolute` — `never`, `always`, `no` — and it is the shape those
words take when they **bound** a claim over one alternative rather than **quantify** over a set.

## 🟡 .it exists to carve a false positive out of a rule, and that is its whole job

`rule.forbid.absolutes` grades an unwalked quantifier a blocker. its own enforcement line reads
*"false positive: a **contrastive** `never`"*, so the term is what the rule dereferences to say what
it does not grade.

⇒ a rule that names a false positive with no term behind it hands each reviewer a judgment and no
shared word for the call.

## .the shape it is parted from

| shape | what it does | verdict |
|---|---|---|
| `prose.absolute` | asserts a property over an unwalked set | 🟡 a termsmell |
| `prose.contrastive` | excludes ONE named alternative in a stated binary | permitted |

⇒ **the tell is whether you can name what the word ranges over.** *"a claim, never a verdict"* ranges
over ONE alternative, and it is on the page · *"it never fails"* ranges over every run that ever
happened, and the author walked zero.

## 🟡 .the boundary is `prose`, and the thinker's sense is why

`contrastive` is already spoken in this repo for **a method of definition** — a concept fixed by its
distance from its neighbours. that sense and this one share the english and part on what they
describe:

| the sense | what it names | where it lives |
|---|---|---|
| a method | a concept defined by its distance from a peer | `contrastive coordinates` · `contrastive implication` · `contrastive analysis` (`role=thinker`) |
| **a clause shape** | one named alternative excluded in a binary | `rule.forbid.absolutes` (this boundary, booted) |

🟡 the thinker's uses sit in prose and in `.scratch`, never in a dobj, a dop, or a published flag —
so `rule.forbid.domain-term-ambiguity` does not grade it a blocker today. the qualified form is what
keeps the next round from that grade.

## .why each synonym is forbidden

| word | why not |
|---|---|
| `comparative` | ranks two things on an axis; this excludes one outright |
| `oppositional` | reads as a stance the author takes, and this term must grade the clause |
| `exclusionary` | true, and it names no BINARY — which is the property that bounds the claim |

## .the test it is defined by

> **can you name what the word ranges over?**

one alternative, on the page → contrastive. permitted · a set the author did not walk →
`prose.absolute`, and the repair is the count or the bound.

🟡 **the test forks, and the fork is not settled.** a clause can be contrastive in SHAPE and a
quantifier in SUBSTANCE — *"a reviewer never reads code"* names one alternative and still claims a
property over every reviewer. the carve-out admits it, and `rule.require.disputable-claims` is what
catches it downstream.

## .refs
where the term composes declared contracts:
- src/domain.roles/telepath/briefs/rule.forbid.absolutes.md       # the rule whose false positive it names
- src/domain.roles/telepath/briefs/rule.forbid.absolutes.md.min
- src/domain.roles/telepath/boot.yml                              # the say-tier wire

## .reason
see the ref-level cluster beside this choice:
- `term=prose.contrastive._.choice.reason.md` — the measured corpus that priced the carve-out, the
  thinker overload, and the open fulcrum on whether the carve-out holds

## .see also
- `term=prose.absolute._.choice._.md` — the shape it is parted from
