# domain.term.choice.reason: route.guard.review.peer

## .etymology

**peer** — from the latin *par*, "equal". a peer review is a review by an equal rather than a
superior, which is exactly the relation the guard models: a peer **rejects** and **blocks**, and it
cannot **approve passage** — only a human may do that. so the word carries the authority boundary in
its own root.

it was chosen over:

| rejected | why |
|---|---|
| `reviewer` | too broad — the **self** reviews too (`review.self/`), and the judge renders a verdict. `peer` names the one kind that converses |
| `critic` | one-sided. a peer may approve; a critic only faults |
| `checker` | mechanical. it loses the conversation, which is the whole shape of `converse`/`unanswered` |

## 🔴 .why `lane` is forbidden in a contract, though it is the natural prose word

**`lane` is the word a driver reaches for**, and for a real reason: when a review overflows its
context window, what failed is the *configured run* — its glob, its budget, its rubric — rather than
a person. *"the lane overflowed"* reads truer than *"the peer overflowed"*.

⚠️ **and that intuition does not survive the type.** `RouteStoneGuardReviewPeer` already holds the
slug, the run, the budget, and the level in one declared object. **the configuration and the party
are one entity in this domain**, so two words for it is `rule.forbid.domain-term-inconsistency`: one
concept named two ways, with no canonical term declared.

⇒ **the carve-out stands.** `rule.forbid.domain-term-synonyms` permits a synonym in a **comment**,
where it describes the concept from an alternate perspective. so `lane` in prose is legitimate and
useful; `lane` in a dobj name, a signature, a flag, or a guard key is not.

## .evidence

### the gap was declared, and stayed open while its boundary shipped

`domain.terms/.readme.md` listed `lane` among the open gaps: *"`bhrowser` · `dark` · `lane` · `judge`
· `task` — each is spoken in a booted brief with no cluster behind it."*

🔴 **what the census could not see is that the CANONICAL word was the absent one.** `peer` is the
boundary prefix of **sixteen** extant clusters — `term=route.guard.review.peer.*` — and had no
cluster of its own. the gap list named the synonym and never the term it is a synonym **of**.

⇒ that is the same limit the readme records for its own census: *"a census records the gaps someone
looked for; it cannot record the ones nobody did."* an unqualified boundary reads as a namespace
rather than a word, so no reader thought to ask whether it was itemized.

### measured, 2026-09-07

| check | result |
|---|---|
| `grepsafe 'lane' --path src --glob '*.ts'` | **2** real hits, both in test **comments** — zero in any contract |
| `globsafe 'domain.terms/*peer*'` | **0** files — no cluster, though `RouteStoneGuardReviewPeer` is declared |
| clusters under the `route.guard.review.peer` boundary | 16 |

⇒ the prose usage was already correct under the extant carve-out. **the defect was the absent
canonical entry, never the synonym's use.**

## .disputes

**none open.** `lane` is recorded as a forbidden contract synonym rather than disputed, since it
names no distinct concept — the declared type holds both senses the word would separate.

⚠️ **a dispute would be legitimate on one ground and is not raised here:** if the guard ever split
its configuration from its party — a `RouteStoneGuardReviewLane` that several peers may run — then
`lane` becomes a second concept and earns its own cluster. that split does not exist today, so the
word stays a synonym.
