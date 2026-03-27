# self-review r1: has-pruned-backcompat

## step back and breathe

tea. patience. examine each backwards compatibility concern in the blueprint.

---

## backwards compatibility concerns in blueprint

| concern | what it does |
|---------|--------------|
| plan mode with maxBuffer | retains old approach for plan mode |
| API signature unchanged | keeps `setSavepoint(input)` signature |
| Savepoint interface unchanged | keeps same return shape |

---

## concern 1: plan mode with maxBuffer

**did the wisher explicitly request this?**: no. the wish is "diagnose and repair" the ENOBUFS error. no mention of plan mode.

**is there evidence this backwards compat is needed?**: YES.

from test research (3.1.3.research.internal.product.code.test._.v1.stone):
- `setSavepoint.integration.test.ts` tests plan mode
- test verifies plan mode does NOT write files
- test assertion: `fs.existsSync(savepoint.patches.stagedPath)` returns `false` for plan mode

if we used shell redirect in plan mode:
1. files would be written
2. we would need to delete them after
3. on error, orphan files would remain
4. tests would fail

**verdict**: this backwards compat is evidence-based, not assumed. it is required because tests explicitly verify plan mode behavior.

---

## concern 2: API signature unchanged

**did the wisher explicitly request this?**: no.

**is there evidence this backwards compat is needed?**: yes, by default practice.

to change API signatures without need:
- forces callers to update
- creates version bumps
- adds no value if interface is sufficient

the extant signature `setSavepoint({ scope, mode })` is sufficient for the fix.

**verdict**: this is good practice, not scope creep. no flag needed.

---

## concern 3: Savepoint interface unchanged

**did the wisher explicitly request this?**: no.

**is there evidence this backwards compat is needed?**: yes, by default practice.

same reason as concern 2. the Savepoint interface works for the fix. to change it would require update of all consumers.

**verdict**: this is good practice, not scope creep. no flag needed.

---

## open questions for wisher

none. all backwards compat concerns are evidence-based:

1. **plan mode**: tests explicitly verify no file writes — this is not assumed, it is tested behavior
2. **API signature**: no reason to change — sufficient for the fix
3. **Savepoint interface**: no reason to change — sufficient for the fix

---

## summary

| concern | explicitly requested? | evidence-based? | verdict |
|---------|----------------------|-----------------|---------|
| plan mode maxBuffer | no | YES (test verifies no writes) | keep |
| API signature | no | YES (no need to change) | keep |
| Savepoint interface | no | YES (no need to change) | keep |

no backwards compat concerns flagged for removal. all are evidence-based, not assumed "to be safe."
