# has-critical-paths-frictionless review (r7)

## slow review process

1. locate the repros artifact for critical paths
2. if absent, identify what "critical paths" means for this change
3. enumerate any alternative critical paths
4. verify each is frictionless in practice
5. articulate findings with evidence

---

## step 1: locate repros artifact

**command:**
```
git ls-files '.behavior/v2026_04_07.fix-driver-artifacts/' | grep -i repro
```

**result:** no matches

**enumeration of route artifacts:**

| artifact | type |
|----------|------|
| 0.wish.md | wish |
| 1.vision.stone, 1.vision.md | vision |
| 2.1.criteria.blackbox.stone | criteria |
| 2.2.criteria.blackbox.matrix.stone | criteria |
| 3.1.3.research.internal.product.code.prod._.v1.stone | research |
| 3.1.3.research.internal.product.code.test._.v1.stone | research |
| 3.3.1.blueprint.product.v1.stone, .guard, .i1.md | blueprint |
| 4.1.roadmap.v1.stone | roadmap |
| 5.1.execution.phase0_to_phaseN.v1.stone, .guard | execution |
| 5.3.verification.v1.stone, .guard | verification |

**no `3.2.distill.repros*` artifact exists.**

---

## step 2: why no repros artifact is valid

the wish states:

> instead of the `v1.i1.md` pattern ... upgrade to use the `yield.md` pattern

this is:
- an **internal infrastructure change** (driver artifact discovery)
- **not a user-visible journey** (no UI, no CLI, no API endpoint)
- a **pure refactor** with backwards compatibility

repros artifacts capture user experience journeys. this change has none — it modifies internal name conventions, not user workflows.

**verdict:** absent repros is valid for this behavior.

---

## step 3: identify alternative critical paths

since no repros exist, identify critical paths from other sources:

### from criteria (usecase enumeration)

| usecase | type | user-visible? |
|---------|------|---------------|
| usecase.1: driver discovers stone artifacts | internal | no |
| usecase.2: artifact pattern priority | internal | no |
| usecase.3: new behavior creates yield | internal | no |
| usecase.4: guard reads artifacts | internal | no |
| usecase.5: feedback on yield | internal | no |
| usecase.6: stone without artifact | internal | no |
| usecase.7: glob patterns work | internal | no |

**all usecases are internal.** the criteria describes codepaths, not user journeys.

### from vision (day-in-the-life)

the vision describes:

> driver completes a stone, creates `3.blueprint.yield.md`. when you browse the directory, it's immediately clear.

this describes directory structure ergonomics, not a "critical path" that can be run through manually.

---

## step 4: what "critical paths" means for this change

for internal infrastructure changes, "critical paths" translates to:

| internal concept | verification method |
|------------------|---------------------|
| artifact discovery | unit tests, acceptance tests |
| pattern priority | unit tests |
| backwards compat | prior tests continue to pass |
| glob patterns | integration tests |

these are **code-level paths**, not **user-level paths**.

---

## step 5: verify code-level paths are frictionless

### evidence from test runs

**command:** `npm run test:acceptance:locally`

**result:** all tests pass (verified in execution phase)

### evidence from implementation

the implementation introduces `asArtifactByPriority` transformer with:
- 9 unit test cases (exceeds 6 specified in blueprint)
- all cases use BDD structure with given/when/then
- clear priority order: `.yield.md > .yield.* > .yield > .v1.i1.md > .i1.md`

### evidence from snapshot diffs

snapshot changes show:
- cache keys now include `$route/` prefix for specificity
- output format preserved
- no regressions in tree structure or alignment

---

## step 6: friction points identified

### friction point 1: none for end users

users never interact with artifact pattern resolution directly. they create files; the driver discovers them.

### friction point 2: none for developers

developers can use either pattern:
- new behaviors: `{stone}.yield.md`
- prior behaviors: `{stone}.v1.i1.md`

both work. no migration required.

### friction point 3: none for tests

tests can use `.i1.md` pattern for simplicity (lower priority recognized).

---

## summary

| question | answer | evidence |
|----------|--------|----------|
| does repros artifact exist? | no | git ls-files shows no 3.2.distill.repros |
| is absent repros valid? | yes | internal change, no user journey |
| what are the critical paths? | code-level paths | criteria usecases are internal |
| are they frictionless? | yes | all tests pass, no regressions |
| any friction points found? | 0 | patterns are optional, backwards compat preserved |

**this change has no user-visible critical paths.** all internal codepaths are verified via automated tests. no friction points identified.

