# rule.always.absorb-every-concern

> **you have not absorbed a reviewer's feedback until you have absorbed EACH concern within it. one
> disposition per concern — disputed or conceded — or the road does not pass.**

a **concern** is one blocker or one nitpick a reviewer enumerated. to **absorb** it is to render its
disposition with its argument: `disputed` (it is fine to continue — cite a fulcrum) or `conceded`
(the reviewer is right — commit to fix). absorb the feedback = absorb every concern within it.

⇒ the law it enforces: `define.invariant.review.peer.absorb` —
`feedbackAbsorbed(given) ⟺ ∀ concern : absorbed(concern)`.

## .why — a per-reviewer acknowledgement hides an un-absorbed concern

a reviewer raises four concerns; you engage the lane, argue three, and never touch the fourth. a
gate that reads *"did you respond to the reviewer?"* passes you — the response exists. the fourth
concern was ignored under cover of it.

⇒ **the feedback is its concerns.** to discharge the whole while a part stands un-absorbed is to call
the reviewer answered on a concern you never read. the atom of the answer is the concern, never the
reviewer.

## 🔴 .two grains, one verb — and the coarse is gated on the fine

`absorb` names two acts, and absorb-the-feedback is COMPOSED of absorb-each-concern:

| the act | grain | what it is |
|---|---|---|
| **absorb a concern** | one concern | a disposition — `disputed` or `conceded` — with its argument |
| **absorb the feedback** | the reviewer's given | the `.taken` — engages the reviewer as a whole |

🔴 **the added gate: the `.taken` is REFUSED until each concern within it is absorbed.** you cannot
absorb the feedback before you absorb each concern — the whole is accepted only once its parts are.
the `.taken` is not retired; it gains a precondition.

each concern's disposition carries its own argument:

| the disposition | what it commits you to | where its argument lives |
|---|---|---|
| `conceded` — the default | fix it, run again | an optional `--why`, or the fix itself |
| `disputed` — the escalation | shed it from the tally; the council rules | the fulcrum the `--why` path names — **required** |

⚠️ **concede-and-fix is the default; a dispute is an escalation** (`rule.always.concede-with-a-severity`,
`S11`). reach for a dispute only where the concern is severe or recurs — never to skip the fix.

## .the moves

```
rhx route.stone.set --stone <stone> --as conceded --with <reviewer> --about <concern> --severity better|urgent
rhx route.stone.set --stone <stone> --as disputed  --with <reviewer> --about <concern> --why <fulcrum-path>
```

- **`--with`** names the reviewer, **`--about`** names the ONE concern by ordinal within that
  reviewer's given (`blocker.3`, `nitpick.1`). there is **no `--about all`** — a driver who types
  `all` has not read all (`S08`).
- the ordinals renumber each generation. a fresh round re-mints the given, so you re-absorb what it
  now says.

| when… | then… |
|---|---|
| a reviewer's given rejects | the strongest cue. every concern it enumerates owes an absorption before the round passes |
| you would write the `.taken` to engage the reviewer "as a whole" | absorb each concern FIRST — the `.taken` is refused until you do. the whole is gated on its parts |
| you fix the code and re-arrive | 🔴 a fix is not an absorption. the debt is keyed to the concern — declare `conceded` on it, or the gate holds |
| you disagree with one concern | `disputed`, with a fulcrum `--why`. the argument lives in the fulcrum, never in a second file |
| an approved lane carries a nitpick that pushes the stone over the floor | you MAY absorb it — the judge tallies stone-wide (`define.invariant.review.peer.absorption.disputable-regardless-of-verdict`) |
| the halt names concerns still un-absorbed | those are the exact atoms owed. one command each |

## .the test

> **for every concern the reviewer enumerated, did you render a disposition on THAT concern?**

- every one → the feedback is absorbed; the road passes
- one un-absorbed → the road holds, and the halt names it. absorb it — do not read the response you
  already wrote as coverage of a concern you skipped

## .the boundary

a concern that carries no hold owes no absorption: a forgiven level (excluded from the tally), a lane
that never spoke (no concern), an unreadable given (a malfunction — answer it with a re-run, never an
absorption; `F030`).

blocker: a passage sought while any enumerated concern of a given that counts stands un-absorbed · a
code fix re-arrived as though it discharged a concern's debt · a disposition declared on the reviewer
as a whole rather than per concern · a dispute with no fulcrum `--why`.

⇒ see also: `define.invariant.review.peer.absorb` (the law) ·
`rule.always.concede-with-a-severity` (the concede grade) · `rule.forbid.suppression-of-undeclared-concerns`
(an absorption sheds only the concern it names) · `rule.always.converge-with-reviewers._` (the
conversation the absorption records).
