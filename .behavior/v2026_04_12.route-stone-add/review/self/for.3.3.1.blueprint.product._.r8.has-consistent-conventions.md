# self-review r8: has-consistent-conventions

stone: 3.3.1.blueprint.product
reviewer: mechanic
round: 8
date: 2026-04-12

---

## pause and breathe

i paused. let me verify name conventions match extant patterns.

---

## extant conventions found

searched src/domain.operations/route/ for patterns:

| prefix | purpose | examples |
|--------|---------|----------|
| step* | orchestrators | stepRouteDrive, stepRouteReview, stepRouteStoneDel |
| get* | retrieve | getAllStones, getRouteBindByBranch |
| set* | mutate | setRouteBind, setStoneAsPassed |
| del* | delete | delRouteBind, delStone |
| is* | validators | isStoneInGlob |
| as* | transformers | asStoneGlob |
| format* | output | formatRouteStoneEmit |

**directory conventions:**
- `/stones/` subdirectory for stone operations
- `/bind/` for bind operations
- `/guard/` for guard operations

---

## blueprint name verification

### stepRouteStoneAdd

**extant pattern:** step*
**blueprint uses:** stepRouteStoneAdd

**verdict:** consistent.

---

### isValidStoneName

**extant pattern:** is* for validators
**blueprint uses:** isValidStoneName
**location:** src/domain.operations/route/stones/

**verdict:** consistent.

---

### getContentFromSource

**extant pattern:** get* for retrieve operations
**blueprint uses:** getContentFromSource
**location:** src/domain.operations/route/stones/

**question:** should this be in `/stones/`?

**answer:** yes. it retrieves content for stone creation. the `/stones/` directory is appropriate.

**verdict:** consistent.

---

### formatRouteStoneEmit (extension)

**extant pattern:** format* for output
**blueprint uses:** formatRouteStoneEmit with new 'route.stone.add' variant

**verdict:** consistent (extension, not rename).

---

### route.stone.add.sh

**extant pattern:** route.stone.*.sh for route stone skills
**blueprint uses:** route.stone.add.sh

**verdict:** consistent.

---

### routeStoneAdd (cli)

**extant pattern:** routeStoneDel, routeStoneSet, routeStoneGet
**blueprint uses:** routeStoneAdd

**verdict:** consistent.

---

## flag name verification

| flag | extant equivalent | verdict |
|------|------------------|---------|
| --stone | --stone (in del) | consistent |
| --from | new (no equivalent) | mandated by vision |
| --route | --route (in del) | consistent |
| --mode | --mode (in del) | consistent |

---

## summary

| name | convention | verdict |
|------|------------|---------|
| stepRouteStoneAdd | step* | consistent |
| isValidStoneName | is* | consistent |
| getContentFromSource | get* | consistent |
| formatRouteStoneEmit | format* | consistent |
| route.stone.add.sh | route.stone.*.sh | consistent |
| routeStoneAdd | routeStone* | consistent |
| flag names | --stone, --route, --mode | consistent |

**all names follow extant conventions.**

---

## what held

the blueprint uses consistent conventions:
- prefix patterns match extant (step*, is*, get*, format*)
- directory structure matches extant (/stones/)
- cli and skill names match extant family (route.stone.*)
- flag names match extant del operation
