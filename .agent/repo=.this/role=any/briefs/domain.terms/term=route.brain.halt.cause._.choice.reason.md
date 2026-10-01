# domain.term.choice.reason: route.brain.halt.cause

## .etymology

`cause` names WHY a halt occurs, distinct from the halt itself — the STATE.

rejected alternatives:

- `reason` — a synonym of `cause` with no distinct sense; `rule.forbid.domain-term-synonyms`'s
  exact target (two words, one concept)
- `type` / `kind` — each value is an independent explanation with its own remedy; `type` reads as
  a classification with no causal claim attached

## .disputes

none raised.

## .evidence

the closed set, declared in `StoneBrainHaltCause.ts`:

| cause | source | signal |
|---|---|---|
| `unenrolled` | `getCloneAddress` | `clone whoami` exit 2 |
| `killed` | `getCloneAddress` | `code === null` — an external signal |
| `unreadable-clone` | `getCloneAddress` | any other non-zero exit |
| `unreadable-payload` | `getCloneAddress` | json parse failed |
| `unreadable-address` | `getCloneAddress` | `asCloneAddress` returns null |
| `timed-out` | `getCloneAddress` | the 2s cap |
| `spawn-failed` | `dispatchBrainSwitch` | the `rhx` binary never launched |

## .invariants

- a `CloneAddressRead` carries exactly one cause when, and only when, `address` is null
- the set is closed — a new cause needs a term proposal, not a string literal added ad hoc
