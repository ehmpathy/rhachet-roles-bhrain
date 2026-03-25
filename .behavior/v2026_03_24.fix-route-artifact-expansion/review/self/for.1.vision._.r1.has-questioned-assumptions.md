# self-review: has-questioned-assumptions

## reviewed artifacts

- `.behavior/v2026_03_24.fix-route-artifact-expansion/1.vision.md`
- `src/domain.operations/route/stones/getAllStoneArtifacts.ts`

---

## assumption 1: `input.route` is the correct expansion value

### what do we assume here without evidence?

that `input.route` matches what `vars.route` contains in reviews/judges.

### what evidence supports this?

- `runStoneGuardReviews.ts` and `runStoneGuardJudges.ts` both use `vars.route`
- these vars come from the same route path that `getAllStoneArtifacts` receives
- the human explicitly said routes live at `.behavior/xyz/...`

### what if the opposite were true?

if `input.route` differed from `vars.route`, we'd have inconsistent behavior across contexts. but they're derived from the same source.

### did the wisher say this, or did we infer it?

the wisher said `.route` — which was **wrong**. i inferred the correction based on:
- human feedback ("`.route` is not where routes go")
- code inspection of how `vars.route` is used

**verdict: assumption VALIDATED via human feedback and code inspection**

---

## assumption 2: `getAllStoneArtifacts` is the only place needing this fix

### what do we assume here without evidence?

that no other code paths enumerate artifacts without expanding `$route`.

### what evidence supports this?

- `getAllStoneArtifacts` is the function that enumerates artifacts for guards
- it's called from `runStoneGuardJudges` to check artifact presence
- grep for `guard?.artifacts` shows this is the only consumer

### what if the opposite were true?

if other places also enumerate artifacts, they might also need the fix. let me verify:

```
grep -r "artifacts" src/domain.operations/route/
```

...i should actually check this.

### did the wisher say this, or did we infer it?

the wisher pointed to `getAllStoneArtifacts.ts` specifically. i inferred it's the only place.

**verdict: assumption NEEDS VERIFICATION — should grep for other artifact enumeration**

---

## assumption 3: removing `cwd: input.route` won't break other patterns

### what do we assume here without evidence?

that all artifact patterns work correctly when expanded from repo root.

### what evidence supports this?

- the default pattern is `${input.stone.name}*.md` (e.g., `1.vision*.md`)
- this is relative and would need the route path prepended
- BUT: we're expanding `$route` in the glob, so `$route/1.vision*.md` becomes `.behavior/xyz/1.vision*.md`

### what if the opposite were true?

if a pattern like `1.vision*.md` (without `$route`) is used, it would look in repo root, not route dir.

wait — the default pattern doesn't have `$route`! the current code:
```ts
const globs = input.stone.guard?.artifacts?.length > 0
  ? input.stone.guard.artifacts
  : [`${input.stone.name}*.md`];
```

the default `1.vision*.md` would match from repo root, not from route dir.

**this is an issue!**

### how to fix

the default pattern should include the route path:
```ts
const globs = input.stone.guard?.artifacts?.length > 0
  ? input.stone.guard.artifacts
  : [`${input.route}/${input.stone.name}*.md`];
```

or: the default should be `$route/${input.stone.name}*.md` and get expanded like custom patterns.

**verdict: assumption INVALID — found issue with default pattern**

---

## assumption 4: the vision captures all edge cases

### what do we assume here without evidence?

that the edge cases table in the vision is complete.

### what evidence supports this?

- listed: no `$route`, multiple `$route`, no matches, mixed patterns
- these cover the variable expansion scenarios

### what if the opposite were true?

edge cases we might have missed:
- **default pattern (no guard artifacts)** — covered above, found issue
- **glob patterns with wildcards** — `$route/**/*.md` should work
- **nested routes** — not applicable, routes are flat

### did the wisher say this, or did we infer it?

inferred. the wisher focused on the symptom, not edge cases.

**verdict: assumption PARTIALLY INVALID — default pattern edge case was missed**

---

## issues found

### issue: default pattern won't work after removing `cwd: input.route`

**the problem:**
the default pattern is `${input.stone.name}*.md` (e.g., `1.vision*.md`). without `cwd: input.route`, this matches from repo root, not from the route directory.

**how to fix:**
update vision to include: default pattern must be prefixed with route path.

```ts
const globs = input.stone.guard?.artifacts?.length > 0
  ? input.stone.guard.artifacts.map(g => g.replace(/\$route/g, input.route))
  : [`${input.route}/${input.stone.name}*.md`];
```

---

## summary

| assumption | status | rationale |
|------------|--------|-----------|
| `input.route` is correct expansion value | **valid** | confirmed by human feedback + code inspection |
| only `getAllStoneArtifacts` needs fix | **needs verification** | should grep for other consumers |
| removing `cwd` won't break patterns | **invalid** | default pattern needs route prefix |
| vision captures all edge cases | **partially invalid** | default pattern edge case was missed |
