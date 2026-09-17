# S16 · only urgent concessions earn budget; a `better`-only residual passes untouched

- **kind** = a correction (the severity/budget actions were inverted)
- **said** = 2026-09-15, over the concession-exhaustion halt snapshots (case1b `better`,
  case1c `urgent`).

## .said — verbatim

> yeah, sounds like we forgot the part where only urgent concessions warrant increased budgets

> 'better' concessions are hardlimited by the budget, intentionally

> yeah the reviewed? judge should just let them through if all the blockers were better, not urgent
> - without any intervention or budget increases

## .settled

the budget/severity actions were inverted. the correct behavior at a budget hit:

| the skipped lanes | verdict | action |
|---|---|---|
| NOT all conceded (`none`) | held | ordinary human wait |
| all conceded, no `urgent` (`better`) | 🔴 **PASS** — the `reviewed?` judge lets it through, NO budget increase, NO human, NO halt. `better` is hard-capped by the budget by design; what remains at exhaustion is tech debt that evolves later |
| all conceded, ≥1 `urgent` (`urgent`) | held | 🔴 **THIS** is the one that warrants an increased budget — plus a human warn |

⇒ the mechanism: **the `reviewed?` judge subtracts `better`-conceded concerns from its tally**,
exactly as it subtracts disputes; it keeps `urgent`-conceded and undeclared concerns. because the
judge only runs at terminality (every lane exhausted/approved), a `better` concession that survives
to the judge is one the driver could not fix within budget — so the subtraction there IS the
exhaustion-conditional "floor met, proceed."

## .the defect this corrects

- the `better` concession-exhaustion halt recommended `increase budget — yours to spend` (case1b).
  a `better` concession must NEVER earn budget (S14, `philosophy.a-review-budget-balances-...`).
- the budget-increase recommendation belongs on the `urgent` branch, not the `better` branch.

## .landed (planned)

- the `reviewed?` judge (`route.ts` + a `getStoneConcededBetterConcernCounts` peer of
  `getStoneDisputedConcernCounts`) subtracts `better`-conceded concerns from the tally.
- the exhaustion gate (`setStoneAsPassed`) no longer halts on a `better` concession — it passes.
- the drive surfaces render the budget-increase recommendation on `urgent` only.

## .also settled this session (smaller)

- **no default stance** — each concern must be explicitly `conceded | disputed` (already correct).
- **the "cheapest exit" prompt text** primes bad incentives (shown to the driver at the moment of
  choice) — reword to frame the honest judgment, not the exit.
- **the meter skip flag shape** — prefer `skipped: { byDispute: true }` over the flat
  `skippedByDispute`, so skip-reasons group and can grow.
