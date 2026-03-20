# self-review r3: has-pruned-backcompat

## pause

i am the reviewer, not the author.

i re-read the blueprint and questioned whether backwards compatibility concerns were explicitly requested or assumed "to be safe".

---

## re-read the wish

> looks like the route.mutate guard is overzelous
> writes to @reporoot/.route/xyz should be permitted if the bound route is @reporoot/.route/xyz
> but @reporoot/.route/xyz/.route should be blocked
> also, lets add the requirement that the blocker explanation files should go into $route/blocker, not $route/.route/blocker

the wish asks for:
1. allow writes to routes at `.route/` location
2. block writes to `.route/` metadata subdirectory
3. move blocker files to `$route/blocker/`

**notably absent**: any mention of `.behavior/` routes or backwards compatibility.

---

## the backwards compat concern

**the invariant in the blueprint**:
> routes at `.behavior/` continue to work identically (backwards compatible)

**was this explicitly requested?** no. the wish only mentions `.route/` routes.

**did we assume it "to be safe"?** yes.

---

## analysis: is this assumption valid?

### why we assumed it

routes at `.behavior/` are the extant pattern. the declapract.upgrade skill creates routes at `.route/`, but most routes are at `.behavior/`. if we broke them, we'd break extant workflows.

### evidence that backwards compat is needed

1. this very behavior is at `.behavior/v2026_03_19.fix-route-mutate-guard/`
2. extant tests use `.behavior/` routes
3. declapract.upgrade is the only skill that creates routes at `.route/`

### is backwards compat guaranteed by the implementation?

**before**: guard blocks paths that contain `\.route/`
**after**: guard blocks paths that match `^$ROUTE_DIR/\.route/`

for a `.behavior/` route:
- ROUTE_DIR = `.behavior/xyz`
- guard blocks `^.behavior/xyz/\.route/`
- this is exactly what was blocked before (plus a prefix constraint that narrows it)

**the fix is backwards compatible by construction** — the new pattern is more specific, not broader. it can only allow more paths, never block new paths.

### could the wisher have wanted to break backwards compat?

no. the wish says the guard is "overzealous" (blocks too much). the fix makes it less zealous for `.route/` routes. why would that break `.behavior/` routes?

---

## decision: is the invariant YAGNI?

**option 1**: flag as open question for wisher
- "should we preserve backwards compat for .behavior/ routes?"
- seems unnecessary — the answer is obviously yes

**option 2**: accept as required
- backwards compat is so obviously required that it doesn't need wisher confirmation
- the fix is backwards compatible by construction anyway

**decision**: option 2. the invariant is not YAGNI — it's a sanity check that the fix doesn't regress extant behavior. it's not "extra work" for backwards compat; it's verifiable by the implementation.

---

## are there other backwards compat concerns?

| concern | explicitly requested? | analysis |
|---------|----------------------|----------|
| .behavior/ routes work | no | required by construction |
| privilege bypass works | no | not touched by fix |
| no-bound-route allows all | no | not touched by fix |
| stone/guard protection | no | not touched by fix |

**all these hold because the fix only changes one aspect**: the pattern from `\.route/` to `^$ROUTE_DIR/\.route/`. all else is unchanged.

---

## issues found

### none

the backwards compat concern in the blueprint (routes at .behavior/ continue to work) is:
1. not explicitly requested, BUT
2. required by sanity (to break extant routes would be unacceptable)
3. guaranteed by the implementation (the fix narrows protection, doesn't broaden it)

this is not YAGNI — it's a verification that the fix doesn't regress.

---

## conclusion

the blueprint's backwards compat concern is valid:
- the wish asks to fix routes at `.route/`
- the fix must not break routes at `.behavior/`
- the implementation guarantees this by construction
- the invariant is a verification, not extra work

no open questions for the wisher. backwards compat is self-evidently required.

