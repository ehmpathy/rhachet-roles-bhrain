# self review: has-consistent-mechanisms

## review

reviewed for new mechanisms that duplicate extant functionality.

### new mechanisms added

1. **actionable command output per goal**
   - emits: `to fix, run: \`rhx goal.memory.set --slug X --why.purpose "..."\``
   - uses extant field flags from goal.memory.set (no new mechanism)
   - output follows extant treestruct pattern from other skills

2. **per-goal tip output**
   - emits: `tip: run \`rhx goal.memory.get --slug X\` to see the goal`
   - replaces generic hint at bottom
   - output follows extant treestruct pattern

3. **status-based partition**
   - changed from `computeGoalCompleteness(g).complete` to `g.status.choice !== 'incomplete'`
   - simpler logic, no new mechanism
   - `computeGoalCompleteness` still exists and is used elsewhere

### mechanism reuse

| component | new or reused? | notes |
|-----------|----------------|-------|
| field flags | reused | `--why.purpose`, `--why.benefit`, etc. already exist |
| treestruct output | reused | follows extant `├─`, `└─`, `│` patterns |
| goal.memory.set | reused | command shown in output is extant skill |
| goal.memory.get | reused | command shown in output is extant skill |
| getTriageState | modified | partition logic changed, not duplicated |

### why this holds

the implementation reuses extant mechanisms:
- field flags for partial updates (extant in goal.memory.set)
- treestruct output format (extant in all skills)
- goal commands (goal.memory.set, goal.memory.get are extant)

no new utilities or patterns were created.

## outcome

no duplicate mechanisms found. extant patterns were reused.
