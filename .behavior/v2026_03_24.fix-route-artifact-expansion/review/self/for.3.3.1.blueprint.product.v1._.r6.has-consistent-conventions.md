# self-review r5: has-consistent-conventions

## reviewed artifacts

- `.behavior/v2026_03_24.fix-route-artifact-expansion/3.3.1.blueprint.product.v1.i1.md`

---

## the question

does the blueprint diverge from extant name conventions and patterns?

---

## search for relevant conventions

### convention 1: variable expansion pattern

**extant pattern in reviews (line 212):**
```ts
.replace(/\$route/g, vars.route)
```

**extant pattern in judges (line 298):**
```ts
.replace(/\$route/g, vars.route)
```

**blueprint pattern:**
```ts
.replace(/\$route/g, input.route)
```

**assessment:** the regex pattern is identical (`/\$route/g`). the replacement value differs (`vars.route` vs `input.route`) but this reflects the context — reviews/judges use a `vars` object, getAllStoneArtifacts uses `input`. this is consistent with how each file accesses its parameters.

**verdict: consistent.**

---

### convention 2: variable name choice

**extant pattern for variable name:**
```ts
const expandedGlob = glob.replace(...);
```

**search for similar patterns:**
- `expandedCmd` — not found in codebase
- `expandedPath` — not found in codebase
- `expanded*` — no precedent

**alternative patterns in codebase:**
- reviews/judges apply substitution directly in function call, no intermediate variable

**assessment:** the blueprint introduces `expandedGlob` as an intermediate variable. this is a new name. however:
1. the name follows `expanded{Type}` pattern which is intuitive
2. reviews/judges don't need the intermediate because they pass directly to exec
3. artifacts need the intermediate because the loop iterates

**verdict: consistent — new name is justified by context difference.**

---

### convention 3: function signature

**extant pattern in getAllStoneArtifacts:**
```ts
export const getAllStoneArtifacts = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<string[]>
```

**blueprint changes:** none to the signature. the function keeps the same name, same params, same return type.

**verdict: consistent.**

---

### convention 4: enumFilesFromGlob usage

**extant pattern (before fix):**
```ts
const matches = await enumFilesFromGlob({ glob, cwd: input.route });
```

**blueprint pattern (after fix):**
```ts
const matches = await enumFilesFromGlob({ glob: expandedGlob });
```

**search for other enumFilesFromGlob usages:**

```ts
// found in src/domain.operations/route/stones/getAllStoneArtifacts.ts
enumFilesFromGlob({ glob, cwd: input.route })

// found in src/utils/filesystem/enumFilesFromGlob.ts (the utility itself)
// accepts { glob, cwd? }
```

**assessment:** the blueprint removes the `cwd` parameter. this aligns with rule.forbid.cwd-outside-gitroot. the pattern left (`{ glob: expandedGlob }`) is valid per the utility signature.

**verdict: consistent — removal is intentional and correct.**

---

### convention 5: default pattern structure

**extant pattern:**
```ts
[`${input.stone.name}*.md`]
```

**blueprint pattern:**
```ts
[`${input.route}/${input.stone.name}*.md`]
```

**assessment:** the blueprint prepends `${input.route}/` to the pattern. this changes the semantics (now searches from repo root) but follows the same template string pattern. no new conventions introduced.

**verdict: consistent.**

---

## summary

| convention | extant pattern | blueprint pattern | verdict |
|------------|---------------|-------------------|---------|
| regex pattern | `/\$route/g` | `/\$route/g` | identical |
| replacement value | `vars.route` | `input.route` | consistent (context differs) |
| intermediate variable | none | `expandedGlob` | justified by context |
| function signature | unchanged | unchanged | identical |
| enumFilesFromGlob call | `{ glob, cwd }` | `{ glob }` | consistent (cwd removed per rule) |
| default pattern | template string | template string | identical style |

**conclusion:** the blueprint follows extant conventions. no divergence found.

---

## what i learned from this review

### lesson 1: context justifies variation

`vars.route` vs `input.route` looks like inconsistency at first. but:
- reviews/judges build a `vars` object to pass multiple values
- artifacts only need `route`, accessed directly from `input`

same pattern, different access path. not divergence.

**remember for next time:** examine WHY names differ before a flag as inconsistent.

### lesson 2: absence of precedent != divergence

`expandedGlob` has no precedent in the codebase. but:
- the pattern `expanded{Type}` is intuitive english
- reviews/judges don't need intermediates (direct pass to exec)
- artifacts need intermediate (loop iteration)

no precedent doesn't mean wrong. it means first use of a reasonable pattern.

**remember for next time:** new patterns are acceptable when context differs from extant code.

### lesson 3: removal can be convention-aligned

the `cwd` removal looks like a significant change. but:
- rule.forbid.cwd-outside-gitroot mandates this
- the utility signature makes `cwd` optional
- other code doesn't use `cwd` inappropriately

removal aligns with convention (the rule). it's not divergence.

**remember for next time:** rules ARE conventions. align with rules, not prior violations.

