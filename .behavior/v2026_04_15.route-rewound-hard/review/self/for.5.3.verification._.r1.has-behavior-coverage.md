# self-review: has-behavior-coverage

## the question

does the verification checklist cover all journeys from the wish?

## my articulation

yes. i verified each journey from `.behavior/v2026_04_15.route-rewound-hard/0.wish.md` against the test coverage in `blackbox/driver.route.set.yield.acceptance.test.ts`.

### wish journeys mapped to tests

| wish journey | test case | verified |
|--------------|-----------|----------|
| `--mode hard` drops/archives yield files | case1: `--yield drop` archives yield file | yes |
| `--mode soft` keeps yield files (current behavior) | case2: `--yield keep` preserves yield file | yes |
| default should be soft/keep | case3: default yield is keep | yes |
| `--hard` as alias for `--yield drop` | case4: `--hard` alias | yes |
| `--soft` as alias for `--yield keep` | case5: `--soft` alias | yes |
| cascade rewind drops yields for all affected stones | case6: cascade yield drop | yes |
| focus on `$stone.yield.md` files | all cases use yield files | yes |
| validation for flag conflicts | case7: validation errors | yes |
| multiple yield file extensions | case8: `.yield.md`, `.yield.stone`, `.yield.guard` | yes |

### gaps found

none. all wish journeys have corresponding test coverage with snapshots.

## conclusion

behavior coverage is complete.
