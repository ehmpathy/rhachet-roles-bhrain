# rule.always.spend-own-levers-before-escalation

## .what

when a route stone halts, the guard prints every remedy that *could* unblock it. that list names
**what would work**, never **who owns each lever**. before you surface a halt to a human, sort
the list by owner and spend every lever that is yours.

the split, for the driver role:

| lever | owner |
|-------|-------|
| 🔴 `rhx route.stone.set --as disputed --with <reviewer> --about <concern> --why <fulcrum>` — a real or repeated defect you DISAGREE with, answered and cited | **driver** |
| `rhx route.stone.set --as absorbed --that <reviewer>` — converge; the answer a spent meter does not discharge | **driver** |
| 🔴 `rhx route.mutate.guard` — the stone's own `--paths-with`, `--conversation`, `level`, `budget` | **driver** |
| a diagnosed reviewer malfunction (absent credential, bad glob, stale supply) | **driver** |
| 🔴 `rhx route.guard.budget --for review --add N --stone <stone>` | **driver, ONLY with a warrant** — see below |
| `--as approved` | human |
| `--as overruled` | human |
| commit quota (`rhx git.commit.uses`) | human |
| a **credential** the keyrack reports `absent` (`rhx keyrack set`) | human |
| release authorization | human |

🔴 **the guard row is the one this table omitted for a full release, and the omission had a
measured price.** a driver on `rhx-roles-bhrain` filed an overflowed-lane repair as a **fulcrum**
— a decision reserved for the wisher — and collected six rounds of evidence about it while the
remedy sat unused. the wisher closed it in seven words: *"you have the abiltiy to edit the
guards."*

⇒ **an absent row does not read as absent. it reads as "not mine."** a lever this table omits is
worse off than one it lists as human-owned, because a human-owned lever at least gets surfaced.

⛔ **a hand-run `rhx review` is NOT on this table, and its absence is deliberate.** it draws no
budget, so it is not a lever at all — it is an escape from the meter the ladder runs on
(`rule.forbid.hand-run-reviews`). ⇒ **the guard row above is what a driver who reaches for it
actually wants**, and it is the correct one: it repairs the lane *inside* the system rather than
around it.

## .why

escalation to a human is the last resort, and their attention is the scarcest resource in the
loop. to hand a human a top-up you could have run yourself spends that resource for no gain —
and worse, it reads as a wall when it was a step.

**adjacency is the trap.** two remedies rendered side by side with no owner column read as two
human remedies, and the driver's own lever is the one that gets surfaced upward.

⚠️ **an owner label on the surface covers ONE halt kind, and is a courtesy rather than a
guarantee.** the budget halt names its owners, and the driver's lever is sorted first — but
**which** lever that is depends on what the last round conceded: `increase budget — yours to
spend` on an urgent concession, `fix what you conceded — yours to run` on a better one, and
`converge with the reviewer — yours to run` where naught was conceded. a reviewer malfunction, a
self-review gate, and a judge threshold each print a remedy list with no owner column at all.
**the sort is yours to perform.**

## .the rule

| the stone halted on... | you must... |
|------------------------|-------------|
| peer reviewer budget exhausted | **answer it yourself** — converge, or fix what you conceded, then re-arrive. a top-up only where an urgent concession earned the round |
| a reviewer malfunction | **diagnose it** (`rule.always.diagnose-reviewer-malfunctions`); fix what is yours |
| a genuine human-only gate | surface it — with the exact command, never a bare symptom |

a halt is **a diagnosis to make, not a message to relay**. read the block reason, sort it by
owner, act on your half.

## 🔴 .budget is the ALLOWANCE, and it is scarce past its bound

**the grant is refused by default**, so a top-up is a lever you hold **only with a warrant**.

> **inside the meter, taste counts. past the meter, only harm does.**

the route author set `budget: N` with the whole rubric in view, and those N rounds ARE the
allowance for `better` churn — argue taste inside them freely. past them the question changes from
*"do I want another round?"* to *"what harm ships if this is not fixed?"*, and only the second
buys one.

⇒ so the round is earned rather than requested, and it needs all three of:

| the conjunct | what it refuses |
|---|---|
| a **live urgent concession** on the stone | a round bought on a wish to continue |
| a **target reviewer that has run dry** | a pad taken before the bound bites |
| a `--stone` that named **one** stone | one warrant spent across a prefix's worth of stones |

```sh
# the warrant, then the grant
rhx route.stone.set --stone <s> --as conceded --with <reviewer> --about <concern> --severity urgent
rhx route.guard.budget --for review --add N --peer <reviewer> --stone <s>
```

⚠️ **grade by the harm test, never by what you want the meter to say.** `urgent` is the closed set
— security · safety · monetary · reputation · behavioral, with a harm you can name. every other
concern is `better`, and `better` earns no round past the meter
(`rule.always.concede-with-a-severity`).

🔴 **and `--add N` does NOT extend every reviewer on the stone.** a bare add lands on the **latest
level alone**; a lower level stays exhausted unless `--level` or `--peer` names it. a top-up is a
deliberate, targeted act, never a blanket sweep that heals a level the route author bounded on
purpose (F022 fork E).

🟡 **exhaustion is still often not what it looks like.** a reviewer spends a round to *raise* a
blocker and has none left to *confirm* the fix — so a reviewer whose findings you fixed in that
same round shows `exhausted 🌙` with its blockers listed, though every one is closed. **where that
blocker named a real harm, grade it `urgent` and the round is yours.** where it named taste, the
fix IS the whole remedy — the reviewer will not re-read it, and that is the design rather than a loss
to route around.

## .the test

> **"is there a command i could run right now that would move this stone?"**

- yes → run it
- no → then, and only then, surface — and name the exact command the human must run

## .how it differs from its neighbors

**the neighbors govern *how far to push* a given path; this one governs *whose lever a halt is*.**
that owner-sort is a distinct move, and it applies to halts that have no review ladder at all — so
it does not fold into `rule.always.converge-to-terminal`.

| brief | its move |
|---|---|
| `rule.always.drive-autonomously` | do not invent your own checkpoints |
| `rule.always.converge-with-reviewers` | settle a single dispute yourself |
| `rule.always.converge-to-terminal` | work the whole ladder before a human is pulled |
| `rule.always.defer-fulcrums-to-last` | best-guess a fork, review at the end |
| **this rule** | **sort the remedies by owner; spend yours first** |

## .see also

- `rule.always.converge-to-terminal` — work every reviewer to terminal before a human is pulled
- `rule.always.diagnose-reviewer-malfunctions` — the same sort-by-owner move, for a broken reviewer
- `rule.always.drive-autonomously` — relay the route's gates; never invent your own

## ⚠️ .the bar is not a human gate

the refusal did not move the lever to the human. it put a **bar** in front of it, and the bar is a
sentence the driver writes about its own work — a human may grant regardless.

⇒ so this rule's core is untouched by it: **the answer to most budget halts is convergence, and
convergence is yours.** a driver that reaches for a human's grant before it has tried to converge
has surfaced a halt it could have answered itself, which is the exact spend of a human's attention
this rule exists to prevent.
