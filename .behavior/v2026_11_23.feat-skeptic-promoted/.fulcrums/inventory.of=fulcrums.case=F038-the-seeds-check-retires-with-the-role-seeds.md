# F038 — the seeds check retires with the role's seeds

- **fork**: once the pioneer's seeds leave the role (seed S013), `skeptic.seeds.check` reads a home that no longer exists. move it to `.agent/repo=.this/role=any/skills/` as a maintainer gate (the foreman's first option), let it ship and answer "no seeds inventory here" with exit 0 (the second), or retire it from the role
- **read**:
  - the check reads `<role dir>/briefs/.seeds/` and resolves each `.landed` path from the role dir; both bases change once the seeds sit in a route
  - no hook runs it (`getSkepticRole.ts`); no consumer could ever have a role seeds dir once the librarian's rule binds every role
  - a check that a route seed's `.landed` path exists serves every route, not one role: that is the driver's domain (`rule.always.archive-the-wishers-words-verbatim`)
- **taken**: retire the skill, its suite, and its snapshot from the role; the rule `persist-each-origin-in-the-seeds` names the route as the home and drops the check row. a driver `route.seeds.check` is caught as a reseed dream
- **why not the maintainer gate**: it would gate one route's archive in this repo, a dir no later change touches; the gate's value is in every route, where the driver lives
- **rework**: clean — the three files sit in the rmsafe trash and in this session's record; the dream holds the shape
- **confidence**: 70%; the foreman offered two options and this is neither. if the foreman wants the gate kept in this repo, the restore is one `cpsafe` per file plus a `--seeds-dir` flag
- **where**: `src/domain.roles/skeptic/skills/`, `briefs/rule.always.persist-each-origin-in-the-seeds.md(.min)`, `.dream/`
- **verdict**: best-guessed
