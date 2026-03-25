# self-review r1: has-questioned-deletables

## reviewed artifacts

- `.behavior/v2026_03_24.fix-route-artifact-expansion/3.3.1.blueprint.product.v1.i1.md`

---

## meta-question: could the entire approach be simpler?

### alternative considered: keep cwd, don't expand $route

what if we kept `cwd: input.route` and just used relative patterns without `$route`?

**why this doesn't work:**
- violates rule.forbid.cwd-outside-gitroot (hard rule)
- the human said "never cwd: input.route, ever"

**verdict: alternative rejected. the current approach is required.**

### alternative considered: always prepend route path, no $route support

what if we removed $route support entirely and always prepended the route path?

**why this doesn't work:**
- breaks guards that use absolute paths (e.g., `src/**/*.ts`)
- inconsistent with reviews/judges which support $route

**verdict: alternative rejected. $route support is needed for consistency.**

---

## component: $route expansion logic

### can this be removed entirely?

no. this is the core fix. without it, `$route` in artifact patterns is passed literally.

### if deleted and had to add it back, would we?

yes. the wish explicitly asks for this expansion.

### did we optimize a component that should not exist?

no. the expansion is a single regex replace — the simplest approach.

**verdict: keep**

---

## component: cwd removal

### can this be removed entirely?

no. `cwd: input.route` violates rule.forbid.cwd-outside-gitroot. removal is mandatory.

### if deleted and had to add it back, would we?

no. the hard rule says never use cwd outside gitroot.

**verdict: keep (this is a deletion itself)**

---

## component: default pattern prefix

### can this be removed entirely?

no. without the route prefix, the default pattern `${stone.name}*.md` would search from repo root, not route directory.

### if deleted and had to add it back, would we?

yes. after cwd removal, the default pattern must include the route path.

**verdict: keep**

---

## component: test case [case4] — $route in guard artifacts

### can this be removed entirely?

no. this proves the core fix works.

### if deleted and had to add it back, would we?

yes. essential coverage.

**verdict: keep**

---

## component: test case [case5] — multiple $route instances

### can this be removed entirely?

**yes.** the regex `/\$route/g` already handles multiple instances by design. a separate test case is redundant.

### if deleted and had to add it back, would we?

no. if [case4] passes with the `/g` flag, multiple instances are covered.

**verdict: DELETE — redundant coverage**

### how it was fixed

removed [case5] from the blueprint test coverage table.

---

## component: test case [case6] — default pattern includes route prefix

### can this be removed entirely?

no. this proves the default pattern fix works for unguarded stones.

### if deleted and had to add it back, would we?

yes. different code path than [case4].

**verdict: keep**

---

## summary of issues found

### issue 1: redundant test case [case5]

**what was wrong:** blueprint included a test case for "multiple $route instances" that provided no additional coverage.

**why it was wrong:** the `/\$route/g` regex already handles all instances. testing multiple instances is testing the regex engine, not our code.

**how it was fixed:** deleted [case5] from the blueprint test coverage table.

### issue 2: redundant invariant #4

**what was wrong:** invariant #4 ("glob execution must occur from repo root") restated invariant #1 ("cwd must not be used").

**why it was wrong:** if cwd is not used, enumFilesFromGlob defaults to process.cwd() which is the repo root. the invariant added no information.

**how it was fixed:** deleted invariant #4 from the blueprint.

---

## summary of non-issues (why they hold)

| component | verdict | why it holds |
|-----------|---------|--------------|
| $route expansion | keep | core fix required by wish; simplest approach (single regex) |
| cwd removal | keep | mandatory per rule.forbid.cwd-outside-gitroot; human confirmed "never ever" |
| default pattern prefix | keep | required consequence of cwd removal; without it, default would search wrong directory |
| test [case4] | keep | essential coverage for core fix; no implicit mechanism covers this |
| test [case5] (now renumbered) | keep | essential coverage for default pattern; different code path than custom patterns |
| code changes section | keep | blueprint's primary value; execution needs precise reference |
| integration coverage note | keep | prevents confusion about missing integration tests |

---

## what i learned from this review

### lesson 1: the /g flag provides implicit coverage

when i first wrote the blueprint, i added [case5] to test multiple `$route` instances. this felt thorough.

but the regex `/\$route/g` has the global flag — it replaces ALL instances by design. a separate test case adds no value because:
1. if the /g flag works, all instances are replaced
2. if the /g flag is missing, [case4] would still pass with one instance

**remember for next time:** before adding test cases, check if the mechanism under test already covers the variation implicitly.

### lesson 2: deletion is the strongest form of simplification

the guide asks "what is the simplest version that works?" — i initially interpreted this as "is the code simple?" but the deeper question is "are there components that shouldn't exist?"

finding [case5] as deletable was the real review work. asking "can this be removed?" forced me to evaluate whether each component earns its place.

**remember for next time:** start by looking for deletions, not optimizations. delete first, then optimize what remains.

### lesson 3: cwd removal is deletion, not just change

i initially framed "remove `cwd: input.route`" as a code change. but this is actually a deletion — we're removing a parameter that shouldn't exist.

this reframing matters: deletions reduce complexity, changes add complexity. the blueprint has two deletions (cwd parameter, [case5] test) and two additions ($route expansion, default prefix). net complexity is roughly neutral.

**remember for next time:** track deletions separately from changes. prefer solutions with more deletions than additions.

---

## questioned blueprint sections

### section: "code changes" with before/after

**can this be removed?**

no. the before/after code blocks are the core of the blueprint — they show exactly what changes.

**why it holds:**
- execution phase needs precise reference
- reviewers can verify logic without reading source
- diffs are small and focused

### section: "invariants"

**can this be removed?**

partially. invariant #4 ("glob execution must occur from repo root") is redundant with invariant #1 ("cwd must not be used").

**how it was fixed:**

removed invariant #4 from the blueprint — it's implied by #1.

### section: "integration coverage" note

**can this be removed?**

no. it explains why we don't add new integration tests (extant tests cover the pattern).

**why it holds:**
- prevents reviewer from asking "where are the integration tests?"
- documents intentional reuse of pattern
