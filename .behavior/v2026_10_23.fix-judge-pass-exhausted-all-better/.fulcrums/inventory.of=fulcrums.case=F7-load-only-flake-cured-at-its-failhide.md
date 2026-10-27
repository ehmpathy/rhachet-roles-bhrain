# F7 — the load-only peer-budget flake is cured at its failhide, its first cause left unnamed

## .the fork

`driver.route.peer-budget-approval-unification` usecase.8 [t1.5] went red once in the full
acceptance run (it overlapped a scoped acceptance run and a format pass), and green alone (25 / 25)
and inside the scoped driver.route run.

- **A** — name the first cause before any repair: reproduce the load, capture the child's stderr
- **B** — cure the defect that hid the cause, so any recurrence names it, and prove the cure holds

## .the evidence

the red run's own ledger (`.temp/genTempDir.symlink/…1fcab765/.route/passage.jsonl`) holds no
`conceded` and no `absorbed` row between [t1]'s block and [t1.5]'s arrival; the green run holds
both on the i002 given. the i002 taken WAS written, so `answerEveryPeerGiven` saw the given. its
concede either found the concern absent from the undeclared read or exited nonzero, and its absorb
was then refused (a concern stood unabsorbed) — and both fixtures dropped every exit code, since
`invokeRouteSkill` returns a refusal as a result. the gate then reported the true state, one step
later, as the false lead `blocker.1 undeclared`.

ruled out: a timeout (execAsync carries none; a signal kill throws) · the generation hold's 5s
acquire (the concede path takes no lock) · async reviewer completion (the CLI returns only once every
lane settles).

## .taken — B, and why

- the dropped exit code is a defect on its own (`rule.forbid.failhide`, test scope), and it is the
  one thing that made this flake undiagnosable
- the cure: `blackbox/.test/asRouteSkillResultOkOrThrow.ts`, applied to every concede and absorb the
  two fixtures drive; a nonzero step throws `MalfunctionError` with code, stdout, and stderr
- A needs the full-suite load reproduced on demand, which this host gave once in two full runs

## .rework — clean

one fixture file and two call sites; no prod code.

## .confidence — 70%, and why it is low

the first cause is still unnamed. B guarantees the next occurrence fails at the step that broke,
with the child's output, but it does not prove the occurrence cannot recur.

## .where

`blackbox/.test/answerEveryPeerGiven.ts`, `blackbox/.test/concedeEveryPeerConcern.ts`,
`blackbox/.test/asRouteSkillResultOkOrThrow.ts`.

## .verdict

B taken; open — for the council.
