# self-review r4: has-pruned-backcompat

## reviewed artifacts

- `.behavior/v2026_03_24.fix-route-artifact-expansion/3.3.1.blueprint.product.v1.i1.md`

---

## the question

did we add backwards compatibility that wasn't explicitly requested?

---

## analysis

### change 1: $route expansion

**what changes:**
- before: `$route` passed literally to glob
- after: `$route` expanded to actual route path

**is this backcompat?** no. this is a bug fix. the old behavior was broken — no one depends on the literal `$route` string.

**evidence:** the wish says "bhrain literally looks for a directory named `$route` instead of the evaluated route." this is a defect, not a feature.

**verdict: not backcompat. no action needed.**

---

### change 2: cwd removal

**what changes:**
- before: `enumFilesFromGlob({ glob, cwd: input.route })`
- after: `enumFilesFromGlob({ glob: expandedGlob })`

**is this backcompat?** no. this is a breaking change to fix a rule violation.

**who could be affected:** callers who rely on relative patterns without `$route`.

**is backcompat needed?** no.
- the rule says "never cwd: input.route, ever"
- any relative pattern that worked before was working by accident
- the fix makes behavior explicit: use `$route` for route-relative paths

**verdict: not backcompat. deliberate breaking change.**

---

### change 3: default pattern prefix

**what changes:**
- before: `${input.stone.name}*.md`
- after: `${input.route}/${input.stone.name}*.md`

**is this backcompat?** no. this maintains current behavior after cwd removal.

**reasoning:** the old pattern searched from `cwd: input.route`. the new pattern prepends `input.route/` to search from repo root. same files are found — the change is transparent.

**verdict: not backcompat. behavior preservation.**

---

## search for hidden backcompat

### did we preserve any legacy behavior "to be safe"?

reviewed the blueprint for phrases like:
- "for backwards compatibility" — not found
- "to maintain extant behavior" — not found
- "legacy support" — not found
- "deprecated" — not found

**verdict: no hidden backcompat found.**

---

### did we add fallbacks "just in case"?

reviewed the code changes for:
- if/else branches for old vs new behavior — none
- feature flags — none
- try/catch to handle old format — none
- default values to preserve old behavior — none

**verdict: no fallbacks added.**

---

### did we keep old patterns alongside new ones?

reviewed for parallel implementations:
- old `cwd` approach kept as alternative — no
- old pattern format supported — no
- dual path execution — no

**verdict: no parallel implementations.**

---

## summary

| potential backcompat | found? | verdict |
|---------------------|--------|---------|
| preserve old $route literal behavior | no | bug fix, not backcompat |
| keep cwd as option | no | rule violation, must remove |
| support both pattern formats | no | single path, explicit |
| legacy fallbacks | no | clean implementation |
| deprecated code paths | no | none present |

**conclusion:** the blueprint contains zero backwards compatibility shims. all changes are forward-only fixes.

---

## what i learned from this review

### lesson 1: bug fixes are not backcompat

when old behavior is clearly wrong (search for literal `$route` directory), the fix is not a backcompat concern. no one depends on broken behavior.

**remember for next time:** distinguish between "behavior change" and "bug fix." fixes don't need backcompat.

### lesson 2: rule violations justify breaking changes

the cwd removal is technically a breaking change for any code that relied on relative patterns. but that code violated rule.forbid.cwd-outside-gitroot. breaking rule-violators is correct.

**remember for next time:** when a rule says "never," breaking non-compliant usages is the right action.

### lesson 3: behavior preservation != backcompat

the default pattern change (`${stone.name}*.md` → `${route}/${stone.name}*.md`) looks like it could be backcompat — preserving where files are found. but this is just correct behavior. the old and new find the same files.

**remember for next time:** to preserve CORRECT behavior is not backcompat. backcompat preserves OLD behavior.

---

## counterexamples: what WOULD be backcompat?

to clarify what we search for, here are examples of backcompat that would be flagged if present:

### hypothetical backcompat 1: dual-mode expansion

```ts
// WRONG: backcompat shim
const expandedGlob = options?.legacyMode
  ? glob  // old: pass $route literally
  : glob.replace(/\$route/g, input.route);  // new: expand
```

**why this is bad:** adds complexity to support broken behavior. no one asked for legacy mode.

### hypothetical backcompat 2: graceful cwd fallback

```ts
// WRONG: backcompat shim
try {
  // try new way first
  const matches = await enumFilesFromGlob({ glob: expandedGlob });
  return matches;
} catch {
  // fall back to old way if new fails
  return await enumFilesFromGlob({ glob, cwd: input.route });
}
```

**why this is bad:** violates rule.forbid.cwd-outside-gitroot in the fallback. also masks errors that should surface.

### hypothetical backcompat 3: deprecated warn instead of removal

```ts
// WRONG: backcompat shim
if (glob.includes('$route')) {
  console.warn('DEPRECATED: $route will be expanded in future versions');
  // but still pass literally for now
}
```

**why this is bad:** the wish says the behavior is a bug, not a feature. deprecation implies the old behavior was intentional.

**verdict:** none of these hypotheticals are present in the blueprint. we made clean breaks without shims.

---

## meta-reflection: why backcompat review matters here

this blueprint fixes a BUG in bhrain. bugs invite two kinds of "fixes":
1. **clean fix** — remove the broken behavior
2. **hedged fix** — add new behavior but keep old "just in case"

hedged fixes tempt us because they feel "safer." but they:
- preserve bugs for anyone who depends on them
- add code paths that must be maintained
- delay the pain of migration without the ability to eliminate it

the blueprint chooses clean fix. no hedge. this review confirms that choice was deliberate, not accidental.

