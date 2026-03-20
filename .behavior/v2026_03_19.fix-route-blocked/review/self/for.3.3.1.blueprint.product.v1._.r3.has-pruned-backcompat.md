# self-review r3: has-pruned-backcompat

review for backwards compatibility that was not explicitly requested.

---

## backwards compatibility concerns in blueprint

scan the blueprint for any backwards-compat considerations:

### 1. bottom command prompt retention

**what it says**: "bottom command prompt (retained as-is)"

**is this backwards compat?**: yes — the blueprint chooses to keep extant behavior rather than remove it.

**did wisher explicitly request this?**: no — wisher did not mention bottom prompt at all.

**is there evidence this compat is needed?**: yes — the vision (line 61-63) explicitly addresses this:
> "the bottom prompt serves a different purpose"
> "top catches attention; bottom enables action after read"

**verdict**: ✅ backwards compat was justified in vision, not assumed "to be safe"

---

### 2. drum nudge retention

**what it says**: formatRouteDrive shows `[○] drum nudge (count >= 7)` as unchanged

**is this backwards compat?**: yes — blueprint chooses not to modify extant drum nudge.

**did wisher explicitly request this?**: no — wisher only asked to ADD tea pause, not change drum nudge.

**is there evidence this compat is needed?**: yes — the r1 deletables review (section 6) addressed this:
> "drum nudge serves a different purpose (philosophical reminder at 7+ hooks)"
> "tea pause is actionable (5+ hooks). they complement each other."

**verdict**: ✅ backwards compat is correct — drum nudge has distinct purpose

---

### 3. approved status in header

**what it says**: header documents `approved` alongside arrived/passed/blocked

**is this backwards compat?**: yes — `approved` is extant behavior in route.stone.set.

**did wisher explicitly request this?**: no — wisher only mentioned arrived/passed/blocked.

**is there evidence this compat is needed?**: yes — the r3 YAGNI review addressed this:
> "`approved` is EXTANT behavior in route.stone.set"
> "to hide extant behavior in header would confuse drivers"

**verdict**: ✅ backwards compat is correct — document extant behavior

---

### 4. extant briefs in boot.yml

**what it says**: `briefs: ref:` section marked as `[○] keep as-is`

**is this backwards compat?**: yes — blueprint chooses not to modify extant briefs list.

**did wisher explicitly request this?**: no explicit request either way.

**is there evidence this compat is needed?**: not explicit, but:
- wisher asked to ADD skills.say section
- wisher did not ask to change briefs
- to modify briefs would be scope creep

**verdict**: ✅ backwards compat is correct — stay in scope

---

## search for hidden backwards compat assumptions

scan blueprint for phrases that suggest assumed compatibility:

| phrase | found? | location |
|--------|--------|----------|
| "for backwards compatibility" | no | — |
| "to maintain compatibility" | no | — |
| "to avoid break" | no | — |
| "legacy" | no | — |
| "deprecate" | no | — |
| "migration" | no | — |

**verdict**: no hidden backwards compat assumptions found

---

## open questions for wisher

| question | status |
|----------|--------|
| should bottom prompt be removed? | [answered in vision] — keep it |
| should drum nudge be removed? | [answered in r1] — keep it |
| should approved be hidden? | [answered in r3] — keep it |

**verdict**: all backwards compat questions were already addressed

---

## conclusion

the blueprint contains four backwards compatibility decisions:
1. bottom command prompt — justified in vision
2. drum nudge — justified in r1 deletables review
3. approved status — justified in r3 YAGNI review
4. extant briefs — correct per scope

no backwards compat was assumed "to be safe" without justification. no open questions for wisher.

**r3 verdict**: blueprint passes backwards compat review. no unjustified compat found.
