# review.self: has-pruned-backcompat (r2)

## what was reviewed

backwards compatibility concerns in the execution, second pass with fresh perspective.

## backwards compat analysis

### blocker path change: `$route/.route/blocker/` to `$route/blocker/`

**is this a contract break?**
yes. any code that reads blockers from the old location would fail.

**was this explicitly requested?**
yes. the wish states: "blocker explanation files should go into $route/blocker, not $route/.route/blocker"

**is there evidence backwards compat is needed?**
the blueprint notes: "no migration needed; no consumers exist"

**did we add migration shims?**
no. clean break as specified.

### guard logic change: `.route/` to `^$ROUTE_DIR/.route/`

**is this a contract break?**
no. the change is additive — allows more writes (to route root), blocks same writes (to .route/ subdir).

**was this explicitly requested?**
yes. the wish states routes at `.route/xyz` should permit writes to the route itself.

**backwards compat needed?**
no. extant `.behavior/` routes work identically. only routes at `.route/` get new (more permissive) behavior.

## conclusion

no unneeded backwards compatibility was added. changes are minimal and match the wish exactly.
