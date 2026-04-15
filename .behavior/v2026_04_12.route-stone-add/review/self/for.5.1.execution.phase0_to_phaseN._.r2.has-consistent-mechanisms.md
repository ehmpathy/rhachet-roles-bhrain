# self-review: has-consistent-mechanisms (r2)

## review question

review for new mechanisms that duplicate extant functionality.

## articulation

### mechanism 1: `collectStdinContent()` in route.ts

**what i found**: `goal.ts` has a `readStdin()` function that reads from stdin.

**comparison**:
- `goal.ts`: uses `execSync('cat', { input: null, stdio: ... })` — spawns a subprocess
- `route.ts`: uses `fsSync.readSync(0, ...)` — reads fd 0 directly

**is this duplication?**: partially. both read stdin, but implementations differ:
- `goal.ts` approach spawns `cat` subprocess
- my approach reads fd 0 directly (no subprocess)

**why i chose a new approach**: the direct fd read is faster and has fewer dependencies. however, this is a minor duplication.

**recommendation**: consider a shared `readStdinSync()` utility in a future refactor. for now, the duplication is acceptable because:
1. both implementations are stable and work
2. the code is in different CLI modules
3. a shared utility extract was not in scope

**verdict**: ⚠️ minor duplication, acceptable for this scope

### mechanism 2: `isValidStoneName()` in stones/isValidStoneName.ts

**what i found**: no extant validation for stone name format.

`stepRouteStoneSet.ts` validates `--that` slugs against a list of valid review.self slugs, but does not validate stone name format (numeric prefix, dot notation).

**is this duplication?**: no. this is new functionality.

**verdict**: ✅ no duplication

### mechanism 3: `getContentFromSource()` in stones/getContentFromSource.ts

**what i found**: `goal.ts` has `parseStdinValues()` which handles `@stdin` and `@stdin.N` patterns.

**comparison**:
- `goal.ts`: handles `@stdin`, `@stdin.0`, `@stdin.1` with null-separated parse
- my code: handles `@stdin`, `template($path)`, and literal values

**is this duplication?**: no. different purposes:
- `goal.ts` parses multiple stdin-sourced flag values
- my code resolves a single content source specifier with template expansion

**verdict**: ✅ no duplication

### mechanism 4: `formatRouteStoneEmit()` extension

**what i found**: extended extant function to support `'add'` action.

**is this duplication?**: no. this reuses the extant mechanism.

**verdict**: ✅ reuses extant mechanism

## summary

| mechanism | duplicates extant? | verdict |
|-----------|-------------------|---------|
| collectStdinContent | minor overlap with goal.ts readStdin | ⚠️ acceptable |
| isValidStoneName | no | ✅ new functionality |
| getContentFromSource | no | ✅ different purpose |
| formatRouteStoneEmit | no | ✅ extended extant |

## final verdict

⚠️ one minor duplication found (stdin read). acceptable for this scope. recommend shared utility in future refactor.
