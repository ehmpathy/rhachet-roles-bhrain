# self-review r4: has-pruned-backcompat

## pause

i am the reviewer, not the author.

r3 concluded that backwards compat is "obviously required" and didn't flag it. but the guide says to flag backwards compat that was not explicitly requested. let me follow the guide more strictly.

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

**absent from wish**: any mention of `.behavior/` routes.

---

## backwards compat concerns in blueprint

### concern 1: routes at .behavior/ continue to work

**explicitly requested?** no.

**evidence needed?**
- this very behavior uses `.behavior/v2026_03_19.fix-route-mutate-guard/`
- extant tests use `.behavior/` routes
- `.behavior/` is the standard route location

**assumed "to be safe"?** yes.

**per the guide**: flag it.

---

## OPEN QUESTION for wisher

### question: should routes at .behavior/ continue to work identically?

**context**:
- the wish is about routes at `.route/`
- routes at `.behavior/` are not mentioned
- the blueprint assumes we should preserve them

**evidence this is required**:
1. this behavior itself uses `.behavior/` — if we broke it, we couldn't test the fix
2. all extant routes use `.behavior/`
3. the fix makes the guard LESS restrictive, so `.behavior/` routes should work by construction

**evidence this might not be required**:
- none — I cannot imagine a scenario where the wisher would want to break `.behavior/` routes

**recommendation**: preserve `.behavior/` routes (the fix does this by construction).

**wisher action needed**: confirm or reject.

---

## other backwards compat concerns

| concern | explicitly requested? | flag needed? |
|---------|----------------------|--------------|
| privilege bypass works | no | no — not touched by fix |
| no-bound-route allows all | no | no — not touched by fix |
| stone/guard protection | no | no — not touched by fix |

these don't need to be flagged because the fix doesn't touch them at all. they're not "backwards compat we're preserved" — they're "behaviors we didn't change".

only the `.behavior/` routes concern is relevant because it relates to the `.route/` pattern change.

---

## issue found

### [FLAGGED] backwards compat for .behavior/ routes needs wisher confirmation

**what**: the blueprint assumes routes at `.behavior/` should continue to work.

**why flagged**: the guide says to flag backwards compat that was not explicitly requested.

**action**: added OPEN QUESTION above for wisher to confirm.

**note**: I strongly believe the answer is "yes, preserve them" because:
1. the fix is backwards compatible by construction
2. this behavior itself uses `.behavior/`
3. there's no reason the wisher would want to break extant routes

but the guide says to flag it, so it's flagged.

---

## conclusion

one backwards compat concern was not explicitly requested:
- `.behavior/` routes should continue to work

per the guide, this is now flagged as an OPEN QUESTION for the wisher.

my recommendation: preserve them (which the fix does by construction).

