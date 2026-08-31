# rule.always.get-a-second-opinion-before-foreman

## .what

> **do not knock on the foreman's door until you have phoned a friend.**

before any escalation to the human — a `--as blocked`, a halt, a "which do you prefer?" — you owe
one **peer opinion** from another role. escalation to the foreman is the last resort; a second
opinion is the step immediately before it.

⚠️ **this is a driver rule, though its subject is review.** the reviewer is the peer **phoned**,
never the one who phones — a rule about when to place the call belongs with the caller. it is the
last rung of the same ladder `rule.always.spend-own-levers-before-escalation` sorts.

## .why

the human's attention is the scarcest resource in the loop, and **a peer's is not.** so a halt
that a peer could have dissolved spends the expensive resource while the cheap one sat idle.

three things a second opinion does that a self-review structurally cannot:

1. **it sees what one brain misses.** a self-review re-reads its own model of the problem; a peer
   arrives with a different one. that is the entire premise the route's peer-review ladder rests
   on, and it does not stop where a bound route ends
2. **it converts a "stuck" into a "decided".** most halts are not walls — they are forks where the
   driver could not defend a guess. a peer who states the tradeoff turns it into a best-guess, and
   `rule.always.defer-fulcrums-to-last` takes it from there
3. **it makes the escalation better when it IS warranted.** a halt that arrives with a peer's read
   attached — *"the mechanic agrees this needs a credential only you hold"* — costs the human one
   turn instead of a diagnosis

⇒ the discipline mirrors `rule.always.converge-to-terminal` and
`rule.always.spend-own-levers-before-escalation` (driver): **spend every cheaper lever first, and a
peer is a cheaper lever than a human.**

## .the rule

| you are about to | you must first |
|---|---|
| run `--as blocked` | get a peer read on whether it is truly a wall |
| ask the human "which do you prefer?" | ask a peer — a fork is exactly what a second opinion resolves |
| report a defect you cannot diagnose | ask the role that owns that surface |
| declare a reviewer's demand irreconcilable | ask a third role which of the two holds |

## .phone the RIGHT friend — the target is the point

a second opinion is high-signal only when the role fits the question. **an untargeted ask gets an
untargeted answer.**

| the question is about | phone the |
|---|---|
| implementation, readability, failure modes | **mechanic** |
| boundaries, decomposition, the choice of a word, ubiqlang | **architect** |
| a surface a human touches — cli, api, errors, output | **ergonomist** |
| where a lesson or a term belongs | **learner** / **librarian** |
| a testable behavior, a criterion, a scope bound | **behaver** |

⇒ *"phone your mechanic"* and *"ask the architect"* are the shape of the ask. the role name is not
decoration — it selects the rubric the peer reads with.

## .the mechanism is whatever is at hand

the property that must hold is: **a peer role, with its own briefs booted, read the artifact and
gave a verdict before the human was pulled.**

whatever delivers that, delivers the rule:

- a dedicated ask skill, where the role publishes one — the cheapest route, and it returns a
  verdict in the reviewer-output contract
- an `rhx enroll --roles <role>` plus that role's `review` skill against a rubric — the same
  enroll-review-parse flow a route guard's `reviews.peer` already runs
- a route's own peer-review ladder, when the work is inside a bound route

⚠️ **do not invent a parallel review path.** the enroll-review-parse flow already exists and
already produces a contract-conformant verdict (`contract.reviewer-output`); a hand-rolled
substitute yields an opinion no tool can read.

## .when you may escalate with no second opinion

the rule is a floor, never a stall:

- **the peer is genuinely unreachable** — say so, and say what you tried
- **the wall is unambiguous and foreman-only** — a credential, an access grant, an approval only
  the human holds. a peer cannot mint a key, and to ask one is ceremony
- **a wisher decision above the blueprint's authority** — a scope question, not a technical one

⚠️ these are **narrow**. *"i was fairly sure"* is not one of them, and neither is *"it would have
taken a few minutes."* the few minutes are the point.

## .enforcement

- an escalation to the human with no peer opinion sought, and no reason recorded = **blocker**
- a second opinion sought from a role that does not own the surface in question = **nitpick** —
  the target is what makes it high-signal
- a peer opinion obtained and then not cited in the escalation = **blocker** — the human inherits
  the diagnosis, or the ask was wasted
- a hand-rolled review path where the enroll-review-parse flow already applies = **blocker**

## .see also

- `contract.reviewer-output` (reviewer) — the verdict shape a peer's answer must satisfy
- `howto.review-by.[guide]` (reviewer) — the extant enroll-review-parse flow this reuses
- `rule.always.converge-to-terminal` — work every reviewer before the human is pulled
- `rule.always.spend-own-levers-before-escalation` — the same sort-by-owner move, one rung lower
- `rule.always.defer-fulcrums-to-last` — what to do with the fork once a peer has named it
