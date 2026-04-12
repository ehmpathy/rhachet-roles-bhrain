# self-review r6: has-consistent-conventions

## verification approach

1. grep for `--mode` and `--when` usage patterns
2. glob for achiever skill names to check conventions

---

## convention 1: flag for hook context

**grep found**:

| flag | usage | file |
|------|-------|------|
| `--mode plan\|apply` | plan/apply pattern | route.ts |
| `--mode hook` | hook context for route.drive | route.ts |
| `--mode hook` | hook context for route.bounce | route.ts |
| `--mode` | triage/hook.onStop for goal.infer.triage | goal.ts:461 |
| `--when hook.onStop` | hook context for goal.triage.next | goal.ts:1150 |

**observation**: two conventions coexist:
- `--mode hook.*` — older pattern
- `--when hook.*` — newer pattern (goal.triage.next uses this)

**wisher stated**: "its a new convention we've adopted"

**blueprint approach**: rename `--mode hook.onStop` to `--when hook.onStop`

**verdict**: consistent with goal.triage.next. the wisher confirmed this is the target convention.

**questioned**: should the blueprint also update `route.drive --mode hook` and `route.bounce --mode hook` to use `--when`?

**answer**: no. the wisher's ask is scoped to goal.triage.infer only. route.* commands are separate domain. if the org decides to adopt `--when` broadly, that's a separate behavior. this blueprint stays focused on the ask.

---

## convention 2: skill name pattern

**glob found** achiever skills:

| skill | pattern |
|-------|---------|
| `goal.guard.sh` | noun.verb |
| `goal.memory.get.sh` | noun.noun.verb |
| `goal.memory.set.sh` | noun.noun.verb |
| `goal.infer.triage.sh` | noun.verb.noun ← inconsistent |
| `goal.triage.next.sh` | noun.noun.verb |

**observation**: `goal.infer.triage` breaks the pattern. should be noun.noun.verb like others.

**blueprint approach**: rename to `goal.triage.infer.sh` (noun.noun.verb)

**questioned**: is `infer` the right verb? alternatives considered:
- `goal.triage.get` — "get the triage state" — but `get` implies retrieval, not analysis
- `goal.triage.check` — "check triage status" — but `check` is weak
- `goal.triage.infer` — "infer which goals need triage" — implies analysis of state

**answer**: `infer` is appropriate. the operation analyzes goal state to infer which goals need triage. it's not a simple getter — it computes/derives the triage state.

**verdict**: aligns with extant convention. matches `goal.triage.next`.

---

## convention 3: function name pattern

**extant functions** in goal.ts:
- `goalMemoryGet` — noun+noun+verb
- `goalMemorySet` — noun+noun+verb
- `goalInferTriage` — noun+verb+noun ← inconsistent
- `goalTriageNext` — noun+noun+verb

**blueprint approach**: rename to `goalTriageInfer` (noun+noun+verb)

**verdict**: aligns with extant convention.

---

## convention 4: output format

**extant pattern** (goal.ts:1220):
```
🔮 goal.triage.next --when hook.onStop
```

**blueprint output**:
```
🔮 goal.triage.infer --when hook.onStop
```

**verdict**: consistent format.

---

## summary

all blueprint choices align with extant conventions:

| choice | extant convention | aligns? |
|--------|------------------|---------|
| `--when hook.onStop` | goal.triage.next uses `--when` | yes |
| `goal.triage.infer` skill | noun.noun.verb pattern | yes |
| `goalTriageInfer` function | camelCase noun+noun+verb | yes |
| treestruct output | same format as goal.triage.next | yes |

the blueprint fixes an inconsistency (goal.infer.triage → goal.triage.infer) to match the extant convention used by goal.triage.next.

---

## questioned: term "complete" vs "triaged"

the blueprint uses `goalsComplete` and `goalsIncomplete` variable names. the partition is based on `status.choice !== 'incomplete'`.

**question**: should we rename to `goalsTriaged` and `goalsUntriaged`?

**extant code** (getTriageState.ts):
```ts
goalsComplete: Goal[];
goalsIncomplete: Goal[];
```

**answer**: keep `goalsComplete`/`goalsIncomplete`. the terms describe the state from triage perspective: incomplete = needs triage, complete = past triage stage. the names match the output display ("incomplete goals", "complete goals"). rename would be scope creep.

---

## questioned: output terms consistency

the output says "incomplete goals" and "complete goals". the status.choice is "incomplete" for untriaged goals.

**question**: is "complete" the right term when status.choice could be "enqueued", "inflight", "blocked", "fulfilled"?

**answer**: yes. from triage perspective:
- "incomplete" = needs triage (fill fields)
- "complete" = triage is done (goal is actionable)

the terms are relative to triage, not goal lifecycle. this is consistent with extant output format.
