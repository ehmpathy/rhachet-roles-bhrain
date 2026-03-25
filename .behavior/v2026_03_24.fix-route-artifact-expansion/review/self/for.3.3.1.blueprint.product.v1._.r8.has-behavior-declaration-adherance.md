# self-review r8: has-behavior-declaration-adherance

## reviewed artifacts

- `.behavior/v2026_03_24.fix-route-artifact-expansion/1.vision.md`
- `.behavior/v2026_03_24.fix-route-artifact-expansion/2.1.criteria.blackbox.md`
- `.behavior/v2026_03_24.fix-route-artifact-expansion/3.3.1.blueprint.product.v1.i1.md`

---

## the question

does the blueprint correctly interpret the vision and criteria? no deviations, no misinterpretations?

---

## vision adherence check

### vision says: expand $route to actual route path

**interpretation in blueprint:**
```ts
const expandedGlob = glob.replace(/\$route/g, input.route);
```

**adherence check:**
- vision says expand to "actual route path (e.g., `.behavior/v2026_03_24.xyz/`)"
- blueprint uses `input.route` which is the actual route path passed in
- `input.route` matches `vars.route` in reviews/judges

**verdict: correct interpretation. no deviation.**

---

### vision says: run glob from repo root (no cwd)

**interpretation in blueprint:**
```ts
const matches = await enumFilesFromGlob({ glob: expandedGlob });
```

**adherence check:**
- vision says "no `cwd` override"
- blueprint removes `cwd: input.route` entirely
- enumFilesFromGlob runs from process.cwd() (repo root) by default

**verdict: correct interpretation. no deviation.**

---

### vision says: prefix default pattern with route path

**interpretation in blueprint:**
```ts
: [`${input.route}/${input.stone.name}*.md`];
```

**adherence check:**
- vision says "default pattern `${input.route}/${stone.name}*.md`"
- blueprint uses exactly this pattern
- when no guard artifacts specified, this ensures files are found at route directory

**verdict: correct interpretation. no deviation.**

---

### vision hard requirement: never cwd: input.route

**interpretation in blueprint:** invariant #1 states "cwd parameter must NOT be used with enumFilesFromGlob in this function"

**adherence check:**
- vision says "never use `cwd: input.route`"
- blueprint codifies this as an invariant
- code change removes cwd parameter entirely

**verdict: correct interpretation. no deviation.**

---

## criteria adherence check

### usecase.1: $route expansion

| criterion | blueprint interpretation |
|-----------|-------------------------|
| "bhrain expands $route to actual route path" | `.replace(/\$route/g, input.route)` — correct |
| "glob runs from repo root" | no cwd parameter — correct |
| "all $route instances are expanded" | `/g` global flag — correct |
| "pattern without $route used as-is" | .replace passthrough — correct |

**verdict: all usecase.1 criteria correctly interpreted.**

---

### usecase.2: default pattern

| criterion | blueprint interpretation |
|-----------|-------------------------|
| "default pattern includes route path prefix" | `${input.route}/${input.stone.name}*.md` — correct |
| "glob runs from repo root" | no cwd parameter — correct |

**verdict: all usecase.2 criteria correctly interpreted.**

---

### usecase.3: consistency

| criterion | blueprint interpretation |
|-----------|-------------------------|
| "same expansion value as reviews" | uses `input.route` which equals `vars.route` — correct |
| "same expansion value as judges" | uses `input.route` which equals `vars.route` — correct |

**verdict: all usecase.3 criteria correctly interpreted.**

---

## deviation scan

### potential deviation 1: regex pattern

**vision says:** (no specific regex mentioned)
**blueprint uses:** `/\$route/g`

**check:** reviews use `/\$route/g` and judges use `/\$route/g`. blueprint matches.

**verdict: no deviation.**

---

### potential deviation 2: expansion target

**vision says:** "expand to actual route path (e.g., `.behavior/v2026_03_24.xyz/`)"
**blueprint uses:** `input.route`

**check:** `input.route` IS the actual route path like `.behavior/v2026_03_24.xyz/`. not `.route` (which is different).

**verdict: no deviation. correct target.**

---

### potential deviation 3: default pattern structure

**vision says:** `${input.route}/${stone.name}*.md`
**blueprint uses:** `${input.route}/${input.stone.name}*.md`

**check:** `input.stone.name` accesses the stone name from the input object. this is correct scoped access.

**verdict: no deviation. correct implementation.**

---

## summary

| aspect | adherence status |
|--------|-----------------|
| $route expansion | correct |
| cwd removal | correct |
| default pattern | correct |
| regex pattern | matches reviews/judges |
| expansion target | correct (input.route, not .route) |
| invariants | correctly codify hard requirements |

**conclusion:** the blueprint correctly interprets all vision and criteria requirements. no deviations or misinterpretations found.

---

## what i learned from this review

### lesson 1: adherence vs coverage are complementary

coverage asks: "did we address all items?"
adherence asks: "did we address them correctly?"

the previous review (r7) confirmed coverage. this review confirms correct interpretation.

**remember for next time:** both checks are needed — coverage without adherence catches gaps but not errors.

### lesson 2: watch the expansion target

the wish originally suggested `.route` but the vision corrected to `input.route`. the blueprint adheres to the vision, not the wish.

**remember for next time:** the vision is the source of truth, not the wish. check adherence against vision.

### lesson 3: invariants enforce hard requirements

the blueprint's invariant #1 is the enforcement mechanism for the vision's hard requirement ("never cwd: input.route"). invariants are how blueprints commit to non-negotiable constraints.

**remember for next time:** check that hard requirements become invariants in the blueprint.
