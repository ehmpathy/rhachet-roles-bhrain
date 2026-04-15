# self-review r1: has-questioned-requirements

stone: 1.vision
reviewer: mechanic
round: 1 (post-wisher-feedback)
date: 2026-04-12

---

## pause and breathe

i stopped. i re-read the updated vision line by line. i questioned each requirement. here is what i found.

---

## requirements questioned

### requirement 1: `--stone` flag with numeric prefix + alpha segment validation

**who said this was needed?** wisher, in feedback session.

**evidence:** wisher explicitly said "validate that the stone name is fully qualified" and "numeric prefix and then alpha afterwards" and "atleast".

**what if we didn't do this?** drivers could create malformed stones like `foo` or `123` without descriptive names. route would become unreadable.

**is scope right?** yes — minimal validation that ensures stones are identifiable.

**simpler way?** no. this is already minimal.

**verdict:** requirement holds.

---

### requirement 2: `--from` with three source types (@stdin, template(), literal)

**who said this was needed?** wisher, in original wish: "declare the contents via stdin" and "use a template".

**evidence:** wish explicitly mentions both stdin and template as sources.

**what if we didn't do this?** drivers would have no way to populate stone content. skill would be useless.

**is scope right?** yes — three sources cover all usecases.

**simpler way?** could drop literal, but it's a convenience for short content.

**verdict:** requirement holds.

---

### requirement 3: `template($behavior/refs/...)` syntax

**who said this was needed?** wisher, in feedback: "should support `--from template($behavior/refs/.research.adhoc.template.stone)` as the pragma".

**evidence:** wisher gave exact syntax.

**what if we didn't do this?** would need different template discovery mechanism.

**is scope right?** yes — path-based is more flexible than fixed names.

**simpler way?** no. path-based is already simple.

**verdict:** requirement holds.

---

### requirement 4: no guards, stones only

**who said this was needed?** wisher, in feedback: "no guards for now too".

**evidence:** explicit wisher statement.

**what if we didn't do this?** scope creep, more complexity in v1.

**is scope right?** yes — start simple, add guards later if needed.

**simpler way?** n/a — this is the simpler option.

**verdict:** requirement holds.

---

### requirement 5: no stone position validation

**who said this was needed?** wisher, in feedback: "yep, no validation" and "no validation, no guards".

**evidence:** explicit wisher statement.

**what if we didn't do this?** would gatekeep drivers, add friction.

**is scope right?** yes — trust driver to pick position.

**simpler way?** n/a — this is the simpler option.

**verdict:** requirement holds.

---

### requirement 6: collision check (stone must not exist)

**who said this was needed?** wisher, in feedback: "it should not collide with an extant stone".

**evidence:** explicit wisher statement.

**what if we didn't do this?** could silently overwrite stones, lose work.

**is scope right?** yes — essential pit-of-success guard.

**simpler way?** no. this is minimal.

**verdict:** requirement holds.

---

### requirement 7: auto-detect route via resolveRouteFromBind()

**who said this was needed?** discovered via code inspection, confirmed by wisher: "auto detect just like the other route.stone operations do".

**evidence:** extant pattern in all route.stone.* commands.

**what if we didn't do this?** would break consistency with rest of family.

**is scope right?** yes — matches extant behavior.

**simpler way?** no. this is the extant pattern.

**verdict:** requirement holds.

---

## summary

all requirements questioned. all hold:

| requirement | source | verdict |
|-------------|--------|---------|
| stone name validation | wisher feedback | holds |
| three --from sources | original wish | holds |
| template($path) syntax | wisher feedback | holds |
| no guards | wisher feedback | holds |
| no position validation | wisher feedback | holds |
| collision check | wisher feedback | holds |
| auto-detect route | extant pattern + wisher | holds |

no issues found. all requirements are grounded in explicit wisher feedback or extant conventions.
