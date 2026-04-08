# backwards compat review: yield artifact pattern implementation

## backwards compat in the wish

the wish explicitly stated:
> "we want to support the priors as artifacts by default too (.v1.i1.md)"

this is explicit request for backwards compatibility.

## backwards compat in the vision

the vision states:
> "backwards compat required - `.v1.i1.md` remains a valid artifact pattern"

and in assumptions:
> "backwards compat required - `.v1.i1.md` remains a valid artifact pattern indefinitely"

## backwards compat in the criteria

criteria `usecase.1` explicitly requires:
> "recognizes {stone}.v1.i1.md as artifact sothat extant behaviors continue to work"

## what was implemented

| pattern | supported | explicit request? |
|---------|-----------|-------------------|
| `.yield.md` | ✅ | yes (wish) |
| `.yield.*` | ✅ | yes (wish) |
| `.yield` | ✅ | yes (wish) |
| `.v1.i1.md` | ✅ | yes (wish, vision, criteria) |
| `.i1.md` | ✅ | implicit (test fixtures use this) |

## YAGNI check on backwards compat

| concern | explicitly requested? | verdict |
|---------|----------------------|---------|
| `.v1.i1.md` support | yes | keep |
| `.i1.md` support | no (implicit) | keep - test fixtures rely on this |

## conclusion

all backwards compatibility is explicitly requested or necessary for test fixtures.
no YAGNI violations detected.
