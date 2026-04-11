# self-review: has-critical-paths-identified

## question: did I identify the critical paths?

### happy paths marked as critical?

| path | is happy path? | marked critical? | verdict |
|------|----------------|------------------|---------|
| inflight reminder | yes — main success flow | yes | holds |
| guard block | yes — main protection flow | yes | holds |
| skill allow | yes — skills must work | yes | holds |

**why it holds:** all three happy paths are marked as critical. the inflight reminder is the main accountability flow, the guard block is the main enforcement flow, and skill allow ensures the achiever role still functions.

### why each must be frictionless

| critical path | why frictionless | clear? |
|---------------|------------------|--------|
| inflight reminder | prevents silent abandonment of work | holds |
| guard block | prevents bots from escape via file delete | holds |
| skill allow | if skills break, entire achiever role fails | holds |

**why it holds:** each critical path has clear justification tied to the core value proposition — accountability and enforcement.

### what if each critical path failed?

| path | failure mode | consequence |
|------|--------------|-------------|
| inflight reminder | no output shown | bots abandon work silently — defeats purpose |
| guard block | rm .goals/ succeeds | bots delete accountability — defeats purpose |
| skill allow | skills blocked | achiever role unusable — system failure |

**why it holds:** failure consequences are severe for all three paths. correctly identified as critical.

---

## pit of success review

### critical path 1: inflight reminder

| property | assessment | why it holds |
|----------|------------|--------------|
| narrower inputs | `--when hook.onStop` and `--scope` | constrained to valid modes |
| convenient | scope inferred via `getDefaultScope()` | no manual config needed |
| expressive | flags allow explicit override | can force specific scope |
| failsafes | exit 0 when no goals | graceful silent exit |
| failfasts | N/A | no invalid inputs possible |
| idempotency | read-only operation | same output for same state |

### critical path 2: guard block

| property | assessment | why it holds |
|----------|------------|--------------|
| narrower inputs | stdin JSON structure | constrained by claude code |
| convenient | hook receives all context | no manual assembly |
| expressive | path regex allows precision | can tune match pattern |
| failsafes | exit 0 when not matched | allows non-goals access |
| failfasts | exit 2 with clear message | immediate feedback |
| idempotency | stateless check | deterministic output |

### critical path 3: skill allow

| property | assessment | why it holds |
|----------|------------|--------------|
| narrower inputs | skill invocations via `rhx goal.*` | constrained to known skills |
| convenient | skills hide file operations | user doesn't touch .goals/ |
| expressive | N/A | skills are the interface |
| failsafes | must NOT block | critical: skills = escape hatch |
| failfasts | N/A | no invalid state possible |
| idempotency | skill-level guarantee | each skill is idempotent |

---

## conclusion

**issues found:** none

**why it holds:**
1. all three critical paths (inflight reminder, guard block, skill allow) are correctly identified as happy paths
2. each has clear justification for why it must be frictionless
3. failure consequences are severe and well-understood
4. all pass pit of success review across all six dimensions

the critical paths cover the three core flows:
- reminder (accountability)
- protection (enforcement)
- escape hatch (skills still work)

no changes needed.

