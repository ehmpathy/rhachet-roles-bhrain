# self-review r2: has-questioned-assumptions

## reviewed artifacts

- `.behavior/v2026_03_24.fix-route-artifact-expansion/1.vision.md` (updated)
- `src/domain.operations/route/stones/getAllStoneArtifacts.ts`
- grep results for `guard?.artifacts` and `.artifacts`

---

## assumption 1: `input.route` is the correct expansion value

### what do we assume here without evidence?

that `input.route` contains the same value as `vars.route` in reviews/judges.

### what evidence supports this?

- human explicitly said routes live at `.behavior/xyz/...`
- `vars.route` in reviews/judges comes from the same source path
- the wish's `.route` suggestion was confirmed wrong

### what if the opposite were true?

if `input.route` differed, we'd have path inconsistency. but they're derived from the same route initialization.

### did the wisher say this?

no — the wisher said `.route` which was incorrect. this was inferred from human feedback.

**verdict: assumption VALID — human feedback confirmed the correct value**

---

## assumption 2: `getAllStoneArtifacts` is the only place that needs this fix

### what do we assume here without evidence?

that no other code path enumerates artifact files via glob without `$route` expansion.

### what evidence supports this?

**verified via grep:**

```
grep -r "guard?.artifacts|\.artifacts" src/domain.operations/route/
```

results:
- `getAllStoneArtifacts.ts:14-15` — reads `guard.artifacts` and runs glob ← **the issue**
- `setStoneAsPassed.ts:522` — reads globs for cache metadata (not for enumeration)
- `parseStoneGuard.ts:30,104,148` — parses guard file into object
- `stepRouteReview.ts` — receives artifacts as input (already enumerated)
- `computeNextStones.ts` — receives artifacts as input (already enumerated)
- test files — assertions on results

**only `getAllStoneArtifacts` performs the glob enumeration.**

### what if the opposite were true?

if other places also ran globs, they'd need the same fix. but the architecture routes all artifact enumeration through `getAllStoneArtifacts`.

**verdict: assumption VALIDATED via code inspection**

---

## assumption 3: `cwd: input.route` removal won't break other patterns

### what do we assume here without evidence?

that all artifact patterns will work when expanded from repo root.

### r1 result

the default pattern `${input.stone.name}*.md` would break — it needs route prefix.

### how was it fixed?

updated vision to include the third change:
> 3. prefix default pattern with route path (when no guard artifacts specified)

and added edge case to table:
> | no guard artifacts specified | default pattern `${input.route}/${stone.name}*.md` |

**verdict: assumption was INVALID in r1 — fixed in vision before r2**

---

## assumption 4: the vision captures all edge cases

### what do we assume here without evidence?

that the edge cases are complete after the r1 fix.

### what evidence supports this?

the edge cases now cover:
1. no guard artifacts → default pattern with route prefix
2. no `$route` in custom pattern → used as-is from repo root
3. `$route` appears multiple times → all expanded
4. no matches → empty array

### what exceptions might exist?

- **relative patterns without `$route`**: e.g., `*.md` would match from repo root, not route dir
  - this is correct behavior — if user wants route-relative, they should use `$route/*.md`
- **absolute paths**: not supported, but also not a real use case
- **patterns with `..`**: could escape route dir, but this is user responsibility

### did the wisher say this?

no — edge cases were inferred. but they're complete for the stated contract.

**verdict: assumption VALID — edge cases are complete for the contract**

---

## summary

| assumption | r1 status | r2 status | notes |
|------------|-----------|-----------|-------|
| `input.route` is correct | needs verification | **valid** | human confirmed |
| only `getAllStoneArtifacts` needs fix | needs verification | **valid** | grep verified |
| `cwd` removal won't break | invalid | **fixed** | vision updated |
| edge cases complete | partially invalid | **valid** | vision updated |

---

## what holds in the updated vision?

all assumptions are now validated or fixed. the vision correctly states:
1. expand `$route` to `input.route`
2. remove `cwd: input.route`
3. prefix default pattern with route path

ready to proceed.
