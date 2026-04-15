# self-review: has-consistent-conventions (r4)

## review question

review for conventions that differ from extant patterns.

## articulation

### convention 1: skill name pattern

**extant pattern:**
```
route.bind.get.sh
route.bind.set.sh
route.bind.del.sh
route.stone.get.sh
route.stone.set.sh
route.stone.del.sh
```

**new skill:**
```
route.stone.add.sh
```

**verdict:** ✅ follows `route.stone.<verb>.sh` pattern

### convention 1b: shell entrypoint structure

**extant pattern (from route.stone.get.sh, route.stone.set.sh):**
```bash
#!/usr/bin/env bash
# header comment block with .what, .why, usage, options
set -euo pipefail
exec node -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeStone*())" -- "$@"
```

**new skill:**
```bash
#!/usr/bin/env bash
# header comment block with .what, .why, usage, guarantee
set -euo pipefail
exec node -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeStoneAdd())" -- "$@"
```

**analysis:**
- shebang: matches ✅
- header uses "guarantee" instead of "options" — acceptable variation, documents behavior guarantees
- fail-fast: `set -euo pipefail` matches ✅
- node invocation pattern matches ✅

**verdict:** ✅ follows extant shell entrypoint structure

### convention 2: cli flag names

**extant pattern (from route.stone.set):**
- `--stone` — which stone to operate on
- `--as` — status to set
- `--mode` — plan/apply
- `--that` — for guard reviews
- `--route` — path to route directory

**new skill flags (verified from route.stone.add.sh and route.ts):**
- `--stone` — stone name to create (reuses extant flag name)
- `--from` — content source specifier (@stdin, template($path), or literal)
- `--mode` — plan/apply

**analysis:**
- `--stone` reuses extant flag name ✅ (semantically similar: references a stone)
- `--mode` matches extant convention ✅
- `--from` — new flag for content source. follows pattern of `--from` in other clis (e.g., `git cherry-pick --from`). clear intent.
- `--route` is inferred from current bound route (failfast if none) rather than explicit — this matches wish requirement

**verdict:** ✅ flags are consistent with extant conventions

### convention 3: output format

**extant pattern:** treestruct output with turtle vibes (as per ergonomist briefs)

**new skill output:** uses `formatRouteStoneEmit` which already implements treestruct

**verdict:** ✅ reuses extant output formatter

### convention 4: plan/apply mode

**extant pattern:** plan mode is default, apply mode executes

**new skill:** follows same pattern — plan by default, `--mode apply` to execute

**verdict:** ✅ matches extant convention

### convention 5: file placement

**extant pattern:**
- skills in `src/domain.roles/driver/skills/`
- domain operations in `src/domain.operations/route/`

**new files:**
- `src/domain.roles/driver/skills/route.stone.add.sh`
- `src/domain.operations/route/stepRouteStoneAdd.ts`
- `src/domain.operations/route/stones/getContentFromSource.ts`
- `src/domain.operations/route/stones/isValidStoneName.ts`

**verdict:** ✅ matches extant file placement conventions

### convention 6: domain operation name pattern

**extant pattern:**
```
stepRouteDrive.ts
stepRouteReview.ts
stepRouteStoneGet.ts
stepRouteStoneSet.ts
stepRouteStoneDel.ts
```

**new file:**
```
stepRouteStoneAdd.ts
```

**analysis:** follows `step<Domain><Action>.ts` pattern where:
- `step` = prefix for orchestrator operations
- `RouteStone` = domain (route stone operations)
- `Add` = action verb

**verdict:** ✅ matches extant domain operation name pattern

## final verdict

✅ all conventions match extant patterns
