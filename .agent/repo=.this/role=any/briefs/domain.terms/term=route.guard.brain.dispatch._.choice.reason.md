# domain.term.choice.reason: route.guard.brain.dispatch

## .etymology

from the logistics sense: to **dispatch** is to send out toward a destination, with the outcome
open. a dispatcher records what went out and when; a dispatcher does not claim it arrived.

⇒ that open outcome is the whole reason the word was taken. every nearer synonym closes it, and a
closed outcome is a claim this repo cannot keep.

## 🔴 .the fact the word is shaped around, measured

`rhachet/dist/contract/cli/invokeCloneSay.js:107-123` — `clone say` polls the target transcript
until the message lands, then prints `delivered: true`.

⇒ **`delivered` is rhachet's word and it overclaims at this boundary.** the message arrived in a
pty. whether the brain-cli parsed `/model opus` as a slash command, refused the slug, or echoed it
as prose is a fact about the transcript's NEXT line, which `clone say` never reads.

🔴 so this repo could not adopt `deliver` without importation of the overclaim. it took a verb one
notch weaker on purpose, and every render downstream inherits that honesty:

| render | what it says |
|---|---|
| the outcome `requested` | the switch went out; the live brain is unconfirmed |
| `formatStoneBrainUndispatched` | a switch was owed and did not go out |

## .disputes

### dispute: say — raised 2026-09-12 — status: RESOLVED (both, at two scopes)

- raised.by  = the synonym rule's own test, applied to the imported vocabulary
- claim      = rhachet declares `clone say` as the wire verb. a second verb for the same act is a
               synonym, and `rule.forbid.domain-term-synonyms` forbids one in a contract
- counter    = they are two acts, not one. `say` puts a message into a pty and knows no reason
               for it. `dispatch` is the ROUTE's act — *this stone declared a brain, so put a switch
               in motion* — and it composes `say` to do it. the test that parts them is the
               boundary question: *"$word, of WHAT?"* — `say`, of a message; `dispatch`, of a
               brain switch
- resolution = keep both, at their own scopes. `dispatchBrainSwitch` calls `rhx clone say`, and
               🟡 **the boundary qualification is what makes this legible** — an unqualified
               `dispatch` in this repo would read as a rival to `say` rather than as its caller

### dispute: apply — raised 2026-09-12 — status: RESOLVED (keep `dispatch` for the wire act)

- raised.by  = the wish's own prose, *"the hook applies it automatically"*
- claim      = the wisher's word for the whole act is `apply`
- counter    = `apply` names the ORCHESTRATION, and this repo kept it there —
               `applyStoneBrainOnEntry` is the declared operation at the stone-entry edge. what it
               may not name is the wire act, because `apply` implies the effect took hold, and
               that is precisely the half `clone say` cannot observe
- resolution = **both words ship, at different grains**: `apply` for the entry orchestration,
               `dispatch` for the wire act it composes. the wisher's word is honored where it is
               true and refused where it would overclaim

## .evidence

### the operations the verb composes

| operation | its grain |
|---|---|
| `applyStoneBrainOnEntry` | 🔵 orchestrator — the stone-entry edge, once per entry |
| `setStoneBrain` | 🔵 orchestrator — read the address, then dispatch |
| **`dispatchBrainSwitch`** | 🟠 **communicator** — the raw wire boundary, `{ submitted: boolean }` |

⇒ the verb sits on the **communicator**, which is the grain `define.domain-operation-grains`
declares for *"raw i/o boundary … verify external communications are functional"*. **a communicator
that claimed effect would be a communicator that did translation**, which is the grain boundary it
exists to hold.

### the convergent-applier premise

the wisher, 2026-09-11: *"it preserves the conversation, no worries"*.

⇒ a redundant `/model` changes the engine and leaves the session whole, so an unconditional
dispatch's worst case is **benign** — the clause `rule.require.fewer-paths-via-idempotency` turns
on. `F14` deleted the compare-before-act on that ground, and the verb carries no implication of one.

## .invariants

- a dispatch returns on submit, never on accept — its contract is `{ submitted: boolean }`
- a dispatch is preceded by an address read; it never assumes a slug
- a dispatch is reserved by a `BrainDispatchClaim`, so two peers cannot interleave one switch
- a dispatch reads no live brain state first (`F14`), so it is convergent rather than conditional
