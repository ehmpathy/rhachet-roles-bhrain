# self review: has-consistent-conventions

## review

reviewed for divergence from extant name conventions and patterns.

### skill name convention

extant skills:
- `goal.memory.set`
- `goal.memory.get`
- `goal.triage.next`

new skill:
- `goal.triage.infer` (renamed from `goal.infer.triage`)

the rename was explicitly requested because `goal.infer.triage` violated treestruct:
- `goal.triage.next` = noun.noun.verb
- `goal.infer.triage` = noun.verb.noun (wrong)
- `goal.triage.infer` = noun.noun.verb (correct, now symmetric)

### flag convention

extant pattern:
- `goal.triage.next --when hook.onStop`

new pattern:
- `goal.triage.infer --when hook.onStop`

the rename from `--mode` to `--when` was explicitly requested to match extant `--when` usage.

### function name convention

extant pattern:
- `goalMemorySet`
- `goalMemoryGet`
- `goalTriageNext`

new pattern:
- `goalTriageInfer` (renamed from `goalInferTriage`)

follows camelCase with skill name segments.

### why this holds

the changes align with extant conventions:
1. skill names follow noun.noun.verb pattern
2. function names follow camelCase skill name
3. `--when` flag matches extant usage

the rename was prescribed to FIX a convention violation, not introduce divergence.

## outcome

no convention divergence found. the changes align with extant patterns.
