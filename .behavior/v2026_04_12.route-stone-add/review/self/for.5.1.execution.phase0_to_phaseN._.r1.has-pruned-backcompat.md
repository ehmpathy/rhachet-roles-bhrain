# self-review: has-pruned-backcompat

## review question

review for backwards compatibility that was not explicitly requested.

## articulation

### backwards compat concerns reviewed

this is a **new feature** (`route.stone.add`) — there is no prior version to maintain compatibility with.

### changes to extant code

1. **blackbox/.test/invokeRouteSkill.ts** — changed double quotes to single quotes for argument quoting
   - this is a **bug fix**, not a backcompat concern
   - prior behavior was incorrect (bash expanded `$behavior` to empty string)
   - no tests relied on the broken behavior

2. **src/contract/cli/route.ts** — added new `routeStoneAdd` function
   - **additive change** — no modification to extant functions
   - no changes that break extant behavior

3. **src/domain.operations/route/formatRouteStoneEmit.ts** — added `add` action support
   - **additive change** — new enum value, no modification to extant values
   - extant `get`, `set`, `del` actions unchanged

### backcompat code found

none. all changes are either:
- new code (additive)
- bug fixes for incorrect behavior

### verdict

✅ no unnecessary backwards compat code
