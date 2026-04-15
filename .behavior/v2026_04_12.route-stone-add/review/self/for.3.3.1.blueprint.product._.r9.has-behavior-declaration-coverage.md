# self-review r9: has-behavior-declaration-coverage

stone: 3.3.1.blueprint.product
reviewer: mechanic
round: 9
date: 2026-04-12

---

## pause and breathe

i paused. let me verify every vision and criteria requirement is covered.

---

## wish verification

**wish says:**
> "we'd like to grant the ability for drivers to self add stones to their route"

**blueprint provides:** stepRouteStoneAdd skill

**covered:** yes

---

**wish says:**
> "they should be able to use a template to bootup the stone"

**blueprint provides:** template($path) source via getContentFromSource

**covered:** yes

---

**wish says:**
> "they should be able to declare the contents via stdin"

**blueprint provides:** @stdin source via getContentFromSource

**covered:** yes

---

**wish says:**
> "--where must be within the current bound route (failfast if none)"

**blueprint provides:**
- route auto-detect via getRouteBindByBranch
- failfast error: "no route bound"

**covered:** yes

---

**wish says:**
> "make sure that proposal for the command matches the extant flags and conventions"

**blueprint provides:**
- --stone (matches extant)
- --route (matches extant)
- --mode (matches extant)
- --from (new, mandated by vision)

**covered:** yes

---

**wish says:**
> "cover with snaps"

**blueprint provides:** 10 snapshots in acceptance tests

**covered:** yes

---

## vision verification

### usecases

| vision usecase | blueprint coverage |
|----------------|-------------------|
| add from stdin | @stdin source branch |
| add from template | template($path) source branch |
| add inline content | literal source branch |
| preview before add | --mode plan (default) |

**all 4 usecases covered.**

---

### contract

| vision flag | blueprint coverage |
|-------------|-------------------|
| --stone required | isValidStoneName validation |
| --from required | cli requires flag |
| --route optional | defaults to bound route |
| --mode plan\|apply | stepRouteStoneAdd mode branch |

**all 4 flags covered.**

---

### edgecases

| vision edgecase | blueprint coverage |
|-----------------|-------------------|
| no bound route | error: "no route bound" |
| stone exists | collision check via getAllStones |
| invalid name | isValidStoneName validation |
| empty stdin | getContentFromSource validation |
| template not found | fs.readFile error handler |
| absent --from | cli requires flag |

**all 6 edgecases covered.**

---

## criteria verification

| criterion | blueprint coverage |
|-----------|-------------------|
| usecase.1: add from stdin | ✓ acceptance test |
| usecase.2: add from template | ✓ acceptance test |
| usecase.3: add from literal | ✓ acceptance test |
| usecase.4: explicit route override | ✓ acceptance test |
| edgecase.1: no bound route | ✓ snapshot |
| edgecase.2: stone exists | ✓ snapshot |
| edgecase.3: invalid name | ✓ snapshot |
| edgecase.4: empty stdin | ✓ snapshot |
| edgecase.5: absent --from | ✓ snapshot |
| edgecase.6: $behavior expansion | ✓ integration test |

**all 10 criteria covered.**

---

## summary

| source | requirements | covered |
|--------|--------------|---------|
| wish | 6 | 6 |
| vision usecases | 4 | 4 |
| vision contract | 4 | 4 |
| vision edgecases | 6 | 6 |
| criteria | 10 | 10 |

**total: 30 requirements, all covered.**

---

## what held

the blueprint covers every requirement from:
- the original wish
- the derived vision
- the blackbox criteria

no requirements were skipped or omitted.
