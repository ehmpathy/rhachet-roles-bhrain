# self-review: has-clear-instructions

## the question

are the instructions followable?
- can the foreman follow without prior context?
- are commands copy-pasteable?
- are expected outcomes explicit?

## review of the playtest

### followable without prior context?

**yes.** the playtest:
- states prerequisites (repo, pnpm, build)
- explains sandbox location
- each step is self-contained

a foreman who has never seen the codebase can follow these steps.

### commands copy-pasteable?

**yes.** all commands are in code blocks:

```bash
npm run test:unit -- src/domain.operations/route/stones/getAllStoneArtifacts.test.ts
npm run test:acceptance -- blackbox/driver.route.artifact-expansion.acceptance.test.ts
grep -n '/\$route/g' src/domain.operations/route/stones/getAllStoneArtifacts.ts
```

no manual work required. paste and run.

### expected outcomes explicit?

**yes.** each step has "expected outcome" section:

| step | expected outcome |
|------|------------------|
| 1 | tests pass, [case4] verifies |
| 2 | tests pass, [case5] verifies |
| 3 | all 4 test cases pass |
| edgey | grep shows global replacement |

## pass/fail criteria explicit?

**yes.** the playtest has explicit criteria:

- pass if: tests pass + grep confirms pattern
- fail if: "artifact not found" errors, literal $route, or cwd still set

## conclusion

the instructions are clear and followable:
1. prerequisites stated
2. commands copy-pasteable
3. expected outcomes explicit
4. pass/fail criteria defined

criterion holds.
