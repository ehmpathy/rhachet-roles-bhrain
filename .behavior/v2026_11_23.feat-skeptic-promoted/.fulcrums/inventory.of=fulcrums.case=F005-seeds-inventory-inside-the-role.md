# F005 — a seeds inventory inside the role

- **fork**: ship the 51 seeds at `briefs/.seeds/` in the role (pioneer shape), or keep them off the published role
- **taken**: ship them. `skeptic.seeds.check --role-dir` exists to check the promoted copy, and the origins are the point of #818 step 1
- **rework**: clean — move or drop one dir; the check takes a path
- **confidence**: 80%. no role here ships seeds today; boot must list `.seeds/` under `not`
- **where**: `src/domain.roles/skeptic/briefs/.seeds/`, `boot.yml`
- **verdict**: settled by the foreman (2026-11-26) — the seeds stay in the source tree and stay out of the package. add `--exclude='.seeds'` to `build:complete:dist` beside `--exclude='.test'`. why:
  - no consumer seat reads them: `boot.yml` lists `briefs/.seeds/**` under `not`, and no hook in `getSkepticRole.ts` runs `skeptic.seeds.check`
  - the origins #818 step 1 asks for stay in the repo, beside the briefs they landed in, where a maintainer reads them; npm adds no reader
  - each seed is a verbatim quote of the wisher plus a timestamp; to publish words no consumer reads is a cost with no gain
  - the constraint the exclude owes: `skeptic.seeds.check` must not refuse in a consumer whose role dir holds no `.seeds/`. either it moves to `.agent/repo=.this/role=any/skills/` as a maintainer gate, or it ships and answers "no seeds inventory here" with exit 0. the driver picks, and a suite case clamps it
  - proof after the build: the built `dist/domain.roles/skeptic/briefs/` holds no `.seeds/` path
- **verdict, superseded**: settled by seed S013 (the human, 2026-11-26), one step past the foreman: a seed never ships and never sits in a role's briefs; it stays in its route. landed:
  - the pioneer's 58 seeds moved to `.seeds/origin=nheuron/`, padded to three digits (S014)
  - `--exclude='.seeds'` added to `build:complete:dist` as a guard, per the foreman
  - `skeptic.seeds.check` retired from the role (F038)
  - the librarian's `rule.forbid.seeds-outside-their-route`, symlinked into `.agent/repo=.this/role=any/briefs`; clamp `rolesShipNoSeeds.integration.test.ts`, red with the seeds in the role, green after the move
