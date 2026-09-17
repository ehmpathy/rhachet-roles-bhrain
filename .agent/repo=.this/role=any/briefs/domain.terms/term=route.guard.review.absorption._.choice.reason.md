# domain.term.choice.reason: absorption

## .etymology

latin *absorbere* — *to swallow up, take in*. to **absorb** a concern is to take it into your own
process and render a disposition on it: `dispute` (take it in as an argument to the council) or
`concede` (take it in as a commitment to fix). the recorded disposition is an **absorption**.

⇒ **the word carries no claim of correctness**, and that is why it fits: a driver who disputes may
be wrong, and a driver who concedes may be over-generous. the term describes that the concern was
**taken up and answered**, never whether the answer holds.

🔴 **`absorption` supersedes `stance` (S20).** the driver's disposition was first named `stance`; the
wisher settled a better word — the driver *absorbs* each concern. the supersession is recorded under
`.disputes` below.

## 🔴 .why `verdict` is forbidden

the route domain already has a **judge**, and a verdict is what the judge renders
(`computeReviewThresholdVerdict`, `computeReviewPeerVerdict`). to reuse the word for the driver's
declaration overloads one word onto two concepts on opposite sides of the same gate —
`rule.forbid.domain-term-ambiguity`, exactly.

⇒ the two must stay apart, because the whole design turns on the order: **an absorption is an INPUT
to the arithmetic; a verdict is its OUTPUT.**

## .the words it beat

| candidate | why not |
|---|---|
| `stance` | 🔴 SUPERSEDED — the driver *absorbs* a concern; `stance` named the posture, where the domain act TAKES the concern UP. kept as a forbidden synonym |
| `verdict` | 🔴 overloaded — the judge's word. see above |
| `position` | generic english; it names no review-domain object, and it collides with the ordinal in `--about nitpick.4` |
| `decision` | a decision may be about any subject at all; an absorption is about a concern, and only ever two-valued |
| `response` / `reply` | ⛔ these name the `taken` — prose the reviewer re-reads. an absorption is read by the **judge**, never by the reviewer |

## .why the set is closed at TWO

a third kind would be a driver who neither argues nor agrees — which is **silence**, and silence is
the state an absorption exists to end. the gate's whole purpose is to refuse a stone that carries an
un-absorbed concern.

⚠️ **`--as blocked` is not a third kind.** a halt declares naught about any concern; it reports an
absent grant. `rule.always.raise-a-blocker-a-taken-cannot-close` draws the line: *"a `.taken`
converges an ARGUMENT, never an ABSENCE"* — and an absorption converges neither, it **declares**.

## .evidence

- `S02` — *"the conversation resolves most of them"* ⇒ an absorption must not silence the loop, so it
  cannot be a third, terminal option beside repair and refutation
- `S05` — *"each fulcrum is a single dispute"* ⇒ the per-concern grain
- `S06` — the mechanism is a **tally exclusion**, so an absorption is read by the judge
- `S07` — the atom is a **concern**, so the absorption's target is one
- `S19` · `S20` — the driver **absorbs** each concern; `absorption` supersedes `stance`, and the act
  composes a coarse grain (the `.taken`, gated on each concern)

## .disputes

### dispute: stance → absorption  —  raised 2026-09-15  —  status: RESOLVED (absorption prevails)

- raised.by  = the wisher
- claim      = *"stance is a forbidden term that was superceeded by absorb; propogate this as well"* —
  the driver ABSORBS a concern; the recorded disposition is an absorption. `absorb` also composes a
  second grain: absorb-the-feedback (the `.taken`) is gated on absorb-each-concern
- counter    = `stance` was the invented umbrella (`F007`), and it read cleanly — but it named a
  *posture*, where the domain act TAKES the concern UP, and it gave the feedback grain no shared word
- resolution = keep `absorption` as the noun (`disputed`|`conceded` unchanged), `absorb` as the verb
  (`setStoneAsAbsorbed`); record `stance` as a forbidden synonym. see `S20`, `F007`, `F038`,
  `define.invariant.review.peer.absorb`
