# has-journey-tests-from-repros review (r4)

## slow review process

1. locate the repros artifact
2. enumerate journey test sketches from repros
3. verify each sketch has a test implementation
4. confirm BDD structure for each test

---

## step 1: locate the repros artifact

**command:**
```
git ls-files '.behavior/v2026_04_07.fix-driver-artifacts/' | grep -i repro
```

**result:** no matches

**verification:**
```
git ls-files '.behavior/v2026_04_07.fix-driver-artifacts/'
```

shows all artifacts in route:
- `0.wish.md`
- `1.vision.stone`, `1.vision.md`, `1.vision.guard`
- `2.1.criteria.blackbox.stone`
- `2.2.criteria.blackbox.matrix.stone`
- `3.1.3.research.internal.product.code.prod._.v1.stone`
- `3.1.3.research.internal.product.code.test._.v1.stone`
- `3.3.1.blueprint.product.v1.stone`, `3.3.1.blueprint.product.v1.guard`, `3.3.1.blueprint.product.v1.i1.md`
- `4.1.roadmap.v1.stone`
- `5.1.execution.phase0_to_phaseN.v1.stone`, `5.1.execution.phase0_to_phaseN.v1.guard`
- `5.3.verification.v1.stone`, `5.3.verification.v1.guard`

**no `3.2.distill.repros*` artifact exists.**

---

## step 2: why no repros artifact?

the behavior route structure shows this implementation follows a different path than one with repros:

| stone | purpose | present? |
|-------|---------|----------|
| 0.wish | define the goal | yes |
| 1.vision | envision the outcome | yes |
| 2.criteria | define acceptance criteria | yes |
| 3.1.research | research the codebase | yes |
| 3.2.repros | capture user journey sketches | **no** |
| 3.3.blueprint | technical implementation plan | yes |
| 4.roadmap | phase the work | yes |
| 5.execution | implement | yes |
| 5.3.verification | verify | yes (current) |

**why this is valid:**

this behavior is a pure transformer change. the wish states:

> instead of the `v1.i1.md` pattern ... upgrade to use the `yield.md` pattern

this is:
- internal infrastructure change (driver artifact discovery)
- no user-visible journey (no UI, no CLI command, no API endpoint)
- pure code refactor with backwards compat

repros capture **user experience journeys** to implement. this change has no user-visible journey to capture — it's an internal name convention upgrade.

---

## step 3: journey test coverage comes from elsewhere

instead of repros, journey test coverage comes from:

### source 1: blueprint test tree

the blueprint (`3.3.1.blueprint.product.v1.i1.md`) defines the test tree:

```
src/domain.operations/route/stones/
├── [+] asArtifactByPriority.ts
├── [+] asArtifactByPriority.test.ts           # unit: transformer
│   ├── [case1] .yield.md preferred over .v1.i1.md
│   ├── [case2] .yield.json recognized
│   ├── [case3] .yield (extensionless) recognized
│   ├── [case4] .v1.i1.md recognized (backwards compat)
│   ├── [case5] .i1.md recognized (test compat)
│   └── [case6] no match returns null
```

### source 2: criteria blackbox usecases

the criteria (`2.1.criteria.blackbox.stone`) defines acceptance:

```
given('a behavior route with stones')
  when('driver checks stone completion')
    then('recognizes {stone}.yield.md as artifact')
    then('recognizes {stone}.yield.json as artifact')
    then('recognizes {stone}.yield (no extension) as artifact')
    then('recognizes {stone}.v1.i1.md as artifact')
```

### verification: were these implemented?

| blueprint case | test file | implemented? |
|----------------|-----------|--------------|
| case1: .yield.md over .v1.i1.md | `asArtifactByPriority.test.ts` | yes |
| case2: .yield.json recognized | `asArtifactByPriority.test.ts` | yes |
| case3: .yield extensionless | `asArtifactByPriority.test.ts` | yes |
| case4: .v1.i1.md backwards compat | `asArtifactByPriority.test.ts` | yes |
| case5: .i1.md test compat | `asArtifactByPriority.test.ts` | yes |
| case6: no match returns null | `asArtifactByPriority.test.ts` | yes |

---

## step 4: confirm BDD structure in implemented tests

**verification command:**
```
git diff main --name-only -- '*.test.ts'
```

**result:**
```
src/domain.operations/route/stones/asArtifactByPriority.test.ts
```

**test structure verification:**

the new test file uses BDD structure:

```typescript
describe('asArtifactByPriority', () => {
  given('[case1] .yield.md and .v1.i1.md both present', () => {
    when('[t0] priority is resolved', () => {
      then('.yield.md is preferred over .v1.i1.md', () => { ... });
    });
  });
  // ... more cases
});
```

each test case has:
- `given` block with case number
- `when` block with `[t0]` step label
- `then` block with assertion

---

## summary

| question | answer | evidence |
|----------|--------|----------|
| does repros artifact exist? | no | git ls-files shows no 3.2.distill.repros |
| is absent repros valid? | yes | internal change with no user journey |
| where do test specs come from? | blueprint + criteria | 3.3.1.blueprint.product.v1.i1.md |
| were all blueprint cases implemented? | yes | all 6 cases in asArtifactByPriority.test.ts |
| do tests use BDD structure? | yes | given/when/then with case labels |

**no repros artifact exists, which is valid for this internal infrastructure change. test coverage comes from the blueprint test tree, and all specified cases are implemented with proper BDD structure.**

