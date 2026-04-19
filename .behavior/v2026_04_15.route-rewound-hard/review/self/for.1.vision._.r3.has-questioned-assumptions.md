# self-review r3: has-questioned-assumptions

tea first. then, slow reflection. 🍵

## review of each assumption with fresh eyes

i re-read the vision line by line. here are the assumptions i examined:

### assumption 1: yield files are exactly `$stone.yield.md`

**claim in vision:** "yield files follow the pattern `$stone.yield.md`"

**evidence gathered:**
- examined `.behavior/v2026_04_12.route-stone-add/`
- found yields: `1.vision.yield.md`, `3.1.3.research.internal.product.code.test._.yield.md`
- all follow exact pattern: stone name + `.yield.md`
- no variations like `.yield.draft.md` or `.yield.v1.md`

**what if opposite were true?**
- would need glob pattern like `$stone.yield*.md`
- more complex deletion logic
- risk of false matches

**verdict:** pattern is consistent. assumption holds.

### assumption 2: yields live only at route level

**claim in vision:** "yield files live in the route directory, not nested elsewhere"

**evidence gathered:**
- all observed yields are direct children of the route directory
- no `review/` or `outputs/` subdirectories for yields

**what if opposite were true?**
- would need recursive search
- more complex file enumeration
- risk of delete from wrong locations

**verdict:** assumption holds. yields are route-level artifacts.

### assumption 3: cascade semantics are correct

**claim in vision:** "cascade applies to both soft and hard (all affected stones)"

**did wisher say this?** yes: "for all the stones that got rewound when hard mode"

**what if cascade didn't apply to yields?**
- driver would need to run hard rewind on each stone
- inconsistent with guard artifact behavior
- defeats purpose of cascade

**verified against wish:** explicit. assumption holds.

### assumption 4: default must be soft

**claim in vision:** "soft = keep yield files (default)"

**evidence:**
- backwards compatibility is critical
- extant rewind callers expect current behavior
- hard mode is additive, not replacement

**what if default were hard?**
- breakage of extant workflows
- surprise data loss
- angry users

**verdict:** soft default is essential. assumption holds.

### assumption 5: `--mode` namespace won't conflict

**hidden assumption surfaced in r2:** what if other modes exist?

**analysis:**
- current rewind has no plan/apply mode
- `--mode hard | soft` is orthogonal to plan/apply semantics
- if plan/apply needed later, could use `--preview` flag

**issue found in r2:** what about `--mode` with non-rewind actions?
- fixed: added edgecase for error when `--mode` used with non-rewind

**verdict:** assumption holds after fix.

### assumption 6: output format will match extant conventions

**claim in vision:** proposed output with `yield = preserved` line

**evidence:** did not verify against current output format

**what if extant format is different?**
- implementation would need to match
- proposed format may need adjustment

**verdict:** assumption noted as implementation verification item. not a blocker for vision.

### assumption 7: deletion is synchronous and atomic

**hidden assumption:** yield deletion happens as part of rewind operation

**what if file system fails mid-delete?**
- partial state: some yields deleted, others remain
- passage marked as rewound but yields half-deleted

**analysis:**
- same risk exists for guard artifact deletion today
- not unique to yield deletion
- can add transaction semantics later if needed

**verdict:** acceptable risk. matches extant behavior. assumption holds.

### assumption 8: no confirmation needed beyond explicit flag

**claim in vision:** `--mode hard` is the confirmation

**evidence:** git doesn't require `--force` with `--hard`

**what if users accidentally type hard?**
- explicit flag reduces accidents
- git history provides recovery
- passage.jsonl provides audit trail

**verdict:** mitigations sufficient. assumption holds.

## issues found and resolved

| issue | status |
|-------|--------|
| `--mode` with non-rewind actions | fixed in vision |
| output format verification | noted for implementation |

## assumptions that hold

| assumption | why it holds |
|------------|--------------|
| exact yield pattern | evidence from extant routes |
| yields at route level | evidence from extant routes |
| cascade applies | explicit in wish |
| soft default | backwards compatibility |
| mode namespace | orthogonal to plan/apply |
| sync deletion acceptable | matches extant guard behavior |
| no extra confirmation | explicit flag + recovery options |

## reflection

the review process surfaced one real issue (mode with non-rewind) that was fixed. other assumptions were validated against evidence or wish text. the vision is sound.
