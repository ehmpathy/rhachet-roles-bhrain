# self-review: has-consistent-conventions (round 5)

## pause

tea first. then, we proceed.

i am the reviewer, not the author.

---

## reviewed artifact

`.behavior/v2026_04_02.feat-achiever/3.3.1.blueprint.product.v1.i1.md`

---

## question

does the blueprint use names and patterns consistent with codebase conventions?

---

## codebase conventions scan

### domain.operations names

| extant convention | examples |
|-------------------|----------|
| `set*` for mutations | setPassageReport, setSavepoint, setAnnotation |
| `get*` for reads | getGoals, getReflectScope, getTranscriptSource |
| `getOne*` for single | getOneSavepoint, getOneSnapshot |
| `getAll*` for list | getAllPassageReports, getAllAnnotations |
| `gen*` for find-or-create | genStitchStreamToDisk, genStepArtSet |
| `compute*` for pure | computeMetricsExpected, computeBindOutput |
| `step*` for workflows | stepReflect, stepRouteDrive |

### directory structure

| extant convention | examples |
|-------------------|----------|
| `domain.operations/{domain}/` | `route/`, `reflect/`, `review/` |
| `domain.objects/{Role}/` | `Driver/`, `Reflector/` |
| `domain.roles/{role}/` | `driver/`, `reviewer/`, `reflector/` |

### file names

| extant convention | examples |
|-------------------|----------|
| `{operation}.ts` | `setPassageReport.ts`, `getGoals.ts` |
| `{operation}.test.ts` | `setPassageReport.test.ts` |
| `{operation}.integration.test.ts` | `setPassageReport.integration.test.ts` |

---

## blueprint compliance

### operation names

| blueprint name | convention | verdict |
|----------------|------------|---------|
| setGoal | `set*` for mutations | CONSISTENT |
| setAsk | `set*` for mutations | CONSISTENT |
| setCoverage | `set*` for mutations | CONSISTENT |
| getGoals | `get*` for reads | CONSISTENT |
| getTriageState | `get*` for reads | CONSISTENT |

### directory names

| blueprint path | convention | verdict |
|----------------|------------|---------|
| `domain.operations/goal/` | `domain.operations/{domain}/` | CONSISTENT |
| `domain.objects/Achiever/` | `domain.objects/{Role}/` | CONSISTENT |
| `domain.roles/achiever/` | `domain.roles/{role}/` | CONSISTENT |

### file names

| blueprint file | convention | verdict |
|----------------|------------|---------|
| `setGoal.ts` | `{operation}.ts` | CONSISTENT |
| `setGoal.integration.test.ts` | `{operation}.integration.test.ts` | CONSISTENT |
| `Goal.ts` | domain object | CONSISTENT |
| `Goal.test.ts` | `{type}.test.ts` | CONSISTENT |

### skill names

| blueprint skill | extant pattern | verdict |
|-----------------|----------------|---------|
| `goal.memory.set` | `route.stone.set`, `reflect.snapshot` | CONSISTENT |
| `goal.memory.get` | `route.stone.get` | CONSISTENT |
| `goal.infer.triage` | `route.drive`, `reflect.articulate` | CONSISTENT |

---

## conclusion

**all names and patterns are consistent with codebase conventions.**

- operation names follow get/set/gen verbs
- directories follow extant structure
- files follow extant name patterns
- skills follow extant `.noun.verb` pattern

no divergence from conventions found.

---

## re-review 2026-04-07

i pause. i breathe. i question my prior analysis.

---

### deeper check: domain object location

**extant pattern:**
- `domain.objects/Driver/` for Driver role objects
- `domain.objects/Reflector/` for Reflector role objects

**new pattern:**
- `domain.objects/Achiever/` for Achiever role objects (Goal, Ask, Coverage)

**verdict:** CONSISTENT - PascalCase role name for folder

---

### deeper check: skill file names

**extant pattern:**
- `route.stone.set.sh` + `route.stone.set.cli.ts`
- `route.drive.sh` + `route.drive.cli.ts`

**new pattern:**
- `goal.memory.set.sh` + `goal.memory.set.cli.ts`
- `goal.memory.get.sh` + `goal.memory.get.cli.ts`
- `goal.infer.triage.sh` + `goal.infer.triage.cli.ts`

**verdict:** CONSISTENT - `.sh` + `.cli.ts` pair

---

### deeper check: brief file names

**extant pattern:**
- `define.*.md` for definitions
- `howto.*.md` for guides
- `im_a.*.md` for persona

**new pattern:**
- `define.goals-are-promises.[philosophy].md`
- `howto.triage-goals.[guide].md`
- `im_a.bhrain_owl.md` (symlink)

**verdict:** CONSISTENT - follows brief type prefixes

---

### deeper check: hook names

**extant pattern:**
- driver boot.yml has `onTalk`, `onStop` hooks

**new pattern:**
- achiever boot.yml has `onTalk`, `onStop` hooks

**verdict:** CONSISTENT - same hook names for same events

---

### deeper check: JSONL file names

**extant pattern:**
- `passage.jsonl` for passage state

**new pattern:**
- `asks.inventory.jsonl` for ask accumulation
- `asks.coverage.jsonl` for ask coverage

**verdict:** CONSISTENT - descriptive `.jsonl` suffix

---

### deeper check: flag file pattern

**new pattern:**
- `$offset.$slug.status=$choice.flag`

**is this consistent with codebase?**

this is a new pattern. the codebase uses:
- `.bind.*.flag` for route binds
- no prior `status=*.flag` pattern

**however:** the vision explicitly prescribes this format for O(1) status queries. the pattern is justified by the use case.

**verdict:** NEW PATTERN, justified in vision

---

## final verdict

five rounds of review complete.

all names and conventions are consistent with codebase:
- operation names: get/set verbs
- directory structure: domain.operations/, domain.objects/, domain.roles/
- file names: operation.ts, operation.test.ts
- skill names: domain.noun.verb pattern
- brief names: define.*, howto.*, im_a.*
- hook names: onTalk, onStop

one new pattern (`.status=$choice.flag`) is justified by vision requirements.