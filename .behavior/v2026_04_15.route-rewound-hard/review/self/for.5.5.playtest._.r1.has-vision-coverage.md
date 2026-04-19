# self-review: has-vision-coverage

## reviewed artifacts

- `.behavior/v2026_04_15.route-rewound-hard/0.wish.md`
- `.behavior/v2026_04_15.route-rewound-hard/1.vision.yield.md`
- `.behavior/v2026_04_15.route-rewound-hard/5.5.playtest.yield.md`

## wish behaviors

| behavior | playtest step | verdict |
|----------|---------------|---------|
| `--mode soft` keeps yields | step 2: `--yield keep` | covered |
| `--mode hard` removes yields | step 1: `--yield drop` | covered |
| cascade to affected stones | step 6: cascade test | covered |
| only `$stone.yield.md` files (not src/) | step 8: multiple extensions | covered |

## vision behaviors

| behavior | playtest step | verdict |
|----------|---------------|---------|
| `--yield drop` archives to `.route/.archive/` | step 1 | covered |
| `--yield keep` preserves yields (explicit) | step 2 | covered |
| default (no flag) preserves yields | step 3 | covered |
| `--hard` alias for `--yield drop` | step 4 | covered |
| `--soft` alias for `--yield keep` | step 5 | covered |
| cascade affects subsequent stones | step 6 | covered |
| no yield file = no-op | step 7 | covered |
| multiple yield extensions archived | step 8 | covered |
| `--hard` + `--soft` = error | step 9 | covered |
| `--hard` + `--yield keep` = error | step 10 | covered |
| `--soft` + `--yield drop` = error | step 11 | covered |
| yield flags on non-rewound = error | step 12 | covered |

## verdict

all behaviors from wish and vision are covered by playtest steps. each step cites its acceptance test.
