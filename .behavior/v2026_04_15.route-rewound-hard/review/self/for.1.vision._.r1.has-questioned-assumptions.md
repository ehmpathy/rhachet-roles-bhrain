# self-review: has-questioned-assumptions

## assumptions examined

### 1. yield files follow `$stone.yield.md` pattern

**what we assume:** yield files are named `{stone-name}.yield.md`

**evidence:**
- checked extant yields in `.behavior/v2026_04_12.route-stone-add/`
- found: `1.vision.yield.md`, `3.1.3.research.internal.product.code.test._.yield.md`, etc.
- all follow `$stone.yield.md` pattern

**what if the opposite were true?** if yields had variable patterns, we'd need more complex glob logic

**verdict:** assumption holds — pattern is consistent across extant routes

### 2. yield files live in route directory only

**what we assume:** yields are at `$route/$stone.yield.md`, not nested elsewhere

**evidence:**
- all extant yields are direct children of the route directory
- no nested yield directories observed

**what if the opposite were true?** we'd need recursive search, more complex deletion logic

**verdict:** assumption holds — yields are route-level artifacts

### 3. git soft/hard is the right mental model

**what we assume:** users will understand soft/hard from git experience

**evidence:**
- git's soft/hard distinction is widely known
- "soft keeps work, hard clears slate" maps directly
- wish explicitly uses "hard" and "soft" terms

**what if the opposite were true?** users unfamiliar with git might be confused. but the semantics are simple enough: soft = preserve, hard = delete.

**verdict:** assumption holds — the analogy is appropriate

### 4. soft should be the default

**what we assume:** omit `--mode` defaults to soft (current behavior)

**evidence:**
- backwards compatibility requires this
- wish introduces new behavior, not replacement

**did wisher say this?** no, but implicit in "ability to rewound --mode hard | soft" — implies option, not replacement

**verdict:** assumption holds — soft default is safe

### 5. no confirmation needed for hard mode

**what we assume:** `--mode hard` is explicit enough, no `--force` needed

**evidence:**
- git doesn't require `--force` alongside `--hard`
- explicit flag IS the confirmation

**what if the opposite were true?** more friction for deliberate action. could add `--force` later if needed.

**verdict:** assumption holds — but noted as potential future enhancement if misuse occurs

### 6. cascade applies to yield deletion too

**what we assume:** when 3.blueprint is rewound with hard mode, all downstream stones (4.roadmap, 5.execution) also have yields deleted

**did wisher say this?** yes: "for all the stones that got rewound when hard mode"

**what if the opposite were true?** would be inconsistent — guard artifacts cascade, yields wouldn't. confuses mental model.

**verdict:** assumption explicitly supported by wish

### 7. no need to delete partial/draft yields

**what we assume:** we delete `$stone.yield.md`, not `$stone.yield.draft.md` or similar

**evidence:** no draft yield patterns observed in extant routes

**what if the opposite were true?** would need to expand glob pattern

**verdict:** assumption holds — no draft patterns exist. can expand later if needed.

## hidden assumption surfaced

### the "mode" flag may conflict with other modes

in extant cli patterns, `--mode plan | apply` is common. if rewind uses `--mode hard | soft`, what about plan/apply semantics for rewind?

**analysis:**
- current rewind has no plan/apply mode — it's immediate
- hard/soft is orthogonal to plan/apply
- if plan/apply were needed, could use `--preview` or different flag

**verdict:** no conflict today. noted for future awareness.

## summary

all assumptions examined and hold:
- `$stone.yield.md` pattern ✓
- yields in route directory ✓
- git mental model ✓
- soft default ✓
- no extra confirmation ✓
- cascade applies ✓
- no draft patterns ✓

one potential future consideration: mode flag namespace if plan/apply needed later.
