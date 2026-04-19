# self-review: has-acceptance-test-citations

## test file

all citations reference: `blackbox/driver.route.set.yield.acceptance.test.ts`

## playtest step citations

### step 1: `--yield drop` archives yield file

```
test: blackbox/driver.route.set.yield.acceptance.test.ts
case: given('[case1] route.stone.set --as rewound --yield drop')
      when('[t0] stone has yield file')
      then('yield file is archived')
```

### step 2: `--yield keep` preserves yield file

```
test: blackbox/driver.route.set.yield.acceptance.test.ts
case: given('[case2] route.stone.set --as rewound --yield keep')
      when('[t0] stone has yield file')
      then('yield file is preserved')
```

### step 3: default (no flag) preserves yield file

```
test: blackbox/driver.route.set.yield.acceptance.test.ts
case: given('[case3] route.stone.set --as rewound (default yield)')
      when('[t0] no yield flag provided')
      then('yield file is preserved (default is keep)')
```

### step 4: `--hard` alias archives yield file

```
test: blackbox/driver.route.set.yield.acceptance.test.ts
case: given('[case4] route.stone.set --as rewound --hard (alias)')
      when('[t0] --hard archives yield')
      then('yield file is archived')
```

### step 5: `--soft` alias preserves yield file

```
test: blackbox/driver.route.set.yield.acceptance.test.ts
case: given('[case5] route.stone.set --as rewound --soft (alias)')
      when('[t0] --soft preserves yield')
      then('yield file is preserved')
```

### step 6: cascade `--yield drop` affects multiple stones

```
test: blackbox/driver.route.set.yield.acceptance.test.ts
case: given('[case6] cascade yield drop affects multiple stones')
      when('[t0] rewind stone 2 with yield drop cascades to stone 3')
      then('stone 2 yield is archived (in cascade)')
      then('stone 3 yield is archived (in cascade)')
```

### step 7: no yield file exists (no-op)

```
test: blackbox/driver.route.set.yield.acceptance.test.ts
case: given('[case1] route.stone.set --as rewound --yield drop')
      when('[t1] stone has no yield file')
      then('stdout contains yield = absent')
```

### step 8: multiple yield file extensions

```
test: blackbox/driver.route.set.yield.acceptance.test.ts
case: given('[case8] yield with multiple yield file extensions')
      when('[t0] stone has .yield, .yield.md, and .yield.json')
      then('all yield files are archived')
```

### step 9: `--hard` and `--soft` together

```
test: blackbox/driver.route.set.yield.acceptance.test.ts
case: given('[case7] validation errors for flag conflicts')
      when('[t0] --hard and --soft together')
      then('error mentions mutual exclusivity')
```

### step 10: `--hard` and `--yield keep` together

```
test: blackbox/driver.route.set.yield.acceptance.test.ts
case: given('[case7] validation errors for flag conflicts')
      when('[t1] --hard and --yield keep together')
      then('error mentions conflict')
```

### step 11: `--soft` and `--yield drop` together

```
test: blackbox/driver.route.set.yield.acceptance.test.ts
case: given('[case7] validation errors for flag conflicts')
      when('[t2] --soft and --yield drop together')
      then('error mentions conflict')
```

### step 12: yield flags on non-rewound action

```
test: blackbox/driver.route.set.yield.acceptance.test.ts
case: given('[case7] validation errors for flag conflicts')
      when('[t3] yield flags on non-rewound action')
      then('error mentions yield only valid with rewound')
```

## verdict

all 12 playtest steps have acceptance test citations. each step maps to a specific `given/when/then` block in the test file.

zero unproven steps. zero gaps.
