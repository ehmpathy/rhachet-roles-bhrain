# domain.term.choice.reason: refusal

## .etymology

**refusal** — from old french *refuser*, *"to decline, to turn back"*. it names a **decision by a
party**, addressed to a request. that is exactly the shape here: the driver asked, the gate decided,
and the decision has a reason the driver can act on.

it is the natural mate of `grant`. **the two are one decision seen from its two outcomes**, so they
share a boundary and a shape, and a reader who holds one holds the other
(`rule.prefer.symmetric-term-pairs`).

### why not the peers

| the candidate | why it was refused |
|---|---|
| 🔴 **rejection** | already taken, for a DIFFERENT concept one boundary up — a `rejected` reviewer verdict is a review that found concerns. one word over two senses in one subsystem is `rule.forbid.domain-term-ambiguity`, and this pair would have met in the same directory |
| **denial** | it reads as a moral judgment on the asker, and it names no fix. the whole design of this verdict is that it hands over a runnable command |
| **block** | already taken — `--as blocked` is a stone passage status, and `blocked` is a halt kind the drive renders. a third sense would be the third collision in this subsystem |
| 🔴 **error** / **failure** | the sharpest refusal of the five. an error implies a FAULT — a malfunction the caller may retry. a refusal is a correct, expected outcome of a gate that works, and a bare retry refuses identically. ⇒ to call it an error would send a driver into a retry loop the gate can never break |

## 🔴 .the refusal-vs-error line, and it is an exit code

`rule.require.exit-code-semantics` makes the distinction mechanical rather than aesthetic:

| | a refusal | an error |
|---|---|---|
| **exit code** | 2 — a constraint | 1 — a malfunction |
| **what a bare retry does** | refuses identically | may succeed |
| **who fixes it** | the caller, by a named act | the system, or the clock |
| **what stdout/stderr carry** | the facts + the command to run | the fault |

⇒ **the words must not be traded, because a caller routes on the difference.** a driver told *"error"*
retries; a driver told *"refused"* converges. the second is the one that ends.

## .the three kinds are CLOSED, and the closure is the point

`BudgetGrantRefusal` is a discriminated union of three, never a message string. so:

- the renderer states facts the gate already computed, rather than a re-derivation that can drift
- a new conjunct is a new `kind`, and the type refuses a render that does not handle it
- a test can assert WHICH conjunct failed, which is what lets the acceptance suite prove the gate's
  ORDER rather than merely its outcome

🟡 **the discriminant is `kind` rather than `reason`**, and that was a deliberate call: `reason` is
already taken in this exact subsystem for free-text prose (`PassageReport.reason`, which
`asConcessionReasonDisplay` parses). one word over a closed tag and an open string is the ambiguity
this glossary exists to prevent.

## .disputes

none raised.

## .evidence

- **the cue that fired** — i002/r001 n1. `computeBudgetGrantRefusal` returns a `BudgetGrantRefusal`,
  a declared contract, and `rule.require.domain-term-itemization` binds every word that composes it
- **three of the five refused candidates are already spoken for in this subsystem** — `rejection`
  (a reviewer verdict), `block` (a passage status and a halt kind), and `error` (an exit-code
  class). ⇒ the enumeration was not ceremonial: it found that the obvious words were taken, which
  is the case `rule.require.enumerate-before-you-name` exists to catch before a contract ships
- **the refusal-vs-error line is CLAMPED**, never merely argued:
  `blackbox/driver.route.peer-budget-refusal.acceptance.test.ts` asserts exit 2 on all three kinds,
  and asserts the refusal lands on stderr rather than stdout
