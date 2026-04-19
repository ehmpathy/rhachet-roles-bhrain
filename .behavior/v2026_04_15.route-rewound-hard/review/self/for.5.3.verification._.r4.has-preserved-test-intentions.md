# self-review: has-preserved-test-intentions (r4)

## the actual diff

only one test assertion changed in the feature-related tests:

```diff
# blackbox/driver.route.set.acceptance.test.ts line 599
-        expect(res.cli.stdout).toContain('done');
+        expect(res.cli.stdout).toContain('passage = rewound');
```

## what the test verified before

the test `[case8] route.stone.set --as rewound` verified:
1. stdout contains the stone name `1.vision`
2. stdout contains `cascade` (cascade behavior present)
3. stdout contains `done` (completion indicator)

the intention: verify rewound operation completes and shows cascade output.

## what the test verifies after

the same test now verifies:
1. stdout contains the stone name `1.vision` *(unchanged)*
2. stdout contains `cascade` *(unchanged)*
3. stdout contains `passage = rewound` *(changed)*

the intention: verify rewound operation completes and shows cascade output *(same)*

## why the assertion changed

the output format evolved to support yield mode:

### old format (before yield feature)
```
🗿 route.stone.set
   ├─ stone = 2.criteria
   ├─ cascade
   │  ├─ 2.criteria
   │  │  ├─ deleted: 1 reviews, 0 judges, 0 promises, 0 triggers
   │  │  └─ passage: rewound
   │  └─ 3.plan
   │     ├─ deleted: 1 reviews, 0 judges, 0 promises, 0 triggers
   │     └─ passage: rewound
   └─ done
```

### new format (with yield feature)
```
🗿 route.stone.set --as rewound --yield keep
   ├─ stone = 2.criteria
   └─ cascade
      ├─ 2.criteria
      │  ├─ archived = 1 reviews, 0 judges, 0 promises, 0 triggers
      │  ├─ yield = absent
      │  └─ passage = rewound
      └─ 3.plan
         ├─ archived = 1 reviews, 0 judges, 0 promises, 0 triggers
         ├─ yield = absent
         └─ passage = rewound
```

key changes:
- header shows `--yield keep` (new feature)
- each cascade item shows `yield = absent/archived/preserved` (new feature)
- `deleted` renamed to `archived` (semantic clarification)
- `passage:` renamed to `passage =` (consistency)
- removed final `done` (redundant - `passage = rewound` is the completion)

## is this a weakened assertion?

no. the assertion still verifies completion. `passage = rewound` is more explicit than `done` because:
- `done` is vague - could mean many values
- `passage = rewound` explicitly states the passage status

the test intention is preserved: verify rewound cascade completes.

## could this hide broken output?

no. the snapshot test captures the exact output:
- `then: stdout matches snapshot` verifies the full output
- any regression in format would break the snapshot

the assertion + snapshot together verify both specific behavior and exact output format.

## conclusion

test intention preserved. the changed assertion reflects intentional output format evolution, not weakened verification. the test still verifies what it always verified: rewound operation completes with cascade output.
