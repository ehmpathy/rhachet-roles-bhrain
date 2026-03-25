# self-review: behavior-declaration-coverage (r5)

## question

is every requirement from vision/criteria/blueprint implemented?

---

## deep review

I opened each artifact and traced requirements to code lines in `getAllStoneArtifacts.ts`.

### vision requirements → code verification

**vision line 20**: "expands `$route` to the actual route path"
- **code line 25**: `const expandedGlob = glob.replace(/\$route/g, input.route);`
- **why it holds**: `input.route` contains the actual route path like `.behavior/v2026_03_24.xyz/`. the regex `/\$route/g` matches all `$route` instances and replaces with the path.

**vision line 21**: "runs glob from repo root (no `cwd` override)"
- **code lines 26-29**: `cwd: process.cwd()`
- **why it holds**: `process.cwd()` returns repo root, not the route directory. this differs from the old code that used `cwd: input.route`.

**vision line 73**: "prefix default pattern with route path"
- **code line 19**: `` `${input.route}/${input.stone.name}*.md` ``
- **why it holds**: when no guard artifacts are specified, the default pattern prepends `input.route/` to the stone name pattern.

**vision line 108**: "never use `cwd: input.route`"
- **verified**: grep for `cwd: input.route` in getAllStoneArtifacts.ts returns zero matches
- **code uses**: `cwd: process.cwd()` instead

### criteria requirements → code verification

**criterion**: "all $route instances are expanded"
- **code line 25**: regex `/\$route/g` with `g` flag
- **why it holds**: the `g` flag means "global" — replaces ALL matches, not just first

**criterion**: "patterns without $route are used as-is from repo root"
- **code line 25**: `glob.replace(/\$route/g, input.route)` returns original string if no `$route` present
- **why it holds**: if `$route` not in pattern, `.replace()` returns the unchanged glob. then `cwd: process.cwd()` runs it from repo root.

**criterion**: "empty array for no matches"
- **code**: `enumFilesFromGlob` returns `[]` when no files match
- **why it holds**: this is `enumFilesFromGlob`'s contract, not new code. verified by unit tests.

### blueprint code diff → actual code

**blueprint specifies**:
```ts
const globs = hasCustomArtifacts
  ? input.stone.guard!.artifacts
  : [`${input.route}/${input.stone.name}*.md`];

for (const glob of globs) {
  const expandedGlob = glob.replace(/\$route/g, input.route);
  const matches = await enumFilesFromGlob({ glob: expandedGlob });
}
```

**actual code (lines 17-30)**:
```ts
const globs = hasCustomArtifacts
  ? input.stone.guard!.artifacts
  : [`${input.route}/${input.stone.name}*.md`];

const allMatches: string[] = [];
for (const glob of globs) {
  const expandedGlob = glob.replace(/\$route/g, input.route);
  const matches = await enumFilesFromGlob({
    glob: expandedGlob,
    cwd: process.cwd(),
  });
  allMatches.push(...matches);
}
```

**diff from blueprint**:
1. adds `cwd: process.cwd()` — blueprint omitted this but it's required for explicit repo root
2. adds `allMatches` aggregation — blueprint showed only the loop body

**why it holds**: the additions are necessary. `cwd: process.cwd()` makes repo root explicit. `allMatches` aggregation handles multiple globs.

### edge cases from vision → verification

| edge case | code behavior | why it holds |
|-----------|---------------|--------------|
| no guard artifacts | default pattern `${input.route}/...` (line 19) | tested in unit tests |
| no $route in pattern | `.replace()` returns original string | js string.replace semantics |
| $route appears multiple times | all replaced (line 25, `g` flag) | regex global flag |
| pattern has no matches | returns `[]` | enumFilesFromGlob contract |

---

## test coverage verification

| test file | tests | status |
|-----------|-------|--------|
| `getAllStoneArtifacts.test.ts` | 3 tests | pass |
| `driver.route.artifact-expansion.acceptance.test.ts` | 19 tests | pass |

I ran `npm run test:acceptance:locally -- driver.route.artifact-expansion` to confirm.

---

## conclusion

every requirement from vision, criteria, and blueprint is implemented:
- $route expansion with `/g` flag for all instances
- repo root execution via `process.cwd()`
- default pattern prefix with route path
- edge cases handled by code semantics

no gaps found.
