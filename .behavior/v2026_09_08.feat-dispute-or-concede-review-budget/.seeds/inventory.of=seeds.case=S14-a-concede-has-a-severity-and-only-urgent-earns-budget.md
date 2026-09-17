# S14 · a concede has a SEVERITY, and only URGENT earns more budget

- **said 2026-09-14**, as an extension of the concede model — a new taxonomy, a new invariant set,
  a brief, a dream, and an ask to build it

## .said

> also, we should enbrief that the reason its important to respect a budget on reviews is because
> engineers must balance perfection with pragmatism. after a $budget amount of reviews, its good
> enough, and any defects can be evolved into - unless its a critical severity concession. so, maybe
> we need to split --concede into --concede urgent vs --concede better

> and let them demand more budget for reviews based on --concede urgent

> and catch a dream and dispatch a task back into this repo to automatically add budget on --concede
> urgent. i.e., if the last round had an urgent one, automatically allow one more.

> and in this pr, we should warn the user that the last round had an urgent concession, so they
> really should grant more budget

> but if there were no urgent concessions, it shouldn't even require the human to look at it if
> budget is hit

> only urgent concessions qualify for 'needs increased budget'

> please catch these invariants / add to vision / and make it so

> urgent = security | safety | monetary | reputation | behavioral defects / knawmean

> code idealism is never urgent

> thats maintenance that builds up as techdebt if we don't spend at least the budget

> but should never require an increased budget - shouldn't weigh us down

> lets enbrief this in the driver and reviewer too

> enbrief both the philosophy and the rules

🟡 `knawmean` is a word CHOICE, not a typo — it stays. typos were repaired; the words, their order,
and their emphasis are the speaker's.

## .settled — the WHY under the budget, then the taxonomy it justifies

### the philosophy — a budget is the point where perfection yields to pragmatism

> **a review budget exists because engineers must balance perfection with pragmatism.** after a
> $budget amount of review, the artifact is **good enough** — any residual defects can be evolved
> into later.

⇒ the budget is not a limit the driver fights; it is the **floor of maintenance effort** the team
commits to. to spend **at least** the budget keeps code-idealism debt from a build-up. beyond the
budget, the polish that remains is tech debt the team accepts on purpose.

### the one exception — a critical-severity concession

> **unless it is a critical severity concession.** only that defers the good-enough verdict.

## .settled — the severity split

`--as conceded` gains a severity, and the two words carry opposite budget rights:

| the concede | it means | earns more budget? |
|---|---|---|
| **urgent** | a defect that ships REAL harm | ✅ **yes** — the one concession that earns an increased budget |
| **better** | code idealism / maintenance / polish | 🔴 **never** — *"should never require an increased budget — shouldn't weigh us down"* |

### 🔴 what makes a concession URGENT — a closed set

> **urgent = security | safety | monetary | reputation | behavioral defects.**
> **code idealism is never urgent.**

| axis | an urgent defect | a `better` (non-urgent) point |
|---|---|---|
| **security** | a leak, an injection, an authz hole | a name that could read clearer |
| **safety** | a data-loss path, a destructive default | an absent guard on a case that cannot arise |
| **monetary** | a double-charge, a wrong price | a redundant compute that costs a few ms |
| **reputation** | a user-visible wrong answer, a broken promise | a log line phrased oddly |
| **behavioral** | the feature does the wrong thing | a refactor that would tidy the right thing |

⇒ the test is the reviewer's own harm test (`rule.forbid.overzealous-blockers`): **name the harm
that ships with it.** you can → urgent. you cannot → `better`, and it evolves.

### 🔴 `better` is MAINTENANCE, not waste — and it has a hard bound

> **thats maintenance that builds up as techdebt if we don't spend at least the budget.**
> **but should never require an increased budget — shouldn't weigh us down.**

- a `better` concession is real work the team owes — it accrues as tech debt if the budget is not spent
- ⇒ so the budget is a **floor**: spend at least it, and the maintenance stays in check
- but a `better` concession is **capped by the budget** — it never justifies more
- ⇒ a budget hit with only `better` concessions is **good enough**. it must not weigh the team down

## .settled — what the exhaustion halt does, per severity

> **if there were no urgent concessions, it shouldn't even require the human to look at it if budget
> is hit. only urgent concessions qualify for 'needs increased budget'.**

| the budget hit, and the live concessions are… | the halt |
|---|---|
| **all `better`** (or none) | 🔴 **good enough — NO human, NO more budget.** the stone proceeds |
| **at least one `urgent`** | ⚠️ **needs increased budget.** warn the human this PR; they grant more |

⇒ this refines `S12`/`S13`: a concession-exhaustion is the driver's own lever ONLY when an urgent
concession sits on it. with no urgent concession, exhaustion is a **pass**, not a halt.

## .settled — this PR vs a dream

| the ask | where |
|---|---|
| the severity split, the good-enough pass, the urgent warn | ✅ **this PR** |
| **auto-grant one more round** when the last round had an urgent concession | 🔴 **a DREAM + a dispatched task back into this repo** |

> **catch a dream and dispatch a task back into this repo to automatically add budget on --concede
> urgent. i.e., if the last round had an urgent one, automatically allow one more.**

## .settled — where the briefs land

> **lets enbrief this in the driver and reviewer too. enbrief both the philosophy and the rules.**

- a **philosophy** brief — perfection vs pragmatism, the budget as the maintenance floor — durable and repo-wide
- a **rule** in the **driver** — which severity to reach for; `better` never earns budget; `urgent` is the closed harm set
- a **rule** in the **reviewer** — the same harm test it already grades blockers by, now applied to a concede

## .landed

- `1.vision.yield.md` — a new section on the severity split, the invariants, the halt refinement, the dream
- `.fulcrums/…` — the fork rows this taxonomy opens
- `philosophy.a-review-budget-balances-perfection-with-pragmatism.md` — role=any, cited by driver + reviewer
- `rule.*` — one in driver, one in reviewer
- `define.invariant.review.peer.budget.urgent-earns-budget.md` — the invariant set
- `.dream/…auto-grant-a-round-after-an-urgent-concession.md` — the deferred auto-budget
- the code — the severity flag, the ledger field, the exhaustion disposition, the tests
