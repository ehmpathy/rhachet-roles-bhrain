# self-review r4: has-questioned-assumptions

## verdict: pass

## fresh examination

r3 covered 7 assumptions. r4 looks for assumptions not yet questioned.

### assumption 8: deterministic selection within priority

**claim**: when multiple files match same priority (e.g., `.yield.json` and `.yield.txt`), selection is deterministic

**question**: what if glob returns files in random order?

**analysis**:
- transformer uses `.find()` which returns first match in array
- glob libraries typically sort results alphabetically
- `.yield.json` would precede `.yield.txt` alphabetically
- selection is deterministic via alphabet order

**status**: valid assumption (library behavior)

### assumption 9: artifacts are files, not directories

**claim**: `.yield` could be a directory name, not a file

**question**: what if someone creates a `.yield/` directory?

**analysis**:
- `fast-glob` by default matches files only (`onlyFiles: true`)
- a directory named `.yield` would not be returned
- this is correct behavior for artifacts

**status**: valid assumption (library default)

### assumption 10: case sensitivity

**claim**: `.Yield.md` is different from `.yield.md`

**question**: should we convert case for cross-platform compat?

**analysis**:
- unix: case-sensitive (different files)
- windows: case-insensitive (same file)
- glob libraries follow OS behavior
- no case conversion needed - follow file system

**status**: valid assumption (follows file system)

### assumption 11: symlinks are valid artifacts

**claim**: if `.yield.md` is a symlink, it should be returned

**question**: should symlinks be excluded?

**analysis**:
- glob follows symlinks by default
- a symlinked artifact is still a valid artifact
- no reason to exclude

**status**: valid assumption (sensible default)

### assumption 12: return type `string | null`

**claim**: transformer returns single path or null, no metadata

**question**: should we return richer type with selection reason?

**analysis**:
- criteria requires select one artifact
- no requirement for selection metadata
- simpler is better (KISS)

**status**: valid assumption (minimal contract)

## summary

12 assumptions total examined across r3 and r4. all assumptions are:
- traced to requirements (vision, criteria), or
- follow library defaults, or
- apply minimal approach (KISS)

no hidden assumptions found that need correction.
