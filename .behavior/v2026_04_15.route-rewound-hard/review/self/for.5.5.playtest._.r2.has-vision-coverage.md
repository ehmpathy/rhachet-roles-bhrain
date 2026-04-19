# self-review: has-vision-coverage (r2)

## reviewed artifacts

- `.behavior/v2026_04_15.route-rewound-hard/0.wish.md`
- `.behavior/v2026_04_15.route-rewound-hard/1.vision.yield.md`
- `.behavior/v2026_04_15.route-rewound-hard/5.5.playtest.yield.md`

## re-verification

i re-read the wish and vision artifacts line by line.

### wish requirements (0.wish.md)

| requirement | location in wish | playtest coverage |
|-------------|------------------|-------------------|
| `--mode soft` keeps yields | "soft should just do the current rewind" | step 2, 5 |
| `--mode hard` removes yields | "should remove the yields too" | step 1, 4 |
| focus on `$stone.yield.md` | "only focus on the $stone.yield.md file" | step 8 confirms pattern |
| cascade to rewound stones | "for all the stones that got rewound" | step 6 |
| cover with acceptance tests | "cover with acpt tests" | all steps cite tests |
| prove via snapshots | "prove via snaps" | tests have snapshots |

### vision requirements (1.vision.yield.md)

| requirement | section | playtest coverage |
|-------------|---------|-------------------|
| archive to `.route/.archive/` | "archives yield files to .route/.archive/" | step 1 verifies path |
| `--yield drop\|keep` flags | "contract" section | steps 1-3 |
| `--hard` alias | "contract" section | step 4 |
| `--soft` alias | "contract" section | step 5 |
| cascade behavior | "timeline: --yield drop" | step 6 |
| no yield file = no-op | "edgecases" | step 7 |
| `--hard` + `--soft` = error | "edgecases" | step 9 |
| `--hard` + `--yield keep` = error | "edgecases" | step 10 |
| `--soft` + `--yield drop` = error | "edgecases" | step 11 |
| yield on non-rewound = error | "edgecases" | step 12 |
| multiple yield extensions | "multiple yield files per stone" | step 8 |

## verdict

all behaviors from wish (4 requirements) and vision (11 requirements) are covered. each playtest step maps to at least one acceptance test.
