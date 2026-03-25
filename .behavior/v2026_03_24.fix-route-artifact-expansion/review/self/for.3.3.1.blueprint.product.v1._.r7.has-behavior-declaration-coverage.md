# self-review r7: has-behavior-declaration-coverage

## reviewed artifacts

- `.behavior/v2026_03_24.fix-route-artifact-expansion/1.vision.md`
- `.behavior/v2026_03_24.fix-route-artifact-expansion/2.1.criteria.blackbox.md`
- `.behavior/v2026_03_24.fix-route-artifact-expansion/3.3.1.blueprint.product.v1.i1.md`

---

## the question

does the blueprint cover every requirement from the vision and criteria?

---

## vision requirements check

### requirement 1: expand $route to input.route

**vision says:** "expand `$route` to `input.route` (the actual route path)"

**blueprint addresses:** line 65 — `.replace(/\$route/g, input.route)`

**verdict: covered**

---

### requirement 2: run glob from repo root

**vision says:** "remove `cwd: input.route` — glob runs from repo root"

**blueprint addresses:** line 66 — `enumFilesFromGlob({ glob: expandedGlob })` with no cwd parameter

**verdict: covered**

---

### requirement 3: prefix default pattern with route path

**vision says:** "prefix default pattern with route path (when no guard artifacts specified)"

**blueprint addresses:** line 62 — `${input.route}/${input.stone.name}*.md`

**verdict: covered**

---

### hard requirement: never cwd outside gitroot

**vision says:** "never use `cwd: input.route` — globs must run from repo root with expanded paths"

**blueprint addresses:** invariant #1 — "cwd parameter must NOT be used with enumFilesFromGlob in this function"

**verdict: covered**

---

## vision edge cases check

| edge case | vision says | blueprint handles |
|-----------|-------------|-------------------|
| no guard artifacts | default pattern `${input.route}/${stone.name}*.md` | lines 60-62: ternary with default |
| no $route in pattern | "pattern used as-is, relative to repo root" | .replace is no-op when pattern lacks $route |
| $route multiple times | "all instances expanded" | `/g` global flag in regex |
| pattern has no matches | "returns empty array" | standard enumFilesFromGlob behavior |

**verdict: all edge cases covered**

---

## criteria usecase.1 check

| criterion | blueprint coverage |
|-----------|-------------------|
| $route expanded to actual route path | line 65: `.replace(/\$route/g, input.route)` |
| glob runs from repo root | line 66: no cwd parameter |
| guard proceeds with found artifacts | return value unchanged, artifacts returned |
| all $route instances expanded | `/g` global flag |
| pattern without $route used as-is | .replace is passthrough when no match |
| no matches returns empty array | enumFilesFromGlob standard behavior |

**verdict: all usecase.1 criteria covered**

---

## criteria usecase.2 check

| criterion | blueprint coverage |
|-----------|-------------------|
| default pattern includes route path prefix | line 62: `${input.route}/${input.stone.name}*.md` |
| glob runs from repo root | line 66: no cwd parameter |

**verdict: all usecase.2 criteria covered**

---

## criteria usecase.3 check

| criterion | blueprint coverage |
|-----------|-------------------|
| same expansion value as reviews | reviews use `vars.route`, blueprint uses `input.route` — same value |
| same expansion value as judges | judges use `vars.route`, blueprint uses `input.route` — same value |

**verified in r5:** reviews at `runStoneGuardReviews.ts:212` and judges at `runStoneGuardJudges.ts:298` both use `.replace(/\$route/g, vars.route)`. the blueprint matches this pattern.

**verdict: consistency criteria covered**

---

## test coverage check

| vision/criteria requirement | test case |
|----------------------------|-----------|
| $route expansion | [case4] $route in guard artifacts |
| default pattern with route prefix | [case5] no guard artifacts (default) |
| multiple $route instances | covered by [case4] via `/g` flag |
| no $route in pattern | implicit — .replace passes through unchanged |
| no matches | standard enumFilesFromGlob behavior |

**verdict: test coverage sufficient**

---

## summary

| requirement source | total | covered | gaps |
|-------------------|-------|---------|------|
| vision core requirements | 4 | 4 | 0 |
| vision edge cases | 4 | 4 | 0 |
| criteria usecase.1 | 6 | 6 | 0 |
| criteria usecase.2 | 2 | 2 | 0 |
| criteria usecase.3 | 2 | 2 | 0 |

**conclusion:** the blueprint covers 100% of vision and criteria requirements. no gaps found.

---

## what i learned from this review

### lesson 1: vision edge cases match criteria

the vision's edge cases (no guard artifacts, no $route, multiple $route, no matches) map directly to criteria usecase.1 scenarios. cross-check of both documents confirms no requirements were missed.

**remember for next time:** check edge cases in vision against criteria scenarios for completeness.

### lesson 2: implicit coverage is valid

some scenarios don't need explicit tests because they're covered by mechanism behavior:
- no $route in pattern → .replace passes through unchanged (no test needed)
- no matches → enumFilesFromGlob returns empty array (standard behavior)

**remember for next time:** distinguish between scenarios that need explicit tests and those covered by mechanism behavior.

### lesson 3: invariants are requirements too

invariant #1 ("cwd must NOT be used") is the enforcement of the vision's hard requirement. invariants serve as the blueprint's commitment to requirements.

**remember for next time:** check that hard requirements appear as invariants.
