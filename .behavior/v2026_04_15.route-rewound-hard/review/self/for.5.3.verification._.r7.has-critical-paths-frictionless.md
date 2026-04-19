# self-review: has-critical-paths-frictionless (r7)

## note on repros artifact

this route has no `3.2.distill.repros.experience.*.md` artifacts. critical paths were derived from `2.1.criteria.blackbox.yield.md`.

## critical paths from criteria

| usecase | critical path | how verified |
|---------|--------------|--------------|
| 1 | `--as rewound --yield drop` archives yield | case1, case6 via acceptance |
| 2 | `--as rewound` default preserves yield | case2, case3 via acceptance |
| 3 | `--hard` alias archives yield | case4 via acceptance |
| 3 | `--soft` alias preserves yield | case5 via acceptance |
| 4 | archive directory created | case1 [t1] via acceptance |
| 5 | flag conflicts rejected | case7 via acceptance |

## verification method

ran acceptance tests just now:

```
rhx git.repo.test --what acceptance --scope yield
   ├─ tests: 51 passed, 0 failed, 0 skipped
   └─ time: 132s
```

all critical paths covered by acceptance tests that passed.

## frictionless check per path

### path 1: `--yield drop`

```
rhx route.stone.set --stone 3.blueprint --as rewound --yield drop
```

- smooth: test fixture setup → command → yield archived
- no unexpected errors: validation catches bad flags before action
- effortless: single command, clear output shows what was archived

### path 2: `--yield keep` (default)

```
rhx route.stone.set --stone 3.blueprint --as rewound
```

- smooth: same as prior behavior, no ramp-up required
- no unexpected errors: silent success, yield preserved
- effortless: just omit the flag

### path 3: `--hard` alias

```
rhx route.stone.set --stone 3.blueprint --as rewound --hard
```

- smooth: familiar git-style flag
- no unexpected errors: same as `--yield drop`
- effortless: git users immediately understand

### path 4: `--soft` alias

```
rhx route.stone.set --stone 3.blueprint --as rewound --soft
```

- smooth: familiar git-style flag
- no unexpected errors: same as `--yield keep`
- effortless: complements `--hard`

### path 5: error conditions

```
rhx route.stone.set --stone 3.blueprint --as rewound --hard --soft
# error: --hard and --soft are mutually exclusive
```

- smooth: clear error message
- no unexpected errors: validation before action
- effortless: error tells user exactly what went wrong

## conclusion

all critical paths verified via acceptance tests. no friction points found. the feature "just works" for each usecase in the criteria.

