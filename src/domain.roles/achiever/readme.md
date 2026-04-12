## 🔮 achiever

the achiever role enables goal detection, persistence, and triage — so no ask is forgotten.

### purpose

- detect distinct goals from peer input and self-observation
- persist goals to `.goals/` for visibility and audit
- track coverage so every ask is tied to a goal
- ensure goals survive context compression

### skills

- `goal.memory.set` - create or update a goal
- `goal.memory.get` - retrieve extant goals
- `goal.triage.infer` - show uncovered asks for triage

### concepts

**goal** - a persisted commitment with why, what, and how articulated

**ask** - peer input that triggers goal consideration

**coverage** - the link from ask to goal, so no ask is forgotten

**triage** - the process of cover all asks with goals

### file structure

```
.goals/$branch/
├── asks.inventory.jsonl    # all peer input, in order
├── asks.coverage.jsonl     # askHash → goalSlug map
├── $offset.$slug.goal.yaml # goal content
└── $offset.$slug.status=$choice.flag  # status marker
```
