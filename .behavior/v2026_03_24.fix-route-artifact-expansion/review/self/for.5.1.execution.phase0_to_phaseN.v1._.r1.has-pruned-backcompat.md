# self-review: has-pruned-backcompat

## question

did we add backwards compatibility that was not explicitly requested?

---

## review

### 1. route prefix for custom patterns without $route

**what**: patterns without `$route` get prefixed with `input.route/`

```ts
const expandedGlob = hasRouteVar
  ? glob.replace(/\$route/g, input.route)
  : hasCustomArtifacts
    ? `${input.route}/${glob}`  // <-- this prefix
    : glob;
```

**was it explicitly requested?** no

**is there evidence it's needed?** yes — original code behavior:

```ts
// before
const matches = await enumFilesFromGlob({ glob, cwd: input.route });
// pattern `*.md` looked in route directory
```

```ts
// after (without prefix)
const matches = await enumFilesFromGlob({ glob: expandedGlob, cwd: process.cwd() });
// pattern `*.md` would look in repo root — different behavior!
```

**the concern**: guards in the wild may use patterns like `artifact.md` (no `$route`). these guards expect the pattern to match files in the route directory, not repo root.

**decision**: keep the prefix — it maintains expected behavior

---

### 2. quote strip for yaml values

**what**: `value.replace(/^["'](.*)["']$/, '$1')`

**was it explicitly requested?** no

**is it backwards compat?** yes — yaml quoted strings should parse to unquoted values

**decision**: keep — standard yaml behavior users expect

---

## open question for wisher

the blackbox criteria states:

> given('guard with no $route in artifact pattern')
>   when('behaver runs route')
>     then('pattern is used as-is from repo root')

this contradicts the backwards-compat prefix.

**options**:
1. keep prefix (current) — maintains extant behavior
2. remove prefix — breaks extant guards but matches criteria

**recommendation**: keep prefix. the criteria's "as-is from repo root" intent appears to be for absolute paths, not to change default behavior.
