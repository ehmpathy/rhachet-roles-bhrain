# self-review r2: has-questioned-deletables

stone: 3.3.1.blueprint.product
reviewer: mechanic
round: 2
date: 2026-04-12

---

## pause and breathe

i stopped. i asked: "what can be deleted?" for each component.

---

## feature traceability

| feature | traces to | verdict |
|---------|-----------|---------|
| isValidStoneName | vision edgecase: invalid stone name | KEEP |
| getContentFromSource | vision usecases: stdin/template/literal | KEEP |
| formatRouteStoneEmit add variant | vision outputs: plan/apply feedback | KEEP |
| stepRouteStoneAdd | core orchestrator for vision | KEEP |
| route.stone.add.sh | shell entrypoint pattern | KEEP |
| acceptance tests | criteria requirement | KEEP |

**all features trace to vision or criteria.**

---

## component deletion questions

### isValidStoneName — could inline?

**question:** could validation be inline in stepRouteStoneAdd?

**answer:** keeping separate because:
1. pure transformer enables unit testing without mocks
2. regex logic is isolated, testable, reusable
3. follows extant pattern (e.g., isStoneInGlob is separate)

**verdict:** KEEP as separate file.

### getContentFromSource — could inline?

**question:** could content extraction be inline in stepRouteStoneAdd?

**answer:** keeping separate because:
1. three source branches (stdin, template, literal) are distinct
2. template path expansion with $behavior is non-trivial
3. enables focused integration testing of each source

**verdict:** KEEP as separate file.

### route.empty fixture — is this needed?

**question:** could we use route.simple and add stones with unique names?

**answer:** keeping route.empty because:
1. "add first stone to empty route" is a distinct test case
2. cleaner test semantics (empty → has stone)
3. route.simple already has 3 stones, adds noise to add tests

**verdict:** KEEP route.empty fixture.

### template fixture — is this needed?

**question:** could we skip template tests?

**answer:** no. template() is a vision usecase. must test it.

**verdict:** KEEP template.research.adhoc.stone fixture.

---

## simplification opportunities

looked for over-engineering:

| component | simplification opportunity | action |
|-----------|---------------------------|--------|
| formatAdd | could skip preview sub.bucket | NO — vision wants content preview |
| error messages | could simplify text | NO — clear errors are vision requirement |
| test fixtures | could reduce count | NO — each fixture serves distinct case |

**no simplification opportunities identified.**

---

## summary

| category | count | deletable | simplified |
|----------|-------|-----------|------------|
| features | 6 | 0 | 0 |
| components | 4 | 0 | 0 |
| fixtures | 2 | 0 | 0 |

**verdict:** all components trace to requirements. no deletables identified.

---

## what held

the blueprint is minimal for the requirements:
- no gold-plated features beyond vision
- each component traces to a concrete requirement
- test fixtures match test cases
- no premature abstraction detected
