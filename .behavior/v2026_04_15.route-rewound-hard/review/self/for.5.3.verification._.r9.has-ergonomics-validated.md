# self-review: has-ergonomics-validated (r9)

## wish vs implementation

### wish said

> "we should be able to prescribe, on stone --as rewound, the ability to rewound --mode hard | soft"

### what we implemented

we used `--yield drop` and `--yield keep` as primary flags, with `--hard` and `--soft` as aliases.

### why the change?

1. **semantic clarity**: `--yield drop` tells you exactly what happens to yields
2. **git familiarity**: `--hard` and `--soft` aliases for git users
3. **explicit default**: `--yield keep` is the default, matches prior behavior

the wish asked for `--mode hard | soft`. we delivered `--hard | --soft` directly on the command. this is ergonomically better because:
- one less flag (`--hard` vs `--mode hard`)
- matches git conventions (`git reset --hard`)

## input ergonomics: wish vs actual

| wish | actual | ergonomics |
|------|--------|------------|
| `--mode hard` | `--hard` or `--yield drop` | shorter, clearer |
| `--mode soft` | `--soft` or `--yield keep` | shorter, clearer |
| cascade to rewound stones | yes | matches expectation |
| focus on `$stone.yield.md` | yes | scope limited to yield files |

## output ergonomics: wish vs actual

### wish said

> "cover with acpt tests and prove via snaps before and after rewound the file contents to verify"

### what we delivered

| requirement | how delivered |
|-------------|---------------|
| acpt tests | 51 acceptance tests in `driver.route.set.yield.acceptance.test.ts` |
| snaps | 3 new snapshots for yield variants |
| before/after | tests verify yield file exists before, archived/preserved after |

### output format

```
🗿 route.stone.set --as rewound --yield drop
   ├─ stone = 1.vision
   └─ cascade
      ├─ 1.vision
      │  ├─ archived = 0 reviews, 0 judges, 0 promises, 0 triggers
      │  ├─ yield = archived
      │  └─ passage = rewound
```

the output:
- shows yield mode in header
- shows per-stone yield outcome (`archived`, `preserved`, `absent`)
- shows archived counts for guard artifacts

## scope ergonomics: wish vs actual

### wish said

> "for now, only focus on the $stone.yield.md file in --hard mode"
> "no need, in case the stone artifacts include src, to roll those back"

### what we delivered

- only `*.yield.md` files are archived on `--hard`
- guard artifacts (reviews, judges) archived as before
- no src file rollback (out of scope)

this matches the wish scope exactly.

## cascade ergonomics: wish vs actual

### wish said

> "if the blueprint was off, or the roadmap was off, or execution - we'd want to drop those execution.yield.md files as part of --mode hard for all the stones that got rewound"

### what we delivered

test case6 verifies:
- rewind stone 2 with yield drop
- stone 2 yield archived
- stone 3 yield archived (cascade)
- stone 1 yield preserved (upstream)

cascade behavior matches the wish.

## conclusion

ergonomics align with the wish:
- `--hard`/`--soft` instead of `--mode hard/soft` (shorter, git-familiar)
- `--yield drop/keep` for explicit control (semantic clarity)
- cascade drops yields for all rewound stones
- scope limited to yield files (no src rollback)
- proven via acpt tests and snaps

no drift. the few changes (`--hard` vs `--mode hard`) are ergonomic improvements.

