# route-mutate test fixture

test fixture for route.mutate guard acceptance tests.

## structure

```
.behavior/example/
├── 0.wish.md              # unprotected artifact
├── 1.vision.md            # unprotected artifact
├── 2.criteria.stone       # protected stone
├── 2.criteria.guard       # protected guard
└── .route/                # created by test setup
    ├── .bind.test.flag    # marks route as bound
    └── passage.jsonl      # protected passage
```

## note

the `.route/` directory and its contents are created programmatically by the test setup, not checked into git. this is because:

1. `.route/` directories are protected by default
2. tests need to verify the guard logic against fresh fixtures
3. the bind flag and passage state should be controlled per-test
