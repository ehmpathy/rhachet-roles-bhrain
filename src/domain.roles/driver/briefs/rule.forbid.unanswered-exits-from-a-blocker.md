# rule.forbid.unanswered-exits-from-a-blocker

> **a peer blocker is left by ONE door: an answer. every other exit is forbidden.**

the answer is a `.taken.by_self` that states the repair or the refutation, then
`--as contemplated --that <slug>`. the extant rules say **what to write**
(`rule.always.converge-with-reviewers`) and **that every point owes one**
(`…via-a-taken-per-point`). this says **you may not go around them.**

## 🔴 .why — the forbidden exits are all CHEAPER than the answer

an edit is one keystroke. an answer is a written argument. so the cheap door is taken by default,
and **no driver who takes it feels dishonest** — the artifact did change, the reviewer did re-run.

⚠️ **the worked case: one stone, 28 rounds of review, ZERO takens — and a blocker count that never
descended.** takens landed, and it converged in three.

🔴 **reported, never measured here**, so do not cite it as premise; it says why anyone looked. ⇒
`rule.forbid.unanswered-exits-from-a-blocker.example=the-28-iteration-stall.md` carries the
per-round series, the provenance, and a **first-party reproduction of the mechanism** that the
reported counts alone could never establish.

**the conversation is not overhead on convergence. it IS the convergence.**

## .the forbidden exits — and which the engine can refuse

the `engine` column is the honest bound: **a gate can refuse an exit that leaves no trace on disk.
it cannot refuse one that leaves the right trace with the wrong content.**

| the exit | why it is not an answer | engine |
|---|---|---|
| 🔴 **edit the code and re-roll** | the reviewer may not re-raise it. **absence of a re-raise is not agreement** | ✅ **refused** — the debt is keyed to the reviewer, so it outlives the edit, and the entrance gate reads it before a round can start |
| **an empty or token `.taken`** | the engine tests that the file exists, never what it says. an empty one costs a round and is re-raised | ⛔ **open** — `setStoneAsContemplated` asserts existence, never content |
| **answer some points, not all** | the reviewer drops a point that carries a response and **re-raises one that does not** | ⚠️ **partly** — the gate counts **reviewers**, never points. one `.taken` discharges a slug however many points it raised |
| **let the reviewer exhaust** | exhaustion is a budget, not a verdict. to spend it rather than answer is the coast `rule.always.converge-to-terminal` names | ✅ **refused** — an exhausted reviewer writes no fresh given, and the debt it already minted persists |
| **`--as blocked`** | a wall is a wall; a critique you have not answered is not one. ⚠️ **the converse does NOT follow** — see below | ⛔ **open** — a halt is a legitimate act; only you know whether you answered first |
| **call the re-raise a reviewer malfunction** | 🔴 **a blocker that returns after you fixed it is a driver error.** check whether you ever told the reviewer | ⛔ **open** — a diagnosis is a judgment, and no gate reads one |

## 🔴 .the engine refuses two exits. it does not retire this rule

the two ✅ rows are the cheapest exits, and to shut them is the point. **four remain open, and they
are open by construction** — each turns on whether an artifact means what it says, which is a
judgment rather than a state.

⇒ this is `philosophy.entoolment-is-the-pinnacle` at its plainest: the climb mechanized the
**capacity** to refuse two exits and mechanized **no concept at all**. so a driver who reads
*"the gate has it covered"* has taken exit #2 with extra steps — it will let an empty `.taken`
through, cost a round, and re-raise.

⚠️ **and the gate is a floor, never a cap.** it refuses a round you should not start; it never
tells you the answer you wrote was worth the ink. that test is the one at the bottom of this brief.

## ⚠️ .the `--as blocked` row is about ONE state, and a driver reads it as two

the row forbids the halt for a critique you have **not answered**. it is silent on a critique you
**have** answered and cannot close — and that second state is real:

> **a `.taken` converges an ARGUMENT. it cannot converge an ABSENCE.**

a reviewer that rejects for absent coverage is not persuadable by prose; only the coverage closes it.
if that coverage needs a grant you cannot make — a credential, a commit quota, a scope call — then
**no number of rounds converges it, and the budget will not tell you so.**

⇒ 🔴 **read alone, this row sends such a driver back to re-arrive**, which is measured at five rounds
with budget at 45/107 and no convergence. the recognition test, the counter-bound that keeps it from
becoming an early-exit license, and the fulcrum-council case live in
`rule.always.raise-a-blocker-a-taken-cannot-close`.

⚠️ **the two rules do not overlap and do not conflict.** one question sorts every case:
*"is there a change I am PERMITTED to make that would close this point?"* — **yes** → this rule binds,
`--as blocked` is forbidden, write the `.taken`. **no** → that rule binds, and the halt is correct.

## ✅ .the two sanctioned exits, and neither is silent

1. **the answer** — a `.taken`, then `--as contemplated`
2. **a human overrule** — the human takes responsibility for the passage (case=5). ⚠️ ask only after
   you have answered what you can; an overrule requested in place of a first answer is exit #5 above

## .the test

> **"if this blocker never re-appeared, would the reviewer have been PERSUADED — or merely distracted?"**

persuaded → you answered · distracted → you took a forbidden exit, and the critique still stands.

blocker: a re-arrival with an unanswered blocker from the prior round · a `.taken` that names neither
a repair nor a refutation · a re-raise diagnosed as a reviewer defect with no prior answer on record ·
an overrule sought before any answer was written.

⇒ the loop: `rule.always.converge-with-reviewers._.md` · the per-point obligation:
`…via-a-taken-per-point.md` · the two ✅ rows in code: `setStoneAsPassed.ts` (the entrance gate) and
`getLatestPeerGivensPerSlug.ts` (the slug-keyed debt).
