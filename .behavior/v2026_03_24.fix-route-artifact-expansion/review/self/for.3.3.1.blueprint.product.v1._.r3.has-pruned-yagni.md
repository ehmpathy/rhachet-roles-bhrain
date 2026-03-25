# self-review r3: has-pruned-yagni

## reviewed artifacts

- `.behavior/v2026_03_24.fix-route-artifact-expansion/3.3.1.blueprint.product.v1.i1.md`
- `.behavior/v2026_03_24.fix-route-artifact-expansion/0.wish.md` (cross-referenced)

---

## critical observation: blueprint CORRECTS wish's defective fix

on closer inspection of the wish vs blueprint:

| aspect | wish proposed | blueprint implements |
|--------|---------------|---------------------|
| expansion target | `.route` | `input.route` |
| cwd parameter | keep `cwd: input.route` | remove cwd entirely |

**why the wish was wrong:**
1. `.route` is NOT where routes live — routes are at `.behavior/xyz/...`
2. `cwd: input.route` violates rule.forbid.cwd-outside-gitroot (human created this rule)

the blueprint diverges from the wish's proposed fix because the wish's fix was defective. this is NOT YAGNI — this is error correction.

**lesson:** trust the vision and criteria, not necessarily the wish's proposed solution.

---

## component 1: $route expansion via regex

### was this explicitly requested?

**yes.** the wish states: "bhrain does NOT expand `$route` variable in guard `artifacts:` globs." the fix is the direct request.

### is this the minimum viable way?

**yes.** a single `.replace(/\$route/g, input.route)` call. no helper function, no abstraction, no configuration.

compare to alternatives:
- create a `substituteVars` function like reviews/judges have → YAGNI, we only need $route
- support all vars ($stone, $hash, $output) → YAGNI, not requested
- make expansion configurable → YAGNI, not requested

**verdict: no YAGNI. minimum viable implementation.**

---

## component 2: cwd removal

### was this explicitly requested?

**yes.** the human stated "never cwd: input.route, ever" and created rule.forbid.cwd-outside-gitroot.

### is this the minimum viable way?

**yes.** removal of a parameter is the minimum change. no replacement, no abstraction.

**verdict: no YAGNI. this is deletion, not addition.**

---

## component 3: default pattern prefix

### was this explicitly requested?

**implied.** removal of `cwd: input.route` means the default pattern `${stone.name}*.md` would search from repo root instead of route directory. without the prefix, default patterns break.

### is this the minimum viable way?

**yes.** `${input.route}/${input.stone.name}*.md` — direct concatenation, no helper, no abstraction.

alternative considered:
- wrap in a `getDefaultArtifactPattern` function → YAGNI, single use
- make default pattern configurable → YAGNI, not requested

**verdict: no YAGNI. required consequence of cwd removal.**

---

## component 4: test case [case4] — $route in guard artifacts

### was this explicitly requested?

**implied.** the wish mentions the bhuild acceptance test that exercises this. unit test coverage ensures the fix works before integration.

### is this the minimum viable way?

**yes.** one test case that proves the core feature:
- setup: stone with guard that has `$route` in artifact pattern
- action: call getAllStoneArtifacts
- assertion: file is found

no additional complexity:
- no parameterized test → single case sufficient
- no mock filesystem → real temp dir
- no exhaustive edge cases → core behavior only

**verdict: no YAGNI. minimum coverage for core fix.**

---

## component 5: test case [case5] — default pattern includes route prefix

### was this explicitly requested?

**implied.** the blueprint shows two code paths: custom patterns and default patterns. both need coverage.

### is this the minimum viable way?

**yes.** one test case for the default path:
- setup: stone without guard artifacts
- action: call getAllStoneArtifacts
- assertion: file at `${route}/${stone.name}*.md` is found

**verdict: no YAGNI. minimum coverage for second code path.**

---

## meta-question: did we add abstraction "for future flexibility"?

**no.** the blueprint uses inline regex, direct string concatenation, and removes a parameter. no new functions, no new types, no configuration options.

---

## meta-question: did we add features "while we're here"?

reviewed what we did NOT add:
- `$stone`, `$hash`, `$output` expansion → not needed, not requested
- `substituteVars` helper function → not needed, only one variable
- configurable default pattern → not needed, convention works
- validation of expansion results → not needed, glob handles non-matches

**verdict: no feature creep.**

---

## meta-question: did we optimize before we knew it was needed?

**no.** the implementation is:
- single regex replace per glob (not cached, not optimized)
- single string concatenation for default (not precomputed)
- no memoization, no cache, no lazy evaluation

**verdict: no premature optimization.**

---

## summary

| component | YAGNI check | verdict |
|-----------|-------------|---------|
| $route expansion | explicitly requested | keep |
| cwd removal | explicitly requested | keep |
| default pattern prefix | required by cwd removal | keep |
| test [case4] | core fix coverage | keep |
| test [case5] | second code path coverage | keep |

no YAGNI found. the blueprint is the minimum viable implementation.

---

## what i learned from this review

### lesson 1: deletion is the opposite of YAGNI

on YAGNI review, i initially focused on additions. but the blueprint includes a deletion (the `cwd: input.route` removal). deletions cannot be YAGNI — they reduce complexity by definition.

**remember for next time:** YAGNI review should focus on additions and new abstractions, not deletions.

### lesson 2: "while we're here" is the YAGNI trap

the temptation was to add `$stone`, `$hash`, `$output` expansion "for consistency with judges." but the wish only asked for `$route`. resist the urge to expand scope.

**remember for next time:** if the wish doesn't mention it, don't add it. file a separate wish if it's valuable.

### lesson 3: minimum viable != minimum possible

the blueprint could be even smaller — no tests, just the code change. but "minimum viable" means "minimum that works correctly and can be verified." tests are part of viability, not extra.

**remember for next time:** minimum viable includes verification. tests are not YAGNI.

### lesson 4: correction is not addition

the blueprint's divergence from the wish looks like "extra work" at first glance:
- wish says expand to `.route`
- blueprint says expand to `input.route`
- wish keeps `cwd: input.route`
- blueprint removes cwd entirely

but this is correction, not addition. corrective changes appear to add complexity but actually fix broken paths. YAGNI asks "did we add features we don't need?" — corrections to defective proposals are features we DO need.

**remember for next time:** distinguish between addition (new scope) and correction (fix broken proposal).

---

## questioned: could we have done less?

### option A: just fix $route expansion, keep cwd

```ts
// hypothetical minimal fix
const expandedGlob = glob.replace(/\$route/g, input.route);
const matches = await enumFilesFromGlob({ glob: expandedGlob, cwd: input.route });
```

**why this fails:** violates rule.forbid.cwd-outside-gitroot. the human explicitly said "never cwd: input.route, ever."

### option B: skip the default pattern fix

```ts
// default still uses relative pattern
: [`${input.stone.name}*.md`]
```

**why this fails:** without cwd, relative patterns search from repo root. a stone named `1.vision` would search for `/1.vision*.md` at repo root instead of `/.behavior/xyz/1.vision*.md`. all unguarded stones break.

### option C: skip tests

**why this fails:** the wish specifically mentions a failed bhuild acceptance test. without unit tests, we have no confidence the fix works before integration.

**verdict:** we could not have done less. each component is required.

---

## false positives: things that LOOK like YAGNI but aren't

### the codepath tree diagram

the blueprint includes a detailed codepath tree:
```
getAllStoneArtifacts
├── [○] input validation — retain (stone, route)
├── [~] glob determination
...
```

**is this YAGNI?** no. the diagram is documentation, not code. it adds zero runtime complexity and helps reviewers understand the change structure.

### the invariants section

the blueprint lists three invariants:
1. cwd must NOT be used
2. globs must be expanded
3. default must include route prefix

**is this YAGNI?** no. invariants are constraints, not features. they reduce what's allowed, not expand it.

### the before/after code blocks

the blueprint shows explicit before and after code.

**is this YAGNI?** no. this is the primary value of a blueprint — the explicit diff. its removal would make the blueprint useless.

