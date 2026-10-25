# F6 — nine pre-extant `describe.skip` llm suites left skipped at 5.3

## .the fork

5.3 forbids skips. a scan of `src/**/*.test.ts` finds nine `describe.skip` (eight thinker suites,
one claude-sonnet review suite) and two `.only` in `src/domain.roles/thinker/.scratch/`.

- remove the skips here, and make the nine suites pass
- or hold them, as the extant dream records

## .taken — hold

- none was touched by this route; all predate it on main (last change `f70f8475`, 2026-10-16)
- each calls a paid llm api; a re-enable puts that cost on every ci push, a call only a human can
  make, and the thinker role is owed an audit before its suites are worth a run
- the two `.only` sit under `.scratch/`, which every jest config excludes (`'!**/.scratch/**'`),
  so no suite this repo ships runs them
- the extant dream holds the shape of the fix:
  `dreams/v2026_09_27.fix.re-enable-the-79-skipped-integration-tests.md` (symlinked here)

## .rework — clean

drop each `describe.skip` once a quota is granted; no code in this route depends on them.

## .confidence — 85%, and why it is low

the stone's mandate reads "zero skips, no exceptions". a strict council may want the dead thinker
suites deleted here rather than held.

## .where

`src/domain.roles/thinker/skills/**/step*.integration.test.ts` ·
`src/domain.operations/review/stepReview.caseBrain.claude-sonnet.integration.test.ts`.

## .verdict

held; open — for the council.
