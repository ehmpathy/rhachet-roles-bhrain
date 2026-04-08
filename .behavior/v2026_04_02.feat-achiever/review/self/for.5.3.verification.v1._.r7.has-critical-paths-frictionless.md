# self-review: has-critical-paths-frictionless (r7)

## the question

are the critical paths from repros frictionless in practice?

- for each critical path identified in repros, is the implementation smooth?
- are there unnecessary steps, unclear output, or hidden gotchas?

## the review

### critical paths from repros

the repros artifact (3.2.distill.repros.experience._.v1.i1.md) identifies three critical paths:

1. **triage on session end** — "this is the core promise — no ask lost"
2. **goal creation with full schema** — "forced foresight is the differentiation"
3. **coverage verification** — "proof that triage worked"

### path 1: triage on session end

**implementation:** `goalInferTriage` CLI with `--mode hook.onStop` (goal.ts lines 670-686)

**the flow:**
```
hook.onStop fires
  → goal.infer.triage --mode hook.onStop
  → getTriageState computes uncovered asks
  → if uncovered > 0: exit 2 with halt message
  → if all covered: silent exit 0
```

**frictionless assessment:**

| aspect | status | evidence |
|--------|--------|----------|
| single command | yes | `rhx goal.infer.triage --mode hook.onStop` |
| clear halt message | yes | "halted, triage required" with guidance |
| actionable next step | yes | "to continue, run rhx goal.infer.triage" |
| silent success | yes | all covered = exit 0, no output |

**verdict:** frictionless. the path is minimal and clear.

### path 2: goal creation with full schema

**implementation:** `goalMemorySet` CLI with YAML stdin (goal.ts lines 510-620)

**the flow:**
```
brain wants to create goal
  → cat goal.yaml | rhx goal.memory.set --scope repo
  → validates full schema via computeGoalCompleteness
  → if incomplete: error with absent fields listed
  → if complete: writes .goal.yaml and .status=*.flag
```

**frictionless assessment:**

| aspect | status | evidence |
|--------|--------|----------|
| clear error on incomplete | yes | "absent fields: X, Y, Z" (lines 582-583) |
| usage hints | yes | shows both YAML and flag alternatives (lines 586-590) |
| partial goal escape hatch | yes | can use --slug with field flags for quick capture |
| meta tracks completeness | yes | `meta.complete: true/false` in output |

**verdict:** frictionless. schema is enforced for YAML mode, with clear escape hatch for partial capture.

### path 3: coverage verification

**implementation:** `getTriageState` operation (getTriageState.ts lines 14-73)

**the flow:**
```
brain wants to verify coverage
  → rhx goal.infer.triage --scope repo
  → reads asks.inventory.jsonl
  → reads asks.coverage.jsonl
  → computes uncovered = inventory - coverage
  → displays all metrics
```

**frictionless assessment:**

| aspect | status | evidence |
|--------|--------|----------|
| single command | yes | `rhx goal.infer.triage` |
| all metrics visible | yes | asks, uncovered, goals, coverage counts |
| uncovered list | yes | shows hash + content preview for each |
| incomplete goals shown | yes | separate section with absent fields |

**verdict:** frictionless. full triage state visible with one command.

### additional friction check

**stdin read timeout:** goal.ts line 313 uses `timeout: 100` for stdin read. this is intentional — allows non-stdin invocations to proceed without wait. verified via acceptance tests that both YAML stdin and flag-only modes work.

**scope resolution:** `getScopeDir` (lines 40-72) throws clear errors:
- main/master forbidden: "goals on main/master branch are forbidden"
- route scope outside route: "--scope route requires brain to be in a route directory"

**partial goal merge:** when a partial goal is updated with `--slug`, the code merges new fields with extant fields (lines 416-462). this enables incremental completion without data loss.

## conclusion

**holds: yes**

all three critical paths are frictionless:

1. **triage on session end:** single command, clear halt, actionable guidance
2. **goal creation with full schema:** enforced validation with helpful errors and escape hatch
3. **coverage verification:** all state visible with one command

no unnecessary steps, clear output, no hidden gotchas identified.
