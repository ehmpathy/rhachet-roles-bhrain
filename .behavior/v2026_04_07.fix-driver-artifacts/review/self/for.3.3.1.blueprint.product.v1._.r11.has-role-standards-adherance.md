# self-review r11: has-role-standards-adherance

## verdict: pass

## rule directories enumerated

these briefs directories are relevant to this blueprint:

| directory | relevance |
|-----------|-----------|
| `lang.terms/` | name conventions, gerunds, treestruct, ubiqlang |
| `code.prod/evolvable.domain.operations/` | get/set/gen verbs, operation grains |
| `code.prod/evolvable.procedures/` | input-context pattern, arrow-only |
| `code.prod/readable.narrative/` | narrative flow, named transformers |
| `code.test/frames.behavior/` | given/when/then pattern |
| `code.test/scope.coverage/` | test coverage by grain |

## standards check by category

### lang.terms/

**rule.require.treestruct** — `[verb][...noun]` for mechanisms

| blueprint element | pattern | verdict |
|------------------|---------|---------|
| `asArtifactByPriority` | `as` + `Artifact` + `ByPriority` | ✓ follows `as*` transformer pattern |
| `getAllStoneArtifacts` | `getAll` + `Stone` + `Artifacts` | ✓ follows `getAll*` pattern |
| `getAllStoneDriveArtifacts` | `getAll` + `Stone` + `Drive` + `Artifacts` | ✓ follows `getAll*` pattern |

**rule.forbid.gerunds** — no `-ing` as nouns

| blueprint section | gerund check |
|------------------|--------------|
| function names | no gerunds ✓ |
| variable names | no gerunds ✓ |
| comments | no gerunds ✓ |

**rule.require.ubiqlang** — consistent terms

| term | usage in blueprint | consistent? |
|------|-------------------|-------------|
| artifact | stone output file | ✓ matches extant usage |
| stone | behavior task unit | ✓ matches extant usage |
| route | behavior directory | ✓ matches extant usage |
| priority | selection order | ✓ clear domain term |

---

### code.prod/evolvable.domain.operations/

**rule.require.get-set-gen-verbs** — all operations use get/set/gen

| operation | verb | correct? |
|-----------|------|----------|
| `getAllStoneArtifacts` | `getAll` | ✓ retrieves without mutate |
| `getAllStoneDriveArtifacts` | `getAll` | ✓ retrieves without mutate |
| `asArtifactByPriority` | `as` | ✓ transformer (not operation) |

**define.domain-operation-grains** — correct grain for each operation

| operation | grain | verdict |
|-----------|-------|---------|
| `asArtifactByPriority` | transformer | ✓ pure, no i/o |
| `getAllStoneArtifacts` | orchestrator | ✓ composes glob + transformer |

---

### code.prod/evolvable.procedures/

**rule.require.input-context-pattern** — `(input, context?)`

blueprint shows:
```typescript
const asArtifactByPriority = (input: {
  artifacts: string[];
  stoneName: string;
}): string | null => {
```

verdict: ✓ follows `(input)` pattern for pure transformer (no context needed)

**rule.require.arrow-only** — no `function` keyword

blueprint shows: `const asArtifactByPriority = (...) => {`

verdict: ✓ uses arrow function

---

### code.prod/readable.narrative/

**rule.require.named-transformers** — extract decode-friction to named operations

blueprint extracts priority resolution to `asArtifactByPriority` transformer.

verdict: ✓ no inline decode-friction in orchestrators

---

### code.test/frames.behavior/

**rule.require.given-when-then** — use given/when/then from test-fns

blueprint test tree shows:
```
├── [case1] .yield.md preferred over .v1.i1.md
├── [case2] .yield.json recognized
...
```

this uses `[caseN]` labels per `howto.write-bdd.[lesson].md`.

verdict: ✓ follows BDD structure

**rule.require.test-coverage-by-grain**

| grain | required test scope | blueprint declares |
|-------|--------------------|--------------------|
| transformer | unit test | `asArtifactByPriority.test.ts` ✓ |
| orchestrator | integration test | `getAllStoneArtifacts.test.ts` ✓ |
| contract | acceptance test | `driver.route.artifact-patterns.acceptance.test.ts` ✓ |

---

## junior anti-pattern check

| potential anti-pattern | checked | verdict |
|-----------------------|---------|---------|
| positional args | input is object, not positional | ✓ none |
| else branches | no else in blueprint code | ✓ none |
| decode-friction inline | extracted to transformer | ✓ none |
| mutable vars | no let/var in blueprint | ✓ none |
| as-cast | no type casts in blueprint | ✓ none |

## conclusion

blueprint adheres to mechanic role standards. name conventions follow treestruct and ubiqlang. operations follow get/set/gen verbs. procedures follow input-context and arrow-only patterns. tests follow given/when/then and coverage by grain. no anti-patterns detected.
