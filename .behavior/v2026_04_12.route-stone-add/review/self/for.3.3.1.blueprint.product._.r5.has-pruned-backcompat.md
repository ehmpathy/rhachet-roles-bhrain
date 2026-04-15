# self-review r5: has-pruned-backcompat

stone: 3.3.1.blueprint.product
reviewer: mechanic
round: 5
date: 2026-04-12

---

## pause and breathe

i paused. let me scan the blueprint for backwards compatibility that was not explicitly requested.

---

## context

this is a **new feature**: route.stone.add does not exist yet.

backwards compatibility concerns would arise from:
1. compatibility with older routes
2. compatibility with older cli invocations
3. deprecated flag aliases
4. legacy behavior shims

---

## backwards compatibility scan

### scanned for: deprecated aliases

**found:** none

the blueprint uses only the flags prescribed by vision:
- `--stone` (no alias like `--name`)
- `--from` (no alias like `--source`)
- `--route` (no alias like `--path`)
- `--mode` (no alias like `--preview`)

**verdict:** no deprecated aliases added.

---

### scanned for: legacy behavior shims

**found:** none

the blueprint does not include:
- fallback to old behavior
- compatibility layers
- migration utilities
- deprecation warnings

**verdict:** no legacy shims added.

---

### scanned for: unnecessary defaults "to be safe"

**found:** none problematic

the only default is `--mode plan` which is:
1. explicitly stated in vision
2. safer by design (preview before write)
3. consistent with extant route.stone.del

**verdict:** default is mandated, not "to be safe."

---

### scanned for: version-conditional behavior

**found:** none

the blueprint does not include:
- version checks
- feature flags
- migration paths
- conditional codepaths for old vs new

**verdict:** no version-conditional behavior.

---

## the hard question

**did we add any compatibility that was not explicitly requested?**

reviewed each blueprint section:

| section | backcompat concern? | justified? |
|---------|-------------------|------------|
| filediff tree | no | new files |
| codepath tree | no | new functions |
| test coverage | no | tests new feature |
| detailed design | no | new implementations |
| error messages | no | mandated by vision |

**no unjustified backcompat detected.**

---

## what held

this is a greenfield feature. the blueprint adds:
- new skill
- new cli entrypoint
- new domain operations
- new tests

no backwards compatibility layers were added because none were needed. the feature does not modify extant behavior — it only adds new capability.

**verdict: zero unjustified backcompat concerns.**
