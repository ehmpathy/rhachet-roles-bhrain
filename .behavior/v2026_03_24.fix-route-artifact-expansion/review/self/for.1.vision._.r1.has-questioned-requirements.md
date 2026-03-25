# self-review: has-questioned-requirements

## reviewed artifacts

- `.behavior/v2026_03_24.fix-route-artifact-expansion/0.wish.md`
- `.behavior/v2026_03_24.fix-route-artifact-expansion/1.vision.md`
- `src/domain.operations/route/stones/getAllStoneArtifacts.ts`
- `src/domain.operations/route/guard/runStoneGuardReviews.ts:212`
- `src/domain.operations/route/judges/runStoneGuardJudges.ts:298`

---

## requirement 1: expand `$route` in artifact globs

### who said this was needed? when? why?

the bhuild acceptance test surfaced this. the wish documented the symptom: guards with `$route` artifact patterns fail because the variable is not expanded.

### what evidence supports this requirement?

**code evidence:**
- `runStoneGuardReviews.ts:212` expands via `.replace(/\$route/g, vars.route)` ✓
- `runStoneGuardJudges.ts:298` expands via `.replace(/\$route/g, vars.route)` ✓
- `getAllStoneArtifacts.ts` does NOT expand — **inconsistent**

**user expectation:**
behavers write `$route/artifact.md` and expect it to work everywhere. it works in reviews. it works in judges. it should work in artifact globs. consistency is the contract.

### what if we didn't do this?

- bhuild release stays blocked
- behavers cannot use `$route` in artifact patterns
- workaround would require hardcoded paths, which defeats the purpose of the variable

### is the scope too large, too small, or misdirected?

scope is correct. one function needs the fix: `getAllStoneArtifacts.ts`. the vision correctly identifies this.

### could we achieve the goal in a simpler way?

no. expansion is the only path. the variable must be resolved before glob execution.

**verdict: requirement is VALID. it holds because:**
1. consistency principle — `$route` must behave identically in all contexts
2. user expectation — behavers expect variables to work
3. evidence — two other locations already expand correctly

---

## issue found: vision had incorrect expansion value (from wish)

### the problem

the original wish suggested expanding to `.route`:
```ts
glob.replace(/\$route/g, '.route');
```

### why this was wrong

routes do NOT live at `.route`. they live at `.behavior/xyz/...`. the wish author had an incorrect mental model.

### how it was fixed

the vision now correctly states:
- expand `$route` to `input.route` (the actual route path)
- example: `.behavior/v2026_03_24.fix-route-artifact-expansion/`

this matches how `vars.route` is used in reviews/judges.

---

## issue found: `cwd: input.route` violates hard rule

### the problem

the current code:
```ts
await enumFilesFromGlob({ glob, cwd: input.route });
```

this changes cwd to inside the route directory.

### why this was wrong

**hard rule from human:** we never change cwd outside gitroot, ever.

this is not just about this fix — it's a principle:
- predictable path resolution from single anchor
- avoids composition bugs when functions chain
- prevents accidental file access outside repo

### how it was fixed

the vision now states:
- remove `cwd: input.route`
- glob runs from repo root with expanded paths

added permanent rule: `.agent/repo=.this/role=any/briefs/rule.forbid.cwd-outside-gitroot.md`

---

## what holds in the vision?

### the outcome world section

**holds because:**
- correctly describes the before state (two bugs: no expansion + wrong cwd)
- correctly describes the after state (expansion + repo root)
- "aha moment" is accurate — behavers expect it to just work

### the user experience section

**holds because:**
- timeline is accurate
- contract is correct (input: `$route/pattern`, output: `.behavior/xyz/pattern`)
- usecase reflects real behaver workflow

### the mental model section

**holds because:**
- `$HOME` analogy is apt — expands to known path
- terms table maps user language to our language

### the evaluation section

**holds because:**
- pros are accurate (consistency, no new concepts, fixes bug)
- edge cases are covered
- two-change approach is correct

### the open questions section

**holds because:**
- assumption about `input.route` is validated by code inspection
- hard requirement is documented

---

## summary

| requirement | status | rationale |
|-------------|--------|-----------|
| expand `$route` in artifact globs | **valid** | consistency with reviews/judges; user expectation |
| use `.route` as expansion value | **invalid → fixed** | routes live at `.behavior/xyz/`, not `.route` |
| keep `cwd: input.route` | **invalid → fixed** | violates hard rule: never change cwd outside gitroot |
