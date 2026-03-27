# self-review r3: has-pruned-backcompat

## step back and breathe

r1 and r2 found no backcompat to remove. let me look from a different angle.

---

## question: what backwards compat did I NOT add?

maybe the issue is not what I kept, but what I did not add.

**items I did NOT preserve**:

1. **exact hash algorithm**: I changed from node crypto to shell sha256sum
   - old: `computeHash(stagedPatch + unstagedPatch)` in node
   - new: `cat staged unstaged | sha256sum` in shell

   **is this a backcompat break?**:
   - hash is metadata only, not in filename
   - hash is for deduplication within the snapshot system
   - old snapshots still valid (different hash = different snapshot, not broken)
   - no external consumers depend on hash format

   **verdict**: not a backcompat concern. hash is internal.

2. **exact error messages**: if sha256sum fails, error message differs
   - old: node would not error (hash in node)
   - new: shell error "sha256sum: command not found" (rare, both sha256sum and shasum are standard)

   **is this a backcompat break?**:
   - error messages are not API contract
   - users don't parse error messages programmatically

   **verdict**: not a backcompat concern. error messages are not contract.

---

## question: is 50MB maxBuffer a backwards compat concern?

old default was 1MB (node default). new is 50MB.

**is this a break?**: no. it is more permissive, not less.

**could it cause issues?**:
- 50MB buffer allocation for plan mode
- memory pressure on constrained systems

**is this backwards compat?**: no. this is a new limit, not preservation of old behavior.

**should I flag this?**:
- it is not backcompat — it is a new choice
- 50MB is reasonable for plan mode
- very large diffs should use apply mode

**verdict**: 50MB limit is a design choice, not backcompat. no flag needed.

---

## question: are there hidden backcompat assumptions?

let me re-read the blueprint for implicit items:

from blueprint:
- "interface unchanged" — explicit
- "plan mode retains old approach" — explicit
- "apply mode uses shell" — the fix

I do not see hidden assumptions.

---

## final check: have I been too conservative?

**r1 said**: all backcompat is evidence-based
**r2 said**: confirmed, each has a reason
**r3 says**: no hidden backcompat either

could I simplify by delete?

| component | deletable? | consequence |
|-----------|------------|-------------|
| plan mode maxBuffer | yes, use shell for both | tests fail, plan mode writes files |
| API signature | no | no reason to change |
| Savepoint interface | no | no reason to change |

the only deletable item (plan mode maxBuffer) has consequences (test failures, behavior change). it is not deletable without scope expansion.

---

## summary

r3 found no additional backcompat concerns:
- hash algorithm change is internal (not backcompat)
- error message change is not contract (not backcompat)
- 50MB limit is design choice (not backcompat)

no backcompat to remove. r1 and r2 conclusions hold.
