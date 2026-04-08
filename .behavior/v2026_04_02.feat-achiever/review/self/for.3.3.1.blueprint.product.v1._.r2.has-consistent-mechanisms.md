# self-review: has-consistent-mechanisms (round 2)

## pause

tea first. then, we proceed.

i am the reviewer, not the author.

the review is the work itself.

---

## reviewed artifact

`.behavior/v2026_04_02.feat-achiever/3.3.1.blueprint.product.v1.i1.md`

i re-read the artifact slowly, line by line.

---

## round 1 findings

round 1 found:
- JSONL patterns: consistent with extant (setPassageReport, getAllPassageReports)
- DomainLiteral patterns: consistent with extant
- **issue:** YAML serialization assumes domain-objects support that doesn't exist

---

## round 2: deeper analysis of YAML issue

### what does the blueprint actually need?

**setGoal** writes a Goal to `.goal.yaml`:
```yaml
slug: fix-auth-test
why:
  ask: fix the test
  purpose: human wants ci to pass
  benefit: unblocks the pr
what:
  outcome: auth.test.ts passes reliably
how:
  task: run test in isolation, identify flake source
  gate: test passes 10 consecutive runs
status:
  choice: enqueued
  reason: goal created from triage
source: peer:human
createdAt: "2026-04-02"
updatedAt: "2026-04-02"
```

**getGoals** reads Goal from `.goal.yaml`.

### options analysis

**option 1: JSON masqueraded as YAML**
- YAML is a superset of JSON
- write JSON with `.yaml` extension
- less human-readable but valid

**verdict:** not ideal — defeats the purpose of YAML for human readability.

**option 2: add js-yaml dependency**
- standard approach for node.js YAML
- widely used, well-maintained

**verdict:** adds dependency but is the correct approach.

**option 3: custom simple YAML serializer**
- like parseStoneGuard but in reverse
- handles Goal's specific nested structure

**verdict:** possible but error-prone for nested objects.

### recommended approach

**use js-yaml** — this is the standard node.js approach for YAML.

the blueprint note "[←] reuse: YAML serialize from domain-objects" is incorrect. it should say:

```
└── [←] add: js-yaml for YAML serialize/parse
```

### does this change the blueprint structure?

no — the file structure and operations remain the same. only the implementation detail changes:
- import js-yaml
- use `yaml.dump()` for write
- use `yaml.load()` for read

---

## action required

**update blueprint** to clarify YAML approach:
- change "[←] reuse: YAML serialize from domain-objects"
- to "[+] use: js-yaml for YAML serialize/parse"

**add dependency** at implementation time:
- `pnpm add js-yaml @types/js-yaml`

---

## conclusion

**issue clarified, solution identified.**

the blueprint's "[←] reuse" annotation is incorrect for YAML. the correct approach:
- use js-yaml library (standard for node.js YAML)
- update blueprint annotation to reflect this

this is a minor clarification, not a structural change. the blueprint remains valid with this note.

