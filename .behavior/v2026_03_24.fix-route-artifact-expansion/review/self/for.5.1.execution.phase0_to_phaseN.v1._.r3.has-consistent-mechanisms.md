# self-review: has-consistent-mechanisms (r3)

## question

did we duplicate extant functionality or deviate from extant patterns?

---

## deep review

### searched for related codepaths

I searched for `$route` expansion in the codebase:

```bash
grep '\$route/g' src/domain.operations/route/
```

**found extant patterns**:

1. `runStoneGuardReviews.ts:212`:
   ```ts
   cmd.replace(/\$route/g, vars.route)
   ```

2. `runStoneGuardJudges.ts:298`:
   ```ts
   cmd.replace(/\$route/g, vars.route)
   ```

### compared with new mechanism

**new mechanism** in `getAllStoneArtifacts.ts:25`:
```ts
const expandedGlob = glob.replace(/\$route/g, input.route);
```

### analysis

| aspect | extant | new | match? |
|--------|--------|-----|--------|
| regex | `/\$route/g` | `/\$route/g` | yes |
| method | `.replace()` | `.replace()` | yes |
| variable | `vars.route` | `input.route` | yes (same semantic) |

the new mechanism follows the exact same pattern. no deviation.

### could we extract a shared utility?

considered: `expandRouteVars(pattern, { route })`.

decided against because:
1. the pattern is one line
2. reviews/judges expand more vars (`$stone`, `$hash`, `$output`)
3. artifacts only need `$route`
4. premature abstraction (rule.prefer.wet-over-dry)

### quote strip mechanism

searched for quote strip patterns. found none. the yaml parser is custom and this is the first time quotes needed removal from list items. no extant pattern to reuse.

---

## conclusion

no duplicated functionality. the `$route` expansion follows extant patterns exactly. the quote strip has no extant equivalent to reuse.
