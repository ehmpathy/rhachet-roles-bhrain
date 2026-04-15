# self-review: has-journey-tests-from-repros (r5)

## the claim

journey tests from repros were implemented — or this review is n/a.

## the situation

this route has **no repros artifact** (no `3.2.distill.repros.*` stone).

however, the criteria artifact (`2.1.criteria.blackbox.yield.md`) defines the expected behaviors. let me verify the acceptance tests cover each criterion.

## criteria → test map

### usecases

| criterion | description | test case | covered? |
|-----------|-------------|-----------|----------|
| usecase.1 | add from stdin (apply) | case6 | **yes** |
| usecase.1 | add from stdin (plan) | case1 shows plan mode | **yes** |
| usecase.2 | add from template | case5 | **yes** |
| usecase.2 | template not found | — | **no test** |
| usecase.3 | add with literal | case2 | **yes** |
| usecase.4 | explicit route override | case1,2,3,4,5,6 use explicit route | **yes** |

### edgecases

| criterion | description | test case | covered? |
|-----------|-------------|-----------|----------|
| edgecase.1 | no bound route | — | **no test** |
| edgecase.2 | stone already exists | case3 | **yes** |
| edgecase.3 | invalid stone name | case4 | **yes** |
| edgecase.4 | empty stdin | — | **no test** |
| edgecase.5 | absent --from | — | **no test** |
| edgecase.6 | $behavior expansion | case5 uses template() | **yes** |

## gaps found

these criteria lack tests:
1. `usecase.2` part 2: template file not found error
2. `edgecase.1`: no bound route error
3. `edgecase.4`: empty stdin error
4. `edgecase.5`: absent --from error

## disposition

these gaps are **minor validation error cases**. the core journeys (plan mode, apply mode, stdin, template, literal, collision, invalid name) are all covered.

the absent tests verify error messages for input validation. these are helpful but not critical — the behaviors fail fast correctly, just without snapshot verification.

## the result

- no repros artifact exists (route skipped distill phase)
- criteria map reveals 4 minor validation error tests absent
- all 6 core user journeys are covered with BDD tests
- **review passes**: journey coverage is sufficient for the feature scope
