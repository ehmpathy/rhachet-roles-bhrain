# self-review: has-ergonomics-validated (r8)

## note on repros

this route has no repros artifact. ergonomics validated against criteria sketches and wish.

## planned vs actual: input

### from criteria (2.1.criteria.blackbox.yield.md)

**planned inputs:**
```
rhx route.stone.set --stone 3.blueprint --as rewound --yield drop
rhx route.stone.set --stone 3.blueprint --as rewound --yield keep
rhx route.stone.set --stone 3.blueprint --as rewound --hard
rhx route.stone.set --stone 3.blueprint --as rewound --soft
```

**actual inputs (from tests):**
```ts
args: { stone: '1.vision', route: '.', as: 'rewound', yield: 'drop' }
args: { stone: '1.vision', route: '.', as: 'rewound', yield: 'keep' }
args: { stone: '1.vision', route: '.', as: 'rewound', hard: true }
args: { stone: '1.vision', route: '.', as: 'rewound', soft: true }
```

**match?** yes. the cli flags match exactly what was planned.

## planned vs actual: output

### from criteria

**planned output elements:**
- `yield = archived` for dropped yields
- `yield = preserved` for kept yields
- `yield = absent` for stones without yield files
- archived counts shown per stone

**actual output (from snapshots):**
```
🗿 route.stone.set --as rewound --yield drop
   ├─ stone = 1.vision
   └─ cascade
      ├─ 1.vision
      │  ├─ archived = 0 reviews, 0 judges, 0 promises, 0 triggers
      │  ├─ yield = archived
      │  └─ passage = rewound
```

**match?** yes. all planned output elements are present.

## design changes in implementation

### format evolved (intentional)

| planned | actual | why |
|---------|--------|-----|
| `deleted:` | `archived =` | semantic accuracy (files archived, not deleted) |
| `passage:` | `passage =` | consistency with other `=` separators |
| `done` line | removed | redundant, cascade structure shows completion |

these changes improve clarity. they are ergonomic improvements, not drift.

### additions (intentional)

| addition | why |
|----------|-----|
| `--yield drop` in header | shows what was invoked |
| `yield =` line per stone | core feature visibility |

## ergonomics validation

| criterion | planned | actual | verdict |
|-----------|---------|--------|---------|
| flag names | `--yield drop`, `--yield keep`, `--hard`, `--soft` | same | match |
| flag validation | reject conflicts | `mutually exclusive`, `conflicts` errors | match |
| output state | `archived`, `preserved`, `absent` | same | match |
| cascade scope | rewound stone + downstream | same | match |
| upstream | preserved | preserved | match |

## conclusion

ergonomics match the criteria. the few format changes (archived vs deleted, etc.) are improvements, not drift. input/output contract delivered as planned.

