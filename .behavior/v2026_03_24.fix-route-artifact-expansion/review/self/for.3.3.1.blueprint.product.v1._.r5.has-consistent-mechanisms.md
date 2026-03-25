# self-review r5: has-consistent-mechanisms

## reviewed artifacts

- `.behavior/v2026_03_24.fix-route-artifact-expansion/3.3.1.blueprint.product.v1.i1.md`
- `.behavior/v2026_03_24.fix-route-artifact-expansion/3.1.3.research.internal.product.code.prod._.v1.i1.md`

---

## the question

did we duplicate extant mechanisms instead of reuse?

---

## search for related mechanisms

### found: substituteVars in reviews and judges

location: `src/domain.operations/route/guard/runStoneGuardReviews.ts:206`
location: `src/domain.operations/route/judges/runStoneGuardJudges.ts:292`

```ts
const substituteVars = (
  cmd: string,
  vars: { stone: string; route: string; hash: string; output: string },
): string => {
  return cmd
    .replace(/\$stone/g, vars.stone)
    .replace(/\$route/g, vars.route)
    .replace(/\$hash/g, vars.hash)
    .replace(/\$output/g, vars.output);
};
```

### found: enumFilesFromGlob utility

location: used in `getAllStoneArtifacts.ts:21`

**status:** already reused in the blueprint. no change.

---

## analysis: should we use substituteVars?

### comparison

| aspect | substituteVars | inline .replace |
|--------|---------------|-----------------|
| variables | $stone, $route, $hash, $output | $route only |
| scope | command strings (shell commands) | glob patterns |
| context | reviews/judges execution | artifact enumeration |
| required params | stone, route, hash, output | route only |

### why NOT to use substituteVars

1. **scope mismatch**: substituteVars is for shell commands, not globs. guards run commands like `bash -c 'if [ -f "$route/.marker" ]...'`. artifact patterns are globs like `$route/*.md`.

2. **param mismatch**: substituteVars requires ALL four params (stone, route, hash, output). artifact enumeration only has route — no hash or output available at that point in the codepath.

3. **location**: substituteVars is a private function in two files. there's no shared utility. to reuse it would mean either:
   - duplicate a third copy (worse)
   - extract to shared (scope creep — not requested)

4. **simplicity**: one `.replace(/\$route/g, input.route)` call is simpler than imports, type definitions, and function calls for a single variable.

**verdict: do NOT use substituteVars. the scopes are different.**

---

## is the blueprint a duplicate?

### the blueprint adds:

```ts
const expandedGlob = glob.replace(/\$route/g, input.route);
```

### this is NOT duplication because:

1. **different context**: substituteVars expands commands, not globs
2. **different scope**: we only need $route, not all four variables
3. **different location**: getAllStoneArtifacts is separate from reviews/judges
4. **no shared utility exists**: substituteVars is duplicated between reviews and judges already — a third copy for artifacts would increase duplication, not reduce it

**verdict: inline replacement is appropriate here.**

---

## meta-question: should we extract a shared expandRoute utility?

### the case for extraction

three places now expand $route:
1. `runStoneGuardReviews.ts` via substituteVars
2. `runStoneGuardJudges.ts` via substituteVars
3. `getAllStoneArtifacts.ts` via inline (new)

### the case against extraction

1. **not requested**: the wish asks for a bug fix, not a refactor
2. **different contexts**: reviews/judges expand 4 vars; artifacts expand 1
3. **rule of three**: yes, 3 places now expand $route. but all three have different signatures and contexts. shared extraction would be a leaky abstraction
4. **YAGNI**: we already pruned unnecessary complexity. extraction would add it back

**verdict: do NOT extract. flag as future refactor opportunity if desired.**

---

## summary

| mechanism | extant? | reused? | rationale |
|-----------|---------|---------|-----------|
| substituteVars | yes (2 places) | no | different scope, different params |
| enumFilesFromGlob | yes | yes | already used |
| inline .replace | no | n/a | new, appropriate for single-var case |

**conclusion:** the blueprint does not duplicate extant mechanisms. it uses inline replacement because the extant substituteVars has a different scope and param signature.

---

## what i learned from this review

### lesson 1: same pattern != same mechanism

`.replace(/\$route/g, ...)` appears in three places. but the MECHANISM differs:
- substituteVars: expand 4 vars in commands
- inline: expand 1 var in globs

same pattern, different mechanisms. extraction would create a false abstraction.

**remember for next time:** examine the MECHANISM, not just the pattern.

### lesson 2: duplication has a threshold

three occurrences triggers "rule of three" for potential extraction. but:
- if contexts differ significantly
- if signatures would be awkward
- if extraction wasn't requested

...then duplication is acceptable. the threshold is not mechanical.

**remember for next time:** rule of three is a signal, not a mandate.

### lesson 3: prior duplication is not license for more

substituteVars already exists in TWO places (reviews and judges). this is prior duplication. the blueprint could argue "one more copy is fine" — but that's wrong. better to:
- keep the scope narrow (inline for artifacts)
- flag extraction as future work if it becomes painful

**remember for next time:** prior duplication doesn't justify more duplication.

