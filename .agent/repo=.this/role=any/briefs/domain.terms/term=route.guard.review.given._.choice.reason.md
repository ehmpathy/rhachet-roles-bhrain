# domain.term.choice.reason: given

## .etymology

a nominalized past participle: **what was given**. the reviewer *gives* its verdict; the artifact
that carries it is *the given*.

🔴 **it was chosen for its PAIR, never on its own.** `given` and `taken` are one decision, and the
argument for each is the other:

| the artifact | the actor | the verb beneath it |
|---|---|---|
| `.given.by_peer` | the reviewer | it **gives** a critique |
| `.taken.by_self` | the driver | it **takes** that critique — receives it, and answers |

⇒ *give* and *take* are the plainest complementary verbs in english, so a reader who learns one has
learned the other. that satisfies `rule.prefer.symmetric-term-pairs` (ergonomist): matched shapes for
complementary labels. the suffixes carry the same symmetry — `by_peer` against `by_self`.

## .why not the obvious alternatives

| rejected | why |
|---|---|
| `critique` / `feedback` | names the **content**, so it has no complement. what would the driver's file be called — `critique-response`? the pair collapses into a compound |
| `comment` | overloaded by every code-review tool, and too light for a verdict that can carry blockers |
| `issue` | implies one item; a given carries a whole round's verdict, often several items plus counts |
| `report` | 🔴 **taken already** — `.report.md` is the detail file that sits *beside* a given. to reuse the word would overload one term across two artifacts, which `rule.forbid.domain-term-ambiguity` forbids outright |

## ⚠️ .the ambiguity this term survives, and why the boundary is load-bearing

`given` collides with the BDD `given:` clause, and this repo writes a great many gherkin timelines —
so the two words appear within a few lines of one another routinely.

it is **not** an overload, because they sit in different domains: one is a review artifact, one is a
precondition clause in a test grammar. but the collision is real enough that the boundary segment
earns its keep. `rule.require.boundary-qualified-terms` asks *"$word, of WHAT?"* — and the answer
here is **of a review**, never of a scenario.

⇒ a bare `term=given` would have been a defect. `term=route.guard.review.given` is not.

## .evidence — the transport is hash-agnostic, and that is what makes the pair work

`enumRouteGuardReviewPeerConversationFiles.ts` unions givens, reports, and takens into the
`$conversation` a reviewer receives on a re-run. **measured 2026-09-04** on
`.behavior/v2026_09_03.fix-contemplation-gate-on-entrance`: takens were written at their givens'
hash, artifacts were then edited so the current hash moved, and both reviewers still read them on
the next round.

⇒ so a given and its taken stay paired across an edit, **in the conversation transport**.

🔴 **the transport was never the half that was broken — the status read was, and it is now fixed.**
the transport had always been hash-agnostic; the contemplation status read keyed on the current
hash, so the two disagreed about whether a pair survived an edit. `fix-contemplation-gate-on-entrance`
closed that split: the status read now takes the latest given per slug across every hash, and matches
a taken by the path its given derives. **both halves are hash-agnostic today, and for the same reason
— a pair is identified by its own path, never by the hash that happens to be current.**

⚠️ **and a reviewer never sees its own fresh given** — `runStoneGuardReviews.ts:136-140` excludes it,
so a reviewer re-reads its prior round and the driver's answer, never its own words from this round.

## .disputes

none raised.

## .see also

- `term=route.guard.review.taken._.choice._.md` — the other half of the pair; read them together
- `term=route.guard.review.contemplate._.choice._.md` — the verb that pairs a taken to a given
- `contract.reviewer-output` (bhrain/reviewer) — the numeric counts a given must carry
