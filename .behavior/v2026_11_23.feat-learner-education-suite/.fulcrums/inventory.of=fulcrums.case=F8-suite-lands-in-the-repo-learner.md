# F8: the suite lands in this repo's `src/domain.roles/learner/`

- **fork**: (a) this repo's `src/domain.roles/learner/`, the published source · (b) the live learner at `~/.rhx/refs/role=learner/`, which holds 37 briefs and the `learn.via.*` skills the repo copy lacks · (c) both, kept in sync by hand
- **taken**: (a). the wish asks for a skill suite that ships in a PR with integration suites green; only the repo copy builds, tests, and releases. the live copy is the pattern source (`.sh` → node engine, `✋ ConstraintError` exit 2), never the destination
- **rework**: clean — the faces and ops are repo-relative; a later sync of the live briefs into the repo moves no education file
- **confidence**: 85% — the live copy diverges from the repo; whether that gap closes upstream is outside this route
- **where**: `1.vision.yield.md` `.the source it builds beside`
- **verdict**: settled by the foreman — (a) holds. this pr ships the education suite in `src/domain.roles/learner/` and copies none of the live copy's 37 briefs or `learn.via.*` skills
  - the wish's done-lines name the `education.*` suite, its route, and the pedigree; no line asks to sync the live learner into the repo
  - the wish bounds the work at medi. a port of 37 briefs + two skills + their suites is a second deliverable, and one pr per deliverable keeps review and revert apart
  - the suite already reads the live copy as its pattern source (`.sh` → node engine, exit codes), so the port adds naught the suite needs to ship green
  - the gap stays on record, not in the pr: caught as `.dream/v2026_11_26.feat.port-live-learner-into-repo.md`, symlinked at `$route/dreams/`
