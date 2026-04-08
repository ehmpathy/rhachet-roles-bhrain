# self-review r5: has-pruned-backcompat

## verdict: pass (with one clarification)

## backwards compatibility audit

### compat 1: `.v1.i1.md` pattern

**explicitly requested?** yes

wish says:
> "we want to support the priors as artifacts by default too (.v1.i1.md)"

vision says:
> "`.v1.i1.md` continues to work"
> "no migration required for prior behaviors"

**verdict**: required. keep.

### compat 2: `.i1.md` pattern (priority 5)

**explicitly requested?** no

wish: doesn't mention `.i1.md`
vision: doesn't mention `.i1.md`
criteria: doesn't mention `.i1.md`

**why included?** research found tests use `.i1.md`

**analysis**:
- current glob `${stone.name}*.md` already matches `.i1.md`
- we're not ADDING compat - it already works
- priority 5 just makes the order explicit
- without priority 5, `.i1.md` falls to fallback (still works)

**question for wisher**: should `.i1.md` be:
1. explicit priority 5 (current blueprint), or
2. implicit via fallback (remove from priority list)?

**recommendation**: keep priority 5. reason:
- test fixtures use `.i1.md` (research evidence)
- explicit order between `.v1.i1.md` (priority 4) and `.i1.md` (priority 5)
- no runtime cost, only clarity

**verdict**: clarified. keep as-is. not a blocker.

### compat 3: legacy glob `${stone.name}*.md`

**explicitly requested?** yes (implied by vision)

vision says:
> "`.v1.i1.md` recognition | yes | yes"
> "`.i1.md` recognition | yes | yes"

this glob ensures these patterns continue to match.

**verdict**: required. keep.

## summary

| compat | requested? | verdict |
|--------|------------|---------|
| `.v1.i1.md` | yes (wish) | keep |
| `.i1.md` priority 5 | no, but research-backed | keep (clarified) |
| legacy glob | yes (implied) | keep |

no unrequested backwards compat found. `.i1.md` priority is documented extant behavior, not new compat.
