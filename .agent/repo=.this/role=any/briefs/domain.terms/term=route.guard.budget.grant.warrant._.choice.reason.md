# domain.term.choice.reason: warrant

## .etymology

**warrant** — from old north french *warant*, *"a protector, a defender"*, and by the 14th century a
**document that authorizes an act**. the modern sense keeps both halves: it is a document you can
**hold up**, and what it authorizes is **bounded by what it says**.

⇒ both halves carry weight here. a driver at a dry meter must hold up a recorded grade, and the
grant it authorizes is bounded to the one stone that grade sits on.

### why not the peers

| the candidate | why it was refused |
|---|---|
| 🔴 **justification** | it names a **rhetorical** act — you justify a decision, in prose, to a reader who may or may not accept it. the whole design is that the gate reads a FACT rather than an argument. a word that invites prose would invite a driver to write the prose |
| 🔴 **reason** | already taken in this exact subsystem, for free-text prose — `PassageReport.reason`, which `asConcessionReasonDisplay` parses and `genRouteGuardExhaustedReason` writes. one word over an open string and a closed fact is `rule.forbid.domain-term-ambiguity`, and the collision would sit two files apart |
| **proof** | it overclaims. a proof is checkable by a party who trusts nobody; this is a claim the driver made about its own work, visible on the record. ⇒ to call it a proof would state a strength the design does not have, which is the same overclaim `F07` records as the design's widest seam |
| **entitlement** | it names a STANDING rather than an EVENT — an entitlement persists, and this lapses the moment the lane speaks again. a word with no expiry would hide the freshness rule the design most depends on |
| **permission** | it names what another party grants, which is the `grant`'s job one boundary up. the pair would be one concept under two words (`rule.forbid.domain-term-synonyms`) |

## 🔴 .the line that parts a warrant from a justification, and why it is the design

| | a warrant | a justification |
|---|---|---|
| **what it is** | a row on `passage.jsonl` with a `severity` field | prose a reader weighs |
| **who reads it** | the gate, mechanically | a human, with judgment |
| **can it be argued with?** | no — it is present or absent | yes, and at length |
| **what a driver does to make one** | grades a concern `urgent` | writes a paragraph |

⇒ **the requirement the wish stated is exactly this line** — *"a fact the tool reads, never a judgment
a clone asserts"* — so the term that names it must not invite the second shape. a word is a cue, and
a cue that reads as *"write your reasons here"* would produce reasons.

🟡 **the honest bound:** the SEVERITY that mints a warrant is still the driver's own rank, so the
bound is a claim on the record rather than a lock (`F07`). what the word buys is that the claim is
**structured, keyed, and visible** rather than prose the gate must interpret. that is a smaller
guarantee than `proof` implies, which is why `proof` was refused.

## 🟡 .why it is boundary-qualified four deep

*"warrant, of what?"* → **of a grant** · *"grant, of what?"* → **of a budget** · *"budget, of what?"* →
**of a guard** · *"guard, of what?"* → **of a route**. every segment names a real ancestor, so the
chain is the full ancestry `rule.require.boundary-qualified-terms` demands rather than a decorative
prefix.

⚠️ and the depth is not ceremony: `warrant` is a common english word that another subsystem could
plausibly reach for — a credential warrant, a release warrant. the qualified name leaves the flat
slot free.

## .disputes

none raised.

## .evidence

- **the cue that fired** — i003/r001 b1. `asBudgetGrantWarrantLines` and `getLiveUrgentWarrantSlugs`
  are declared operations whose names compose the word, the `no-warrant` discriminant carries it into
  a declared contract, and the published refusal copy says *"a warrant covers one"*.
  `rule.require.domain-term-itemization` binds every one of those
- 🔴 **the word arrived AFTER its own sweep, and that is the case worth a record.** the i002/r001 n1
  taken claimed *"every word this diff's operations compose is now itemized"* — true when written.
  `warrant` was then coined by the i002/r004 and i002/r008 repairs, in the same round, and no second
  sweep ran. ⇒ **an itemization claim is true of a diff at an instant, and a later repair in the same
  round can falsify it.** the durable lesson: sweep after the last repair, never after the first
- **five candidates were enumerated before the word was kept**, per
  `rule.require.enumerate-before-you-name`, and two of the five (`reason`, `permission`) turned out
  to be already spoken for in this subsystem — which is the outcome that enumeration exists to catch
