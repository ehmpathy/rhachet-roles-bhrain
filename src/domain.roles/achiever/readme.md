## 💎 achiever

the achiever meets its goals: it tracks every ask to a goal, and it acts on what it sees, with no excuse and no relay.

each `X.md.min` here condenses the `X.md` beside it. read the `.md` for the argument.

### purpose

- detect distinct goals from peer input and self-observation
- persist goals to `.goals/` for visibility and audit
- track coverage so every ask is tied to a goal
- ensure goals survive context compression
- act on sight, build never relay, cure at the owner, keep the top goals in view

### the four laws

| law | brief |
|---|---|
| act on sight | `rule.always.act-on-sight` |
| build, never relay | `rule.always.build-never-relay` |
| cure at the owner | `rule.always.cure-at-the-owner` |
| keep the top goals in view | `rule.always.keep-the-top-goals-in-view` |

persona: `im_an.achiever` · cited canon: `define.achiever.lessons-from-the-greats` (ref) · one dated case beside each law (`.example=`, ref)

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
