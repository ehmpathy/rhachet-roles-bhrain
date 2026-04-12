# self review: has-pruned-backcompat

## review

checked for backwards compatibility concerns that were not explicitly requested.

### backwards compat analysis

| change | backwards compat added? | rationale |
|--------|------------------------|-----------|
| `--mode` → `--when` | no | vision: "hard break. we control the only consumer" |
| `goal.infer.triage` → `goal.triage.infer` | no | vision: "hard break. we control the only consumer" |

### was backwards compat explicitly requested?

no. the vision explicitly stated:
- "hard break. we control the only consumer (`getAchieverRole.ts`). update hook command in same PR."
- "no external consumers to break."

### was backwards compat added anyway?

no. the implementation matches the vision:
- `--mode` flag is removed, not aliased
- old skill name is deleted, not aliased
- the only consumer (getAchieverRole.ts hook) was updated in this PR

### verdict

no unnecessary backwards compat was added. the hard break approach matches what was prescribed.

## outcome

no issues found.
