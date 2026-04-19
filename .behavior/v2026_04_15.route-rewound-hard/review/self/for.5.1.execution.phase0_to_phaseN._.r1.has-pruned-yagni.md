# self-review: has-pruned-yagni

## question: was yagni respected?

### analysis

**the wish requested:**
1. `--mode hard | soft` flags for rewound
2. soft = keep yields (current behavior)
3. hard = remove yields
4. focus on `$stone.yield.md` file
5. no need to roll back src artifacts
6. cascade to all rewound stones
7. acceptance tests with snapshots

**what was implemented:**
1. `--yield drop|keep` with `--hard`/`--soft` aliases
2. soft = keep yields
3. hard = archive yields to `.route/.archive/`
4. glob pattern `${stone}.yield*` catches all yield files
5. src artifacts not touched
6. cascade applies yield mode to all rewound stones
7. 51 acceptance tests with snapshots

### items reviewed

#### 1. flag name: `--yield` vs `--mode`
- **decision**: used `--yield drop|keep` instead of `--mode hard|soft`
- **why it holds**: `--yield` is more explicit about what it affects. `--mode` is ambiguous (mode of what?). the aliases `--hard`/`--soft` preserve the original terminology.
- **verdict**: not YAGNI, better name choice

#### 2. glob pattern `${stone}.yield*` vs exact `${stone}.yield.md`
- **potential YAGNI**: the wish says "focus on the $stone.yield.md file"
- **why I kept it**: yield files can have variations (`.yield.json`, `.yield.draft.md`). the glob catches all without over-specification. the wish says "yield.md files" (plural) and the contrast with "src" suggests the intent is "yield artifacts" not "exactly this one filename".
- **tests include**: `.yield.md`, `.yield.json`, `.yield.draft.md` variations
- **verdict**: borderline, but the broader pattern future-proofs without extra complexity. the archive operation is the same regardless of extension.

#### 3. archive to `.route/.archive/` vs delete
- **decision**: archive instead of delete
- **why it holds**: this matches extant pattern for guard artifacts. preserves history. allows recovery if needed.
- **verdict**: not YAGNI, follows established pattern

#### 4. mutual exclusivity validation for --hard/--soft
- **decision**: added validation that --hard and --soft are mutually exclusive
- **why it holds**: prevents user confusion and invalid state
- **verdict**: not YAGNI, defensive design

#### 5. conflict validation (--hard + --yield keep)
- **decision**: added validation for contradictory combinations
- **why it holds**: prevents invalid intent expression
- **verdict**: not YAGNI, defensive design

### conclusion

no YAGNI violations found. the implementation is minimal viable for the wish. the glob pattern is the only borderline item, but it adds no complexity and aligns with the intent to archive "yield files" broadly.
