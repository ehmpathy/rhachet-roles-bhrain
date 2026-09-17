# philosophy: a review budget balances perfection with pragmatism

## .what

> **a review budget exists because engineers must balance perfection with pragmatism.**

after a `$budget` amount of review, the artifact is **good enough**. any residual defect can be
evolved into later — **unless it is a critical-severity concession.**

⇒ the budget is not a limit the driver fights. it is the **floor of maintenance effort** the team
commits to spend, and the point past which polish becomes tech debt the team accepts on purpose.

## .why — perfection has no natural stop, so the budget supplies one

review can always find one more flaw. left unbounded, a driver and a reviewer re-polish an
artifact that shipped value three rounds ago, and the fleet pays full review cost for each round.

- **the budget is the line, drawn in advance** — spend at least it, then stop
- **to spend at least the budget keeps code-idealism debt from a build-up** — the maintenance floor
- **beyond the budget, the residual polish is tech debt the team accepts** — a deliberate choice,
  never an accident

⇒ so a budget hit is not a failure. it is the design at work: perfection has yielded to pragmatism
at the line the team drew.

## .the one exception — a critical-severity concession

> **only a critical-severity concession defers the good-enough verdict.**

a concession has a **severity**, and the two severities carry opposite budget rights:

| the concede | it means | earns more budget? |
|---|---|---|
| **urgent** | a defect that ships REAL harm | ✅ **yes** — the one concession that earns an increased budget |
| **better** | code idealism · maintenance · polish | 🔴 **never** — it must not weigh the team down |

### 🔴 what makes a concession URGENT — a closed set

> **urgent = security · safety · monetary · reputation · behavioral defects.**
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

- a `better` concession is real work the team owes — it accrues as tech debt if the budget is not
  spent
- ⇒ so the budget is a **floor**: spend at least it, and the maintenance stays in check
- but a `better` concession is **capped by the budget** — it never justifies more
- ⇒ a budget hit with only `better` concessions is **good enough**. it must not weigh the team down

## .what the exhaustion halt does, per severity

> **if there were no urgent concessions, it should not require a human to look at it when the budget
> is hit. only urgent concessions qualify for 'needs increased budget'.**

| the budget hit, and the live concessions are… | the halt |
|---|---|
| **all `better`** (or none) | 🔴 **good enough — NO human, NO more budget.** the stone proceeds |
| **at least one `urgent`** | ⚠️ **needs increased budget.** warn the human this PR; they grant more |

⇒ this refines the concession-exhaustion behavior: a concession-exhaustion is the driver's own lever
ONLY when an urgent concession sits on it. with no urgent concession, exhaustion is a **pass**, not a
halt.

## .the cues

| when… | then… |
|---|---|
| you concede a point you will fix | ask the harm test. harm ships → `urgent` · no harm → `better` |
| you reach for `urgent` to buy a round | name the harm first. no nameable harm → it is `better`, and it evolves |
| the budget is hit and every concession is `better` | good enough. proceed — do not summon a human |
| a `better` concession tempts you to ask for more budget | forbidden. `better` never earns budget |
| an urgent concession sat on the last round | warn the human this PR; they grant more |

## .see also

- `rule.forbid.overzealous-blockers` (reviewer) — the harm test this borrows
- `define.invariant.review.peer.budget.urgent-earns-budget` — the invariant this philosophy grounds
- `rule.always.concede-with-a-severity` (driver) — which severity to reach for, at the call site
- `rule.require.grade-a-concession-by-its-harm` (reviewer) — the same harm test, applied to a concede
