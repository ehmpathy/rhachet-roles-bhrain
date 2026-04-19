# self-review r2: has-questioned-assumptions

deeper reflection after pause.

## new assumptions surfaced

### 1. `--mode` only makes sense with `--as rewound`

**what we assume:** `--mode hard | soft` is only valid with `--as rewound`

**what if someone runs:** `rhx route.stone.set --stone 1.vision --as passed --mode hard`

**issue found:** vision doesn't specify behavior for this case.

**fix needed:** add to edgecases: `--mode` with non-rewind action should either error or be ignored with a notice.

**updated vision:** added to edgecases table.

### 2. output format matches extant conventions

**what we assume:** proposed output with `yield = preserved` fits extant output structure

**evidence needed:** didn't verify against current snapshot format

**verdict:** assumption untested. at implementation time, should verify extant output format and match conventions. noted as research item.

### 3. yield pattern is exact match, not glob

**what we assume:** delete `$stone.yield.md` exactly

**what if:** there are multiple yields like `3.blueprint.yield.draft.md` or versioned yields?

**evidence:** checked extant routes — no such patterns found. all yields follow `$stone.yield.md` exactly.

**verdict:** assumption holds. exact match is correct.

### 4. no git reset --mixed equivalent needed

**what we assume:** only soft and hard, no intermediate mode

**git parallel:**
- `git reset --soft` = keep staged changes
- `git reset --mixed` = unstage but keep work changes (default)
- `git reset --hard` = discard all

**for rewind:**
- soft = keep yields + clear guard artifacts + mark passage
- hard = delete yields + clear guard artifacts + mark passage
- no need for intermediate — guard artifacts are always cleared

**verdict:** assumption holds. two modes are sufficient.

## issues found and fixed

### issue 1: --mode with non-rewind actions

**found:** vision didn't specify behavior

**fix:** update edgecases table to add:

| edgecase | handle |
|----------|--------|
| `--mode` with non-rewind action | error: "--mode only valid with --as rewound" |

**status:** fixed — added edgecase to vision yield at line 164

## summary

deeper review surfaced one issue:
- `--mode` validation for non-rewind actions (fixed)

other assumptions hold after re-examination:
- git analogy maps correctly (soft/hard sufficient)
- exact yield pattern match is correct
- output format assumption noted for implementation verification
