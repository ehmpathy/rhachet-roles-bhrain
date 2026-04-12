# self review: has-consistent-conventions (r4)

## deeper review

searched codebase for extant skill name patterns.

### achiever skills directory

```
src/domain.roles/achiever/skills/
├── goal.guard.sh
├── goal.memory.get.sh
├── goal.memory.set.sh
├── goal.triage.next.sh
└── goal.triage.infer.sh   ← new (renamed)
```

### skill name pattern analysis

| skill | pattern | structure |
|-------|---------|-----------|
| goal.guard | noun.verb | exception: guard is both noun and verb |
| goal.memory.get | noun.noun.verb | correct |
| goal.memory.set | noun.noun.verb | correct |
| goal.triage.next | noun.noun.verb | correct |
| goal.triage.infer | noun.noun.verb | correct (after rename) |
| ~~goal.infer.triage~~ | noun.verb.noun | wrong (old name) |

### flag convention verification

searched for `--when` usage:
```bash
grep -r -- "--when" src/domain.roles/achiever/
```

found in `goal.triage.next.sh` usage comment:
```
#   ./goal.triage.next.sh --when hook.onStop
```

new `goal.triage.infer.sh` usage:
```
#   ./goal.triage.infer.sh --when hook.onStop
```

consistent.

### why this holds

1. all achiever skills follow `goal.X.Y` pattern
2. all triage-related skills use `--when` for hook context
3. the rename FIXED a convention violation

## outcome

confirmed alignment with extant conventions after directory and flag search.
