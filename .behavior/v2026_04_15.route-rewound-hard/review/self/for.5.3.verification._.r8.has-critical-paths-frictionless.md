# self-review: has-critical-paths-frictionless (r8)

## critical paths reviewed

this route has no repros artifact. critical paths derived from criteria.

### path 1: `--yield drop` archives yield to `.route/.archive/`

**test case:** case1 [t0]

**the journey:**
1. user has a stone with yield file
2. user runs `rhx route.stone.set --stone 1.vision --as rewound --yield drop`
3. yield file moves to `.route/.archive/`
4. output shows `yield = archived`

**frictionless?** yes.
- single command
- output shows what happened (`yield = archived`)
- no user action to create archive directory (auto-created)
- no error if yield file absent (shows `yield = absent`)

### path 2: `--yield keep` preserves yield (default)

**test case:** case2 [t0], case3 [t0]

**the journey:**
1. user has a stone with yield file
2. user runs `rhx route.stone.set --stone 1.vision --as rewound`
3. yield file stays in place
4. output shows `yield = preserved`

**frictionless?** yes.
- no extra flag required for default behavior
- explicit `--yield keep` works identically
- backward compatible with prior rewind behavior

### path 3: `--hard` alias for `--yield drop`

**test case:** case4 [t0]

**the journey:**
1. user runs `rhx route.stone.set --stone 1.vision --as rewound --hard`
2. yield file archived
3. output shows `--yield drop` in header

**frictionless?** yes.
- git users recognize `--hard` immediately
- behavior matches mental model (hard reset = discard changes)

### path 4: `--soft` alias for `--yield keep`

**test case:** case5 [t0]

**the journey:**
1. user runs `rhx route.stone.set --stone 1.vision --as rewound --soft`
2. yield file preserved
3. output shows `--yield keep` in header

**frictionless?** yes.
- complements `--hard`
- git users understand `--soft` = preserve state

### path 5: cascade with yield drop

**test case:** case6 [t0]

**the journey:**
1. stones 1, 2, 3 each have yield files
2. user runs `rhx route.stone.set --stone 2.criteria --as rewound --yield drop`
3. stone 2 and 3 yields archived (cascade)
4. stone 1 yield preserved (upstream)
5. output shows `yield = archived` for 2 and 3

**frictionless?** yes.
- cascade behavior matches prior rewind (same scope)
- upstream untouched (expected)
- output shows per-stone yield outcome

### path 6: flag conflict validation

**test case:** case7 [t0,t1,t2,t3]

**the journey:**
1. user runs `--hard --soft` or `--hard --yield keep`
2. command fails immediately
3. error message: `mutually exclusive` or `conflicts`

**frictionless?** yes.
- validation before action (no partial state)
- clear error message tells user the problem
- no need to guess what went wrong

## test proof

```
rhx git.repo.test --what acceptance --scope yield
   ├─ tests: 51 passed, 0 failed, 0 skipped
   └─ time: 132s
```

## conclusion

every critical path exercised via acceptance tests. each path is smooth, has no unexpected errors, and feels effortless. the feature "just works."

