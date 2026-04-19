# self-review: has-journey-tests-from-repros

## the check

> look back at the repros artifact:
> .behavior/v2026_04_15.route-rewound-hard/3.2.distill.repros.experience.*.md

## what i found

no repros artifacts exist in this route.

```
glob '3.2*' in .behavior/v2026_04_15.route-rewound-hard/
# no files found
```

## why no repros

this route's structure:
- 0.wish.md (feature wish)
- 1.vision.* (vision stone)
- 2.1.criteria.blackbox.* (blackbox criteria)
- 2.2.criteria.blackbox.matrix.* (matrix criteria)
- 3.1.*.research.* (research stones)
- 3.3.1.blueprint.* (blueprint stone)
- 4.1.roadmap.* (roadmap stone)
- 5.1.execution.* (execution stone)
- 5.3.verification.* (this stone)
- 5.5.playtest.* (playtest stone)

there is no 3.2.distill.repros phase in this route. the route went directly from criteria to blueprint/research.

## what this means for the check

this check asks: "did you implement journey tests sketched in repros?"

since there were no repros artifacts, there were no journey test sketches to implement.

the journey tests in `driver.route.set.yield.acceptance.test.ts` were designed from:
- the wish (0.wish.md)
- the criteria (2.1 and 2.2 stones)
- the blueprint (3.3.1.blueprint.product)

not from repros.

## journey coverage anyway

even without repros, the 51 yield tests cover all journeys from the wish:

| wish journey | test case |
|--------------|-----------|
| `--mode hard` drops yields | case1: `--yield drop` |
| `--mode soft` keeps yields | case2: `--yield keep` |
| default is soft | case3: default |
| aliases | case4: `--hard`, case5: `--soft` |
| cascade drops | case6: cascade |
| validation | case7: conflicts |
| multiple extensions | case8: `.yield.md`, etc. |

## conclusion

this check does not apply - no repros artifacts exist in this route. journey tests were designed from wish/criteria/blueprint instead.
