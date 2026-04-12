# self-review r9: has-role-standards-adherance

## rule directories enumeration

verified via `tree -d .agent/repo=ehmpathy/role=mechanic/briefs/practices`:

### code.prod (13 subdirectories)

| directory | relevant? | why |
|-----------|-----------|-----|
| consistent.artifacts | no | blueprint doesn't specify artifacts |
| consistent.contracts | no | no API contracts changed |
| evolvable.architecture | no | no architectural changes |
| evolvable.domain.objects | no | Goal object not modified |
| evolvable.domain.operations | **yes** | getTriageState.ts changes |
| evolvable.procedures | **yes** | goal.ts function changes |
| evolvable.repo.structure | no | no new files in new locations |
| pitofsuccess.errors | **yes** | exit code semantics |
| pitofsuccess.procedures | **yes** | idempotency considerations |
| pitofsuccess.typedefs | no | no type changes |
| readable.comments | no | no new comment patterns |
| readable.narrative | no | no complex control flow added |
| readable.persistence | no | no persistence changes |

### code.test (6 subdirectories)

| directory | relevant? | why |
|-----------|-----------|-----|
| consistent.contracts | no | test contracts unchanged |
| frames.behavior | **yes** | acceptance test patterns |
| frames.caselist | no | not using caselist pattern |
| lessons.howto | no | general guidance |
| scope.acceptance | **yes** | blackbox test rules |
| scope.unit | **yes** | remote boundary rules |

### lang.terms + lang.tones

| directory | relevant? | why |
|-----------|-----------|-----|
| lang.terms | **yes** | name conventions |
| lang.tones | **yes** | output format (treestruct, turtle vibes) |

### work.flow (4 subdirectories)

| directory | relevant? | why |
|-----------|-----------|-----|
| diagnose | no | not a diagnosis task |
| refactor | no | not a refactor task |
| release | no | not a release task |
| tools | no | not introducing new tools |

---

**total directories**: 29
**relevant directories**: 10
**not relevant**: 19 (confirmed)

---

## check: rule.require.input-context-pattern

blueprint modifies `goalTriageInfer` and `goalTriageNext` functions.

extant signature pattern in goal.ts uses `(args, context?)` style for CLI functions.

**question**: do the functions follow (input, context) pattern?

**verification needed**: read goal.ts function signatures

from grep earlier, `goalTriageInfer` parses `process.argv` directly — this is CLI entrypoint style, not domain operation style. CLI functions parse args, domain operations take `(input, context)`.

**verdict**: correct. CLI entrypoints parse argv, then call domain operations with (input, context).

---

## check: rule.require.get-set-gen-verbs

blueprint uses `getTriageState` — this is a `get` verb for retrieval.

**question**: does `getTriageState` follow the pattern?

- `get` verb: retrieval without mutation ✅
- returns computed state based on inputs ✅
- no side effects ✅

**verdict**: correct.

---

## check: rule.require.exit-code-semantics

blueprint shows exit codes for hook mode:

from codepath:
```
hook.onStop mode
├─ if uncovered asks or incomplete goals: exit 2
└─ if all clear: exit 0
```

**question**: does exit 2 follow semantic exit code rules?

rule.require.exit-code-semantics says:
- exit 0: success
- exit 1: malfunction (external error)
- exit 2: constraint (user must fix)

triage failure = user must fix goals = constraint = exit 2 ✅

**verdict**: correct.

---

## check: rule.require.given-when-then

blueprint test coverage tables use BDD-style descriptions.

**question**: do acceptance tests follow given-when-then?

from blueprint:
```
| [+] | incomplete goal output shows actionable command | contains `to fix, run:` |
```

this is scenario + expectation format, compatible with given-when-then when implemented.

**verdict**: correct format for test specification.

---

## check: rule.forbid.gerunds

blueprint uses these terms:
- "partition" (noun/verb, not gerund) ✅
- "actionable" (adjective) ✅
- "renamed" (past participle) ✅

no gerunds found in blueprint.

**verdict**: correct.

---

## check: rule.require.ubiqlang

terms in blueprint:
- `goalsComplete` / `goalsIncomplete` — domain terms ✅
- `status.choice` — domain field ✅
- `computeGoalCompleteness` — domain function ✅
- `meta.absent` — domain property ✅

all terms match extant domain vocabulary.

**verdict**: correct.

---

## check: rule.prefer.treestruct-output

blueprint output format uses treestruct:
```
├─ incomplete goals
│  ├─ slug [status]
│  │  ├─ absent: fields
│  │  └─ to fix, run: ...
```

**verdict**: correct.

---

## check: rule.require.idempotent-procedures (pitofsuccess.procedures)

**question**: are the operations idempotent?

| operation | idempotent? | why |
|-----------|-------------|-----|
| getTriageState | yes | pure read, no mutation |
| goalTriageInfer | yes | pure read + output, no mutation |
| goalTriageNext | yes | pure read + output, no mutation |

all operations are read-only. no state mutation. safe to retry.

**verdict**: correct.

---

## check: rule.require.blackbox (scope.acceptance)

blueprint acceptance tests access via contract layer only:
- invoke `rhx goal.triage.infer` (shell skill)
- assert on stdout/stderr output
- assert on exit code

no direct imports from domain.operations in acceptance tests.

**verdict**: correct.

---

## check: rule.forbid.remote-boundaries (scope.unit)

blueprint unit tests for `getTriageState.integration.test.ts`:
- named `.integration.test.ts` (not `.test.ts`)
- touches filesystem (reads goal files)
- correct classification as integration test

no unit tests cross remote boundaries.

**verdict**: correct.

---

## summary

| rule | adherance |
|------|-----------|
| rule.require.input-context-pattern | ✅ CLI parses args, domain ops take (input, context) |
| rule.require.get-set-gen-verbs | ✅ getTriageState follows get pattern |
| rule.require.exit-code-semantics | ✅ exit 2 for constraint errors |
| rule.require.given-when-then | ✅ test spec follows BDD format |
| rule.forbid.gerunds | ✅ no gerunds in blueprint |
| rule.require.ubiqlang | ✅ uses domain vocabulary |
| rule.prefer.treestruct-output | ✅ uses tree structure |
| rule.require.idempotent-procedures | ✅ all operations are read-only |
| rule.require.blackbox | ✅ acceptance tests via contract layer |
| rule.forbid.remote-boundaries | ✅ integration tests named correctly |

**directories checked**: 10/10 relevant
**violations found**: 0
