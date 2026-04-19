# self-review: has-snap-changes-rationalized

## snapshot changes in this branch

### new files (added)

| file | rationale |
|------|-----------|
| `driver.route.set.yield.acceptance.test.ts.snap` | new test file for yield feature - 3 snapshots capture yield drop, keep, and cascade output |

### modified files (feature-related)

| file | change | rationale |
|------|--------|-----------|
| `driver.route.set.acceptance.test.ts.snap` | output format updated | rewind output now shows `--yield keep` in header and `yield = absent/archived/preserved` line items |
| `setStoneAsRewound.test.ts.snap` | output format updated | rewound format now includes yield outcomes |
| `formatRouteStoneEmit.test.ts.snap` | format updated | yield mode shown in header and cascade items |
| `driver.route.rewind-drive.acceptance.test.ts.snap` | format updated | rewound output format changed |

### modified files (unrelated to yield feature)

| file | change | rationale |
|------|--------|-----------|
| `achiever.goal.*.snap` | various | achiever/goal feature work (separate from yield) |
| `reflect.*.snap` | various | reflect feature work (separate from yield) |
| `driver.route.stone.add.*.snap` | added | stone.add feature work (separate from yield) |

## common regressions check

- [ ] output format degraded? **no** - format improved (more explicit yield state)
- [ ] error messages less helpful? **no** - no error message changes
- [ ] timestamps/ids leaked? **no** - no dynamic values in output
- [ ] extra output unintentionally? **no** - yield line is intentional

## feature-related snapshot diff review

the rewound output format changed from:
```
├─ stone
│  ├─ deleted: N reviews, N judges...
│  └─ passage: rewound
└─ done
```

to:
```
├─ stone
│  ├─ archived = N reviews, N judges...
│  ├─ yield = archived/preserved/absent
│  └─ passage = rewound
```

changes:
- `deleted:` → `archived =` (semantic clarity)
- added `yield = ` line (new feature)
- `passage:` → `passage =` (consistency)
- removed final `done` (redundant)

all changes are intentional to support the yield feature.

## conclusion

every snap change is intentional and rationalized. no regressions found.
