# self-review: has-pruned-backcompat (r2)

## question

did we add backwards compatibility that was not explicitly requested?

---

## found issue: route prefix logic

### the concern

I had added route prefix logic for custom patterns without `$route`:

```ts
const expandedGlob = hasRouteVar
  ? glob.replace(/\$route/g, input.route)
  : hasCustomArtifacts
    ? `${input.route}/${glob}`  // <-- this prefix was wrong
    : glob;
```

### review of the criteria

the criteria states:
> given('guard with no $route in artifact pattern')
>   then('pattern is used as-is from repo root')
>   sothat('absolute patterns still work')

the prefix logic violated this: `src/config.md` would become `.behavior/feature/src/config.md`.

### the fix

removed the prefix logic. now patterns without `$route` are used as-is:

```ts
const expandedGlob = glob.replace(/\$route/g, input.route);
```

behavior:
- `$route/artifact.md` → `.behavior/feature/artifact.md` (expanded)
- `src/config.md` → `src/config.md` (as-is from repo root)

### verification

all 19 acceptance tests pass after the fix.

### why it holds

the `$route` variable is how users reference files relative to the route. without `$route`, patterns reference files from repo root. this is explicit and clear.
