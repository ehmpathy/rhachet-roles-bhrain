# S17 · severity is always required on a concede — a mandatory invariant, no default

- **kind** = a reversal (S14's "default `better`" is withdrawn)
- **said** = 2026-09-15, over the `setStoneAsStanced` severity-default code

## .said — verbatim

> severity is always required;   // the graded severity of a concede — `better` unless the driver named `urgent`. an ungraded
>   // concede is a `better` one (the maintenance floor), so the harm test is owed only for `urgent`
>   const severity: 'better' | 'urgent' | undefined =
>     input.as === 'conceded' ? (input.severity ?? 'better') : undefined;

> thats a mandatory invariant

## .settled

a concede MUST carry an explicit `--severity`. there is NO default. an ungraded concede is refused
at the write.

- the `input.severity ?? 'better'` default is REMOVED from `setStoneAsStanced`.
- a concede with no `--severity` throws `--severity is required for --as conceded`, before any state
  moves — the same fail-fast seam the other flag-shape refusals sit in.
- the harm test (`rule.forbid.overzealous-blockers`) is thus made on EVERY concession, never skipped
  by a silent default.

## .the WRITE vs READ distinction

the requirement is on the WRITE. the ledger READER still tolerates an ABSENT severity on a legacy
row, read as `better` (backward compat) — so a row written before this invariant is not orphaned.
this is the `level?`-precedent legacy-absent discipline, one axis further.

## .this reverses S14, not S16

S14 said "an ungraded concede is a `better` one (the safe default)." S16 kept that default while it
corrected the budget/shed wiring. S17 withdraws the default outright: the grade is now always the
driver's explicit call. S16's shed mechanism is UNCHANGED — a `better` concession (however graded)
is still shed by the judge and passes.

## .landed

- `setStoneAsStanced.ts` — `conceded && !severity` throw; `severity = input.as === 'conceded' ?
  input.severity : undefined` (no `?? 'better'`).
- `route.ts` — CLI help: `--severity` REQUIRED for `--as conceded`; the concede example carries a
  severity.
- briefs — `rule.always.concede-with-a-severity` (`.md` + `.md.min`), the `severity` term cluster:
  "default `better`" → "required on the write; absent-on-read tolerated for legacy".
- tests — the concede test assets (`concedeEveryPeerConcern` src + blackbox) always SEND a severity,
  defaulting to `better` for the common test case; a direct no-severity concede is clamped
  (`setStoneAsStanced.integration` [t1], blackbox stance [case4]).
