# F05 · the gate lands inside `routeGuardBudget`, ~~with the meter beside it~~

- **rework** = clean · **confidence** = 🔴 **88%, OWED A RE-GRADE** · **status** = best-guessed

> ## 🔴 THIS ROW'S FORK SHRANK, WITH NO VERDICT OF ITS OWN — 2026-09-18
>
> two council verdicts deleted half of it, and neither was about this row:
>
> | verdict | what it removed from this fork |
> |---|---|
> | 🔴 `F13` | req 7 is answered by an **actor check on the extant lever**, so the meter is not the human lift |
> | 🔴 `F02` | the meter **does not ship here at all** |
>
> ⇒ **option A is dead and option C's second clause is gone.** what remains is a two-way fork this
> row never posed on its own terms:
>
> | option | the gate |
> |---|---|
> | **B** | a **predicate inside `routeGuardBudget`** — reads the ledger, refuses |
> | **D** | a **guard-level** refusal — the guard file declares whether its budget is bot-raisable |
>
> 🔴 **and the 88% grade measured option C**, which no longer exists as stated. ⇒ the number must be
> **re-derived against B-vs-D** rather than carried forward — the same fault this board named when
> `F02`'s ground moved, now in its second instance.
>
> 🟡 **the taken call is unaffected in substance.** option C minus its meter clause **is** option B,
> and every argument below for the predicate's placement holds unchanged. what is owed is a fresh
> weigh of D, which option C's four-way shape let this row pass over quickly.

`0.wish.md` declares the HOW advisory — *"whether the gate lands as a meter, a predicate inside
`route.guard.budget`, or a guard-level refusal is yours."* this is that call.

## .the fork

| option | the gate |
|---|---|
| A | a **`route.budget.uses` meter alone** — `#458`'s proposal, unchanged |
| B | a **predicate inside `routeGuardBudget`** alone — reads the ledger, refuses |
| 🔴 C | **both** — the predicate is the bot's earned lift, the meter is the human's granted lift |
| D | a **guard-level** refusal — the guard file declares whether its budget is bot-raisable |

## .taken, and why

**option C**, and it is forced rather than chosen: the two lifts answer two different axes.

| lift | answers | why the other cannot |
|---|---|---|
| the ledger predicate | axis B — *is the round earned?* | a meter cannot read a concession |
| the `uses` meter | axis A — *who asks?* | a predicate cannot detect an actor (`case=4`) |

⇒ option A alone loses req 2 entirely; option B alone loses req 7, since the actor is undetectable.

**where the predicate sits, precisely:** at the head of `routeGuardBudget`
(`src/contract/cli/route.ts:2140`), **before** the guard enumeration at `:2253` and far before the
write at `:2312`.

✅ **the extant code already reserves that spot and says why** — `:2271-2276`:

> the lanes a DISPUTE has quieted, read **BEFORE the write**. … read first and a malformed route fails
> fast with the budget untouched; read after and the same failure leaves a changed guard file with no
> emit to explain it.

⇒ the gate is the same shape as a read the operation already performs for the same stated reason.
`getStoneLiveUrgentConcessionSlugs({ route, stone })` needs the route and the stone, and both are
resolved by `:2250`.

🔴 **option D is rejected for a specific reason**: a guard field that says *"this stone's budget is
bot-raisable"* is a per-route opt-out a driver can propose in a route it authors. the bound must not
be settable by the party it binds.

## .rework, and why

**clean.** one predicate call plus one refusal branch, both additive, in a function whose read-order
already accommodates them.

⚠️ **the meter half is a new skill**, so it is the larger piece — but it is a copy of a paved pattern
rather than a design.

## .confidence, and why it is 88%

the two-axes argument is mechanical. the placement is where the extant code already reads state.
**the 12%:** the `uses` half is real scope, and a council may prefer it split into its own behavior
(`#458` is already a tracked issue) so this route ships the predicate alone.

⇒ **what would settle it:** a scope call from the wisher — one behavior or two.

## .where

`1.vision.yield.md` § *the design* · `1.vision.experience.case=4.the-ungated-human.md` ·
`1.vision.experience.case=5.the-preemptive-pad.md` `[t1]` `[t2]`

## .the verdict

_not yet ruled._
