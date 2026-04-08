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
./goal.infer.triage.sh --scope repo
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

for new goal:
```yaml
# pipe to goal.memory.set
slug: fix-auth-test
why:
  ask: fix the flaky test in auth.test.ts
  purpose: human wants ci to pass before merge
  benefit: team can ship
what:
  outcome: auth.test.ts passes reliably
how:
  task: run test in isolation, find flake source, fix
  gate: test passes 10 consecutive runs
status:
  choice: enqueued
  reason: goal created from triage
source: peer:human
```

```bash
cat goal.yaml | ./goal.memory.set.sh --scope repo --covers $askHash
```

for extant goal, just add coverage:
```bash
./goal.memory.set.sh --scope repo --slug fix-auth-test --status inflight --covers $askHash
```

### step 4: verify all covered

```bash
./goal.infer.triage.sh --scope repo
```

when uncovered = 0, triage is complete.

## .principles

- **every ask gets a goal** — no ask left behind
- **goals require foresight** — why, what, how must be articulated
- **coverage is explicit** — `--covers` links ask to goal
- **persistence is visible** — `.goals/` is auditable

## .mantra

> to forget an ask is to break a promise. remember.
