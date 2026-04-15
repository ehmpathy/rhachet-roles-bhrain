# self-review: has-journey-tests-from-repros (r4)

## the claim

journey tests from repros were implemented — or this review is n/a.

## the situation

this route has **no repros artifact**.

```sh
$ ls .behavior/v2026_04_12.route-stone-add/*.stone
1.vision.stone
2.1.criteria.blackbox.stone
2.2.criteria.blackbox.matrix.stone
3.1.3.research.internal.product.code.prod._.stone
3.1.3.research.internal.product.code.test._.stone
3.3.1.blueprint.product.stone      # <-- blueprint, no repros before it
4.1.roadmap.stone
5.1.execution.phase0_to_phaseN.stone
5.3.verification.stone
```

the route structure shows:
- `3.1.3.research...` → `3.3.1.blueprint...` → `4.1.roadmap...`

no `3.2.distill.repros.*` stone exists.

## why this is valid

the `route.stone.add` feature is internal infrastructure. it has no external user experience to replay. the journey tests derive from:

1. **blackbox criteria** (`2.1.criteria.blackbox.stone`)
2. **blueprint specifications** (`3.3.1.blueprint.product.stone`)

these artifacts define the expected behaviors, which the acceptance tests verify.

## verification: journey tests exist

```sh
$ git diff main --stat -- 'blackbox/driver.route.stone.add.acceptance.test.ts'
 blackbox/driver.route.stone.add.acceptance.test.ts | 315 ++++++++++++++++++++
 1 file changed, 315 insertions(+)
```

the acceptance test file covers:
- plan mode output format
- apply mode stone creation
- stdin source with content
- template source with lookup
- error cases (no bound route, invalid input)
- idempotency (re-add same stone)

## the result

- no repros artifact in this route
- journey tests derive from criteria and blueprint
- 315 lines of acceptance tests cover the expected behaviors
- review is **n/a** (no repros to implement from)
