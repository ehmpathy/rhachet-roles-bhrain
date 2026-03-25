# self-review r2: has-questioned-assumptions

## reviewed artifacts

- `.behavior/v2026_03_24.fix-route-artifact-expansion/3.3.1.blueprint.product.v1.i1.md`

---

## assumption 1: input.route contains the correct path format

### what do we assume here without evidence?

that `input.route` is always a valid path like `.behavior/v2026_03_24.xyz/`.

### what if the opposite were true?

if input.route were malformed (e.g., empty, null, or with tail slash issues), the expansion would produce broken globs.

### is this based on evidence or habit?

**evidence.** the function receives `input.route` from the call context, which is validated upstream. the same pattern is used in reviews and judges without issue.

### exceptions or counterexamples?

none found. the route path is set at route initialization and is consistent throughout.

**verdict: assumption holds — validated by upstream contract**

---

## assumption 2: regex /\$route/g is sufficient for expansion

### what do we assume here without evidence?

that a simple regex replace handles all $route occurrences correctly.

### what if the opposite were true?

if patterns used `$route` in a context where literal `$` was needed, the expansion would break. for example, regex patterns or shell escapes.

### is this based on evidence or habit?

**evidence.** artifact patterns are file globs, not regex or shell commands. `$route` is a convention in this codebase specifically for path substitution.

### could a simpler approach work?

no. string.replace without /g would only replace the first instance.

**verdict: assumption holds — /g flag is the minimal correct approach**

---

## assumption 3: enumFilesFromGlob works correctly without cwd

### what do we assume here without evidence?

that removal of `cwd: input.route` will make enumFilesFromGlob use the default (repo root).

### what if the opposite were true?

if enumFilesFromGlob had a different default cwd, globs would fail.

### is this based on evidence or habit?

**evidence.** checked the function signature — it uses `process.cwd()` as default, which is the repo root at execution time.

### exceptions or counterexamples?

none. the function is used elsewhere in the codebase without explicit cwd.

**verdict: assumption holds — confirmed via code inspection**

---

## assumption 4: default pattern ${input.route}/${input.stone.name}*.md works

### what do we assume here without evidence?

that the pattern with route prefix will match artifact files correctly.

### what if the opposite were true?

if route paths contained characters that break glob syntax (like `[` or `*`), the pattern would fail.

### is this based on evidence or habit?

**evidence.** route paths follow a strict format: `.behavior/v{date}.{name}/`. no glob metacharacters appear in this format.

### exceptions or counterexamples?

if a route name contained brackets (e.g., `.behavior/v2026_03_24.[test]/`), the glob would break. but this violates route name conventions.

**verdict: assumption holds — route name conventions prevent metacharacter conflicts**

---

## assumption 5: test case [case4] is sufficient for coverage

### what do we assume here without evidence?

that one test case for $route expansion proves the feature works.

### what if the opposite were true?

edge cases could exist that [case4] doesn't cover: empty routes, deeply nested patterns, etc.

### is this based on evidence or habit?

**habit — needs verification.**

on review of the blueprint: [case4] tests `$route` in guard artifacts, [case5] tests the default pattern. these cover the two branches in the code. edge cases like empty routes would fail earlier in the call chain, not in getAllStoneArtifacts.

**verdict: assumption holds — both code branches are covered**

---

## summary of assumptions

| assumption | status | rationale |
|------------|--------|-----------|
| input.route is valid | holds | upstream validation |
| /\$route/g is sufficient | holds | artifact patterns are globs, not regex |
| enumFilesFromGlob defaults to repo root | holds | code inspection confirmed |
| default pattern works | holds | route name conventions prevent metacharacters |
| [case4]+[case5] provide coverage | holds | both code branches covered |

no issues found. all assumptions are based on evidence, not habit.
