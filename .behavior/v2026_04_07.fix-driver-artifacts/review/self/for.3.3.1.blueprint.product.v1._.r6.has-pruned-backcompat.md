# self-review r6: has-pruned-backcompat

## verdict: pass

## open question escalation

r5 identified one backwards compat item not explicitly requested: `.i1.md` priority 5

### the open question

**item**: `.i1.md` at priority 5 in `asArtifactByPriority`

**requested by wisher?** no

**why included?** research found tests use `.i1.md` pattern

**impact if removed?**
- `.i1.md` files still match via glob `${stone.name}*.md`
- priority becomes undefined (first match wins)
- tests continue to work

**impact if kept?**
- explicit priority: `.v1.i1.md` before `.i1.md`
- clearer, deterministic behavior
- no runtime cost

### decision

after re-examination, deletion of priority 5 does NOT break functionality. it only makes priority order implicit vs explicit.

**recommendation to wisher**: keep priority 5 for explicitness.

**if wisher disagrees**: delete priority 5 line from transformer. no other changes needed.

### final audit

| compat item | requested? | decision |
|-------------|------------|----------|
| `.v1.i1.md` | yes (wish) | required, keep |
| `.i1.md` priority 5 | no | optional, recommend keep |
| legacy glob | yes (vision) | required, keep |

## conclusion

all required backwards compat items are explicitly requested. the one optional item (`.i1.md` priority 5) is flagged with clear recommendation. blueprint is valid regardless of wisher's decision on the optional item.
