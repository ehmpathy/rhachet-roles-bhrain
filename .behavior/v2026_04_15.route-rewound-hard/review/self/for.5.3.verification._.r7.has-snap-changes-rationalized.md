# self-review: has-snap-changes-rationalized (r7)

## the actual diffs

### driver.route.set.acceptance.test.ts.snap

```diff
-🗿 route.stone.set
+🗿 route.stone.set --as rewound --yield keep
    ├─ stone = 2.criteria
-   ├─ cascade
-   │  ├─ 2.criteria
-   │  │  ├─ deleted: 1 reviews, 0 judges, 0 promises, 0 triggers
-   │  │  └─ passage: rewound
-   │  └─ 3.plan
-   │     ├─ deleted: 1 reviews, 0 judges, 0 promises, 0 triggers
-   │     └─ passage: rewound
-   └─ done
+   └─ cascade
+      ├─ 2.criteria
+      │  ├─ archived = 1 reviews, 0 judges, 0 promises, 0 triggers
+      │  ├─ yield = absent
+      │  └─ passage = rewound
+      └─ 3.plan
+         ├─ archived = 1 reviews, 0 judges, 0 promises, 0 triggers
+         ├─ yield = absent
+         └─ passage = rewound
```

### setStoneAsRewound.test.ts.snap

case7 (pre-feature) updated format:
```diff
-🗿 route.stone.set
+🗿 route.stone.set --as rewound --yield keep
-   ├─ cascade
-   │  ├─ 2.criteria
-   │  │  ├─ deleted: 1 reviews, 1 judges, 0 promises, 0 triggers
-   │  │  └─ passage: rewound
-   │  └─ 3.blueprint
-   │     ├─ deleted: 0 reviews, 0 judges, 1 promises, 0 triggers
-   │     └─ passage: rewound
-   └─ done
+   └─ cascade
+      ├─ 2.criteria
+      │  ├─ archived = 1 reviews, 1 judges, 0 promises, 0 triggers
+      │  ├─ yield = absent
+      │  └─ passage = rewound
+      └─ 3.blueprint
+         ├─ archived = 0 reviews, 0 judges, 1 promises, 0 triggers
+         ├─ yield = absent
+         └─ passage = rewound
```

case14 and case15 added for yield drop/keep variants (new snapshots).

## rationalization per change

| change | before | after | why |
|--------|--------|-------|-----|
| header | `route.stone.set` | `route.stone.set --as rewound --yield keep` | shows yield mode in output, tells user what was invoked |
| verb | `deleted:` | `archived =` | semantic accuracy: files moved to archive, not deleted |
| new line | - | `yield = absent/archived/preserved` | core feature: shows yield outcome per stone |
| format | `passage:` | `passage =` | consistency with other `=` separators |
| structure | `├─ cascade` then `└─ done` | `└─ cascade` (no done) | removed redundant final line |

## why these changes are correct

1. **header shows invocation**: the output now echoes the yield mode used, so users see what was applied
2. **archived vs deleted**: yield files go to `.route/.archive/`, they are archived not deleted
3. **yield line is the feature**: this is what the wish asked for - show yield outcome per stone
4. **absent/archived/preserved states**: absent = no yield file, archived = file was moved, preserved = file kept in place
5. **no done line**: was redundant, cascade structure shows completion

## regression check

- no output degraded: format improved (more explicit)
- no information lost: same counts, same passage status
- no dynamic values leaked: no timestamps/ids
- tests still pass: 51 tests verified

## conclusion

all snapshot changes directly implement the yield feature. format improvements are intentional and consistent. no regressions introduced.

