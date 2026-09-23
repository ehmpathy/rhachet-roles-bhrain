# domain.term.choice.reason: review

## .etymology

**review** — from old french *reveoir*, *"to see again"*. the sense is exact: a review is a second
look at work already done, by a party that did not do it. the word carries no verdict of its own
and no claim about who looks, which is what lets it name the ACT while `reviewer` names the party
and `given` names what the act leaves behind.

it was **adopted, never coined**. the repo already spoke it everywhere — `rhx review`,
`RouteStoneGuardReviewArtifact`, `guard/review/`, `.reviews/peer/`, and the twenty-five
`term=route.guard.review.*` clusters that take it as their boundary segment. this cluster records
the choice that had already been made rather than makes a new one
(`rule.always.reuse-pavement-before-improvise`).

### why not the peers

| the candidate | why it was refused |
|---|---|
| **audit** | an audit is a check for COMPLIANCE against a fixed standard, and it implies a formal record and an auditor with authority. a review here converges — it converses across rounds, and the driver may refute it |
| **inspection** | an inspection looks for DEFECTS in a finished article. a review grades an artifact mid-flight and may find zero, which an inspection reads as a pass rather than a verdict |
| **critique** | it names the OUTPUT and carries a judgment of quality. the verdict here is a count, and the act is what the term must name |
| **assessment** / **evaluation** | both name a MEASUREMENT, and both are corporate-generic. neither carries *"a second look, by another party"*, which is the whole of what a review is here |

## .the three-way line — review, reviewer, given

this is the distinction the term exists to hold, and it is the one a reader most often collapses:

| the word | the concept | its record |
|---|---|---|
| **review** | one examination, against one rubric | the act — it runs, it costs a round, it ends |
| **reviewer** | the party that performs it | the `- slug:` line in the guard's YAML |
| **given** | what the act left behind | a `.given.by_peer.<slug>.md` file on disk |

⇒ the three are not interchangeable, and the engine relies on the split: a `given` outlives its
review by many generations, a `reviewer` outlives every given it wrote, and a review that ran and
produced an `unreadable` given happened without a score.

🟡 **`reviewer` carries a second sense the glossary records as an OPEN GAP** — the role, and one RUN
of that role. `term=route.guard.review.reviewer._.choice.reason.md` holds that gap and its measured
evidence. **this cluster does not close it**, and the two must not be confused: the gap is about
`reviewer`, and `review` is unambiguous.

## .the boundary

**`route.guard`, and it is the deepest boundary the term admits.** the test — *"a review, of
WHAT?"* — answers *"of an artifact a guard gates."* a review that is not run by a guard is not this
concept at all; it is the english word.

⇒ so `review` is itself the boundary segment of twenty-five deeper terms, and this cluster is what
makes those twenty-five legal: `rule.require.boundary-qualified-terms` grades *"a boundary that
names no declared term"* a blocker, and every one of the twenty-five took `route.guard.review` as
its boundary while the middle segment named naught.

## .disputes

none raised. the word was in use before the glossary existed and no traveler has argued a peer.

## .evidence

- **the gap was DECLARED before it was closed.** `term=route.guard.review.reviewer._.choice.reason.md`
  recorded it verbatim — *"`review` itself is still undeclared, and it is the boundary segment of
  nine terms now"* — so this cluster discharges a debt the glossary itself carried rather than one
  a reviewer invented. the count has since grown from nine to twenty-five, which is the cost of the
  delay stated as a number
- **the cue that fired** — i002/r001 n1, on a diff that shipped `computeReviewCompleted`. a new
  domain operation composed the term, and `rule.require.domain-term-itemization` binds every word
  that composes a declared operation. ⇒ the rule fired exactly where it was meant to: at the moment
  the undeclared word entered a new contract
- **the refused peers were enumerated before the word was kept**, per
  `rule.require.enumerate-before-you-name`. five candidates, each refused for a nameable reason, and
  the extant word won on the merits rather than on inertia
