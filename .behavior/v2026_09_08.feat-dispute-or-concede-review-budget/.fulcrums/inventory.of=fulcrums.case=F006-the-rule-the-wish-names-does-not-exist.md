# F06 · `rule.forbid.budget-top-ups` does not exist — five other rules move instead

- **rework** = clean · **confidence** = 🔴 **97%** — was 92%, re-scored at `review.self r5` · **status** = best-guessed

## .the fork

the wish opens a section titled *"the extant rule this CHANGES, and it currently grades a blocker"*
and instructs:

> `rule.forbid.budget-top-ups` states *"the route's budget is the budget"* and grades a top-up a
> **blocker**. the supervisor's own babysit contract carries it as `⛔ NEVER` … **it must be updated
> or retired in the same change**, never left to contradict the new gate.

**option A** — write the rule, then retire it, so the wish's instruction is literally satisfied.
**option B** — report that the rule does not exist, retire none, and update the rules that *do*
contradict the new gate.

## .taken, and why

**option B.**

the premise is a **phantom path** (`rule.always.reuse-pavement-before-improvise`). measured, six
ways, 2026-09-08:

| the check | the result |
|---|---|
| `Glob **/rule.forbid.budget-top-ups*` | no files |
| `rhx git.repo.get lines --repos 'ehmpathy/*' --words 'budget-top-ups'` | **0 matches** |
| `… --words "the route's budget is the budget"` | **0 matches** |
| 🔴 `… --repos '*' --words 'budget-top-ups'` | **0 matches — every reachable repo** |
| 🔴 `… --repos '*' --words 'forbid.budget'` | **0 matches — a second, independent string** |
| 🟡 `⛔` within one line of `budget`/`top-up`, in-repo | **6 hits, every one about a hand-run review.** none about a top-up |

🔴 **rows 4 and 5 were added at `review.self r5`, and they replace a denominator this entry
INVENTED.** row 2 once read *"0 matches in **5 repos**"*. re-run: the tool prints `found: 0 matches`
and **no repo count at all** — so the coverage half of that cell was never measured. ⚠️ **a fabricated
denominator is worse than an absent one**, since it reads as scope evidence and is what the 92%
rested on.

`babysit` returns 18 matches across the org and **not one** is a supervisor contract about budget.
no supervisor role exists in the org at all.

⚠️ **the wish names TWO locations, and both are phantom.** the rule file, and *"the supervisor's own
babysit contract carries it as `⛔ NEVER`"*. the fourth check above exists because the second location
deserved its own search rather than an inference from the first — **a phantom rule plus a real
contract would have flipped this verdict**, and only a search on the contract could tell.

⇒ **to write the rule in order to retire it would fabricate the premise the wish rests on**, and
leave a commit whose diff shows a rule that governed no one.

🔴 **and the org's live rules say the OPPOSITE of the phantom.**
`rule.always.spend-own-levers-before-escalation` files the budget add under **driver** in its first
table, and cites the wisher, 2026-08-04:

> *"review budget is YOUR lever … never a human gate."*

⇒ so the wish's `.what` §*"settle the ownership question"* and its acceptance #5 are **already
satisfied** in this repo, in code (`rhx route.guard.budget` needs no human) and in brief. that half
of the wish is a **confirm**, not a build.

### what actually contradicts the new gate

the wish's *instruction* was wrong; its *concern* was right. five live rules would braid against a
dispute exit, and each is named for the execution stone:

🔴 **the MOVES live in one place — `1.vision.yield.md` § *the rules that must move*.** this table names
which rules, never how they change; three rows here once carried the how and each drifted from its
source within one review round.

| rule | why it is on this list |
|---|---|
| 🔴 `rule.forbid.unanswered-exits-from-a-blocker` | it enumerates the sanctioned exits from a blocker, and a dispute is a new one |
| `rule.always.converge-to-terminal` | it defines terminality, and a disputed level is terminal |
| `rule.always.converge-with-reviewers._` | it says escalate only at a real wall, and a move now sits before escalation |
| ⚠️ `rule.always.raise-a-blocker-a-taken-cannot-close` | it sorts the blockers a driver cannot close — **its own subject is untouched**, and it gains a row for the answered-and-disagreed case |
| ⚠️ `rule.always.spend-own-levers-before-escalation` | its lever table gains `disputed` — **not `conceded`**, which keeps the hold and moves no stone |

## .rework, and why

**clean.** the finding is a report; no artifact is built on it that a rename would ripple through.
if the wisher says *"the rule lives in a repo you cannot see"*, the repair is to add that repo to
the sweep and re-read — no code moves.

## 🔴 .confidence, and why it is 97% — the 8% named a tool limit that does not exist

this entry claimed its own residual was un-closable, in these words:

> *"`rhx git.repo.get` reads `ehmpathy/*`; a rule in another owner's tree is invisible to it."*

**that is false, and one flag disproves it.** `--repos '*'` returns **137 repos across three
owners** — `ahbode` (31), `ehmpathy` (~97), `whodisio` (9). the tool prints that count itself.

⇒ swept, all three owners, two independent strings: **0 matches.** ⚠️ **the residual I filed as
un-closable was closable by the very command already in the vision's research table, widened by one
character.**

**so 3% remains, and one gap holds it:** a rule **dictated aloud and never written**, or one in a
tree no local clone exists for. no search closes that, and **#458 already explains it** — it carries
seed S09's *"a budget a spender may top up at will is not a budget"*, the phantom's sentence in all
but name, and it is **OPEN and unimplemented**. ⇒ the rule was dispatched and never landed.

🔴 **the lesson is larger than the row, and it is why `r5` exists.** a fulcrum's confidence is
supposed to price *what the evidence cannot reach*. this one priced **what I assumed the tool could
not reach**, and never checked the assumption. ⇒ **a stated limitation is a claim, and a claim in a
confidence line gets less scrutiny than one in a body** — nobody re-reads the paragraph that
explains why a number is not higher.

## .where

`1.vision.yield.md` § *the premise that does not exist* · § *the rules that must move*

## .the verdict

_not yet ruled._
