# self-review: has-questioned-requirements

## requirements examined

### 1. `--mode hard | soft` as the interface

**who said this?** the wisher, in the wish.

**evidence?** explicit in wish: "we should be able to prescribe, on stone --as rewound, the ability to rewound --mode hard | soft"

**what if we didn't?** we'd need an alternative interface. options considered:
- `--yield delete | keep` — more explicit about what happens, but longer
- `--clean deep | shallow` — unclear semantics
- `--hard` flag alone — git uses `--hard` as a standalone flag

**verdict:** `--mode hard | soft` matches the wish and follows git's familiar mental model. requirement holds.

### 2. only delete `$stone.yield.md` files

**who said this?** the wisher, explicitly scoped.

**evidence?** wish says: "for now, only focus on the $stone.yield.md file in --hard mode" and "no need, in case the stone artifacts include src, to roll those back"

**what if we didn't scope it?** we'd risk dangerous rollbacks of actual code changes. the driver would need to understand which files are safe to delete.

**verdict:** scope limitation is wise. yield files are route-internal artifacts. src/ changes are implementation that may have been committed. requirement holds.

### 3. cascade yield deletion to all affected stones

**who said this?** implied by wish: "for all the stones that got rewound when hard mode"

**evidence?** current rewind cascades guard artifact deletion. wish expects yield deletion to follow same pattern.

**what if we didn't cascade?** driver would need to run hard rewind on each stone individually. defeats the purpose of cascade.

**could we simplify?** no — cascade is fundamental to rewind semantics. a rewound stone invalidates all downstream stones.

**verdict:** cascade yield deletion matches extant behavior. requirement holds.

### 4. default to soft (current behavior)

**who said this?** implied by backwards compatibility needs.

**evidence?** wish introduces new behavior. extant scripts that call `--as rewound` should not suddenly delete yields.

**what if we didn't default to soft?** breakage of extant workflows. surprise data loss.

**verdict:** soft as default is essential for backwards compatibility. requirement holds.

## questioned but not in vision

### should there be a `--force` flag for hard mode?

considered whether hard mode should require `--force` or confirmation.

**verdict:** the explicit `--mode hard` IS the confirmation. no need for double-confirmation. if a driver types `--mode hard`, they mean it.

### should yield files be backed up before deletion?

considered whether to copy yields to `.route/.trash/` before delete.

**verdict:** git history provides backup. a trash folder adds complexity. if someone hard rewinds by mistake, they can `git checkout` the files back.

## summary

all core requirements hold. the vision accurately reflects the wish:
- `--mode hard | soft` interface ✓
- scoped to `$stone.yield.md` files ✓
- cascade to all affected stones ✓
- default to soft ✓
