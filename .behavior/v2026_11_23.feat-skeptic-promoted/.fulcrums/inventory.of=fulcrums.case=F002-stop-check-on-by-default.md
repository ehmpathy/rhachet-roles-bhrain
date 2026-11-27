# F002 — the Stop check is on by default

- **fork**: register `skeptic.answer.check` as `hooks.onBrain.onStop` on the role (on for every enrolled seat), or behind a toggle as `learn.terms.hook` does (#777, off by default)
- **taken**: on by default. the wish says every seat checks on release; a toggle off by default checks no seat
- **rework**: clean — add a toggle skill and drop the hook entry; no caller depends on it
- **confidence**: 70%. the regex can hold legit replies; the commander may want a soft start
- **where**: `src/domain.roles/skeptic/getSkepticRole.ts`
- **verdict**: settled by the foreman (2026-11-26) — on by default. the wish says every seat doubts and checks, and seed S11 enrolls the skeptic by default (F14 overturned, F36). a toggle off by default would undo both: every seat would carry the role and check naught. the soft start the commander might want is the per-check cap on refusals in one turn, which already bounds a false refusal
