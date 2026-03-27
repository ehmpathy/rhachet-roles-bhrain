# self-review r2: has-pruned-backcompat

## step back and breathe

in r1 I concluded all backwards compat was evidence-based. let me question that conclusion.

---

## re-examine concern 1: plan mode with maxBuffer

**r1 conclusion**: keep because tests verify no file writes.

**fresh eyes question**: is that test correct? should plan mode write files?

**analysis**:

the test exists. but does the test reflect correct behavior?

plan mode purpose: preview what would happen without side effects.

if plan mode writes files:
- side effect occurs
- user must clean up if they cancel
- defeats purpose of "plan" (preview only)

if plan mode uses maxBuffer:
- no files written (correct for preview)
- 50MB limit is reasonable for preview
- very large diffs can use apply mode

**verdict on r1 conclusion**: correct. plan mode should not write files. the test reflects correct behavior. to keep maxBuffer for plan mode is not assumed backcompat — it is correct behavior.

---

## re-examine concern 2: API signature unchanged

**r1 conclusion**: keep because no reason to change.

**fresh eyes question**: could we simplify by delete of plan mode entirely?

**analysis**:

the wisher said "fix ENOBUFS in apply mode". they did not ask to preserve plan mode.

but: delete of plan mode is a break change. consumers use plan mode.

**is there evidence plan mode is used?**:
- tests use plan mode
- captureSnapshot calls setSavepoint with mode
- reflect skill offers plan/apply to users

delete of plan mode would be scope creep in the opposite direction — delete of features not asked to delete.

**verdict on r1 conclusion**: correct. keep API unchanged. feature deletion is also scope creep.

---

## re-examine concern 3: Savepoint interface unchanged

**r1 conclusion**: keep because no reason to change.

**fresh eyes question**: does the fix require interface changes?

**analysis**:

the fix:
- writes diff via shell redirect (no interface change)
- computes hash via shell (no interface change)
- reads size via fs.statSync (no interface change)

the Savepoint interface returns the same data. only the internal implementation changes.

**verdict on r1 conclusion**: correct. no interface change needed.

---

## have I assumed backcompat "to be safe"?

let me list what I kept:

| kept | why |
|------|-----|
| plan mode behavior | tests verify it, correct for preview semantics |
| setSavepoint signature | no reason to change |
| Savepoint interface | no reason to change |

none of these are "just in case" assumptions. each has a reason.

---

## open questions for wisher

still none. I questioned r1 conclusions and they held:

1. plan mode behavior is correct (preview = no side effects)
2. API signature is sufficient (no change needed)
3. Savepoint interface is sufficient (no change needed)

---

## summary

r2 confirms r1 conclusions. no backcompat concerns to remove.
