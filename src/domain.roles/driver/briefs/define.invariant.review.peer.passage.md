# define.invariant.review.peer.passage

## .what

the **root law** of the review system. a guarded stone passes only when three conditions hold at
once. the other five `define.invariant.review.peer.*` laws are each a sub-law of one condition — this
is where they nest.

## .the invariant

```
PASS ⟺  (a) every peer guard is TERMINAL
      ∧ (b) every concern that COUNTS is ABSORBED
      ∧ (c) the residual TALLY is under its allowance
```

all three, always. a stone that clears one and skips another has not passed — it has a silent hole.

## .the three conditions, and the sub-law under each

### (a) every peer guard is TERMINAL

terminal = `approved | exhausted | malfunction | constraint | overruled`. a reviewer still
`queued | ready | rejected` is a hard blocker, never a silent zero.

- the ladder ORDERS execution — a dearer higher level runs only once the cheaper lower level is
  terminal — but the order is not the gate. **all-guards-terminal is the gate.** a level terminal
  *for unlock* does not clear a *later* level for passage.
- ⇒ sub-law: **`define.invariant.review.peer.exhausted`** — a guard is `exhausted` only if it was
  SKIPPED (budget spent before the attempt), never if it ran. exhaustion is terminal-for-unlock; it
  does not discharge a `.taken` debt the guard raised before its budget ran out.

terminal is necessary, not sufficient — a per-verdict consequence still applies, and `approved` is the
ONLY verdict a driver passes on alone:

| terminal verdict | required act before passage |
|---|---|
| `approved` | none — clears autonomously |
| `exhausted` | a human `--as approved`, OR — if a live urgent concession stands — a human budget grant |
| `malfunction` | a human `--as overruled` |
| `constraint` | a human `--as overruled` |
| `overruled` | already forgiven (a human act put it there) |

### (b) every concern that COUNTS is ABSORBED

to **absorb** a concern is to render its disposition — `disputed` or `conceded` — with its argument.
a body of feedback is absorbed only once every concern within it is (the composition).

- ⇒ sub-law: **`define.invariant.review.peer.absorb`** — `feedbackAbsorbed(given) ⟺ ∀ concern :
  absorbed(concern)`. the feedback-grain act (the `.taken`) is refused until each concern carries a
  disposition.
- ⇒ sub-law: **`define.invariant.review.peer.absorption.disputable-regardless-of-verdict`** — which
  concerns a driver MAY absorb-as-dispute: any the tally INCLUDES, approved lane or rejected lane
  alike. OWED (a rejected lane must be absorbed) ≠ PERMITTED (any included concern may be).

### (c) the residual TALLY is under its allowance

the `reviewed?` judge sums the residual concerns **stone-wide** (across every non-overruled lane,
after disputes shed their concerns) and compares to one allowance. over the allowance holds the stone.

- ⇒ sub-law: **`define.invariant.review.peer.budget.urgent-earns-budget`** — only a live `urgent`
  concession earns an increased budget, and the driver owes its human a written why the stone bought
  it; an all-`better` (or no-urgent) hit is good enough and proceeds with no human.
- ⇒ sub-law: **`define.invariant.review.peer.judge.urgent-guides-the-budget-ask`** — when the judge
  holds on a live urgent concession, it GUIDES the driver to the human budget-ask, the way `approved?`
  guides to the approval-ask.

## .kind

**nature.** the three conditions are not a policy — they are what *"the review passed"* MEANS: every
reviewer reached an end state, every concern it raised was answered, and what remains is within the
bound the stone declared. a design that dropped any one would let a stone pass on feedback it never
answered. the sub-laws under each condition carry the nurture choices (the closed urgent set, the
budget floor); the three-way conjunction itself is the domain's.

## .the litigation

condition (a) settled first, and it settled against the read that feels most natural: that a terminal
*prior* level buys a skip of the levels above it. it does not. a stone cannot pass until **every**
peer-review guard is terminal, and the ladder orders execution rather than gates it.

⇒ the argument is the one in `.the trap this guards`, below: that read conflates terminal-for-unlock
with clear-for-passage, and a design that took it would pass a stone on reviews that never ran.

condition (a) is the core. conditions (b) and (c) are the absorb and budget
sub-laws: the reviewer runs and renders a verdict, and the driver must ABSORB each concern and hold
the residual tally under allowance. all three are conditions of the one `passage` law.

## .the trap this guards

`terminal` reads at two scopes — **terminal-for-unlock** (lets the next level run) vs
**clear-for-passage** (approved-or-overruled). never conflate them: a prior level terminal-for-unlock
does not make a later level clear-for-passage. the extant code models the split
(`computeReviewLevels.ts`: `isReviewLevelClearForPassage` vs `isReviewPeerLevelTerminal`).

## .detection

the passage decision reasons over the **level ladder state** (which levels are unlocked, whether each
is clear-for-passage) AND the **absorb + tally state** (every included concern absorbed, residual
under allowance) — never over a file-based tally of present review artifacts. a file-centric tally is
blind to an unlocked level that should have a verdict but produced no file.

## .enforcement

- a stone that passes while any unlocked peer-review level is non-terminal = **blocker** (condition a).
- a stone that passes while any concern the tally includes stands un-absorbed = **blocker** (condition b).
- a stone that passes while the residual tally exceeds its allowance = **blocker** (condition c).
- a passage decision that tallies present review *files* rather than unlocked *levels* = **blocker**.

## .see also

- `define.invariant.review.peer.absorb` — condition (b): each concern absorbed, the `.taken` gated on it
- `define.invariant.review.peer.absorption.disputable-regardless-of-verdict` — condition (b): which concerns MAY be absorbed
- `define.invariant.review.peer.exhausted` — condition (a): exhausted ⟺ skipped
- `define.invariant.review.peer.budget.urgent-earns-budget` — condition (c): only urgent earns budget
- `define.invariant.review.peer.judge.urgent-guides-the-budget-ask` — condition (c): the judge surfaces the ask
- `howdoes.the-review-gates-you-drive-within` — the read for the driver, of these three gates
- `define.passage-statuses` — only `passed` constitutes valid passage
