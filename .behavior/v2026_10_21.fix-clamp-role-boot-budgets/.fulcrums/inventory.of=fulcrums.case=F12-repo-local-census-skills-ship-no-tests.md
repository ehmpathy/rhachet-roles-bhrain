# F12 — the repo-local census skills ship with no tests of their own

## the fork

this stone paved `census.minpeer` and touched `census.cues`, `census.tokens`, and `census.dreams`.
each sits in `.agent/repo=.this/role=any/skills/`.

- **A** — add a snapshot test per skill, as for a role's published contract
- **B** — test the one part a shipped clamp leans on, and leave the rest as the dev tools they are

## taken: B, and why

- these skills are not published. `role=any` under `repo=.this` boots only in this repo, and the
  build ships only `src/domain.roles/**`. no consumer of the package can call them
- no skill in `.agent/repo=.this/role=any/skills/` has a test today. `bench.acceptance`,
  `census.word`, and `git.branch.prune` each ship bare. a test here would set a new standard for
  the dir, a call wider than this stone
- they never gate: each exits 0 on a report. a wrong count misleads a driver, and the driver
  reads the paved artifact beside it (the census files under `.census/`)
- the one part that does gate is the cue classifier, and it left the skills dir: it is the
  shipped transformer `src/domain.operations/learn/asBriefLinesByCue.ts`, with its own unit test.
  `roleBootClamps.integration.test.ts` imports it and `census.cues` requires it, so a change to
  what counts as a cue is a red unit test and a snapshot diff on every booted min

## rework: clean

a test per skill is additive. no extant file changes shape.

## confidence: 70%, and why it is not higher

- `census.minpeer` decided the fate of the verbatim drift check (F8). a bug in it would have
  dropped a check on a false premise, and no test pins its figure
- the bar *"no peer has a test, so none is owed"* is precedent, and precedent is a reason to look,
  never to conform

## verdict: ruled by the director, 2026-10-25 — overruled

B is overruled. the skills that serve the boot budgets are not dev tools to leave bare; they
are promoted into the shipped librarian role, each with tests that clamp its behavior:

| skill | verdict | why |
|---|---|---|
| `brief.min.moveout` | promote | moves the argument out of a min with a cue check; the move every boot cut repeats |
| `census.minpeer` | promote | proves each min line has a home in its `.md`; F8 turned on its figure |
| `census.cues` | promote | splits cue from argument, so a budget is set from a measure, never a guess |
| `glob.files.lib` | moves with them | their internal module, not a skill |

the logic ships as unit-tested transformers in `src/domain.operations/librarian/`, behind the
cli subpath `./cli/librarian`, with skill wrappers in `src/domain.roles/librarian/skills/`.

## where

`.agent/repo=.this/role=any/skills/census.*` · peer `behavior-intent-coverage` i001 nitpick.3 ·
peer `ergo-friction-hazards` i001 blocker.1.
