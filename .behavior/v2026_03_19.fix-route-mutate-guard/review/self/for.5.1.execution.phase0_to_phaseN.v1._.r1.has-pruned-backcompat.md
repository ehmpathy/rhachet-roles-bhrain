# review.self: has-pruned-backcompat

## what was reviewed

backwards compatibility concerns in the execution:
1. guard logic changes
2. blocker path changes

## backwards compat analysis

### blocker path change: `$route/.route/blocker/` to `$route/blocker/`

this is a **contract break** for any code that reads blockers from the old location.

**was this explicitly requested?**
yes. the wish explicitly states: "blocker explanation files should go into $route/blocker, not $route/.route/blocker"

**is there evidence backwards compat is needed?**
the blueprint notes: "no migration needed; no consumers exist"

**decision:** no backwards compat added, as per wish and blueprint.

### guard logic change: `.route/` to `^$ROUTE_DIR/.route/`

this change makes the guard more permissive (allows writes to route directory itself).

**was this explicitly requested?**
yes. the wish explicitly states routes at `.route/xyz` should be permitted.

**is backwards compat needed?**
no. the change is additive - extant `.behavior/` routes work identically. only routes at `.route/` get new behavior.

## conclusion

no unneeded backwards compatibility was added. the blocker path change is intentionally a clean break (no migration) as per the wish.
