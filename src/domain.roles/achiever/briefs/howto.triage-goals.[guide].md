# howto: triage goals

## .what

triage is the process of review all peer input and ensure each ask is covered by a goal.

## .when

run triage:
- when you receive new peer input
- before you end a session
- when you realize an ask may be uncovered

## .how

### step 1: check triage state

```bash
rhx goal.triage.infer
```

this shows:
- uncovered asks (need goals)
- extant goals (for reference)
- coverage count (what is already linked)

### step 2: for each uncovered ask, decide

1. **new goal?** — create with full schema
2. **update extant?** — add the ask to an extant goal
3. **already covered?** — link the ask to the extant goal

### step 3: create or update goals

for new goal (flags one-by-one):
```bash
rhx goal.memory.set \
  --slug fix-auth-test \
  --why.ask "fix the flaky test in auth.test.ts" \
  --why.purpose "human wants ci to pass before merge" \
  --why.benefit "team can ship" \
  --what.outcome "auth.test.ts passes reliably" \
  --how.task "run test in isolation, find flake source, fix" \
  --how.gate "test passes 10 consecutive runs" \
  --status.choice enqueued \
  --status.reason "goal created from triage" \
  --source peer:human \
  --covers $askHash
```

for extant goal, just add coverage:
```bash
rhx goal.memory.set --slug fix-auth-test --status.choice inflight --covers $askHash
```

### step 4: verify all covered

```bash
rhx goal.triage.infer
```

when uncovered = 0, triage is complete.

## .principles

- **every ask gets a goal** — no ask left behind
- **goals require foresight** — why, what, how must be articulated
- **coverage is explicit** — `--covers` links ask to goal
- **persistence is visible** — `.goals/` is auditable

## .mantra

> to forget an ask is to break a promise. remember.
