# S21 · the `reviewed?` judge GUIDES the budget ask, just as `approved?` guides the approval ask

- **kind** = a scope ask + a required invariant
- **said** = 2026-09-14, over the `reviewed?` judge's halt output after an urgent concession.

## .said — verbatim

> the reviewed? judge should also guide the robot to ask the human for budget, due to the urgent
> concession in the last round.

> just like the approved? judge explains that the human must approve … add that invariant … and
> make it so.

## .settled

a judge that holds a stone on a **human-only** remedy must NAME that remedy. the `approved?` judge is
the model, stated outright: it holds on absent approval and prints the approval-ask, so `reviewed?`
must hold on a live urgent concession and print the budget-ask.

| the judge | what holds it | who lifts it | what it must print |
|---|---|---|---|
| `approved?` | absent human approval | a human | the approval-ask command |
| `reviewed?`, urgent concession | a live urgent concession over the allowance | a human budget grant | the budget-ask command |
| `reviewed?`, better/none | the sum over the allowance | the **driver** | no human named — the driver's own top-up |

⇒ the third row is the bound that keeps the second honest, and it is `S16`'s rule seen from the
judge's seat: a `better`-only hit is the driver's own lever, so the judge must not summon a human
there.

## .the defect this corrects

a `reviewed?` judge that holds on an urgent concession and prints only `passed: false` **strands**
the driver — the remedy is a human's, and the judge stayed silent on it.

## .landed

- `define.invariant.review.peer.judge.urgent-guides-the-budget-ask` (driver) — the invariant the
  utterance asked for by name.
