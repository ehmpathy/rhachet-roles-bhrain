# self-review r3: has-consistent-mechanisms

## step back and breathe

r2 focused on hash computation. let me broaden the search and examine every new mechanism introduced.

---

## inventory of new mechanisms

| mechanism | location | purpose |
|-----------|----------|---------|
| `git diff --staged > "${path}"` | line 112 | write staged diff to file via shell |
| `git diff > "${path}"` | line 113 | write unstaged diff to file via shell |
| `cat file1 file2 \| sha256sum` | line 118 | hash two files via shell |
| `(sha256sum \|\| shasum -a 256)` | line 118, 129 | portable hash fallback |
| `git diff --staged \| wc -c` | line 135 | count bytes via shell pipe |
| `git diff \| wc -c` | line 139 | count bytes via shell pipe |

---

## search: does the codebase have these patterns already?

### 1. shell redirect for git output

searched for `execSync.*>` in src/

**result**: only two places use shell redirect:
- `setSavepoint.ts:112-113` — my fix
- `route.mutate.guard.sh:184,186` — bash skill (different context)

**analysis**: no extant TypeScript pattern for shell redirect. my implementation introduces this pattern because the use case (avoid node buffer) is unique to `setSavepoint`.

**why not extant?**: other git commands (`getGitDiffStats`, `getGitRemoteUrl`) capture small output that fits in the default buffer. `setSavepoint` captures potentially large diffs.

### 2. shell pipe for hash

searched for `sha256sum|shasum` in src/

**result**: only `setSavepoint.ts` uses shell hash commands.

**analysis**: other hash computations use `crypto.createHash('sha256')` because content is already in memory. `setSavepoint` uses shell because content is in files (apply mode) or never enters node (plan mode).

**why not reuse node crypto?**: the vision explicitly says "diff content never enters node". node crypto requires the content in memory first.

### 3. shell pipe for byte count

searched for `wc -c` in src/

**result**: only `setSavepoint.ts` uses `wc -c`.

**analysis**: this is a new pattern. other places use `Buffer.byteLength()` or `fs.statSync().size`.

**why not reuse fs.statSync?**: in apply mode, we do use `fs.statSync().size`. in plan mode, no file exists — the diff flows through the pipe. `wc -c` counts bytes without buffer.

---

## question: could I have used extant utilities?

### enumFilesFromGlob?

no. this utility lists files, not compute hashes or write content.

### getGitDiffStats?

no. this utility computes line counts via `--numstat`, not raw diff content. small output, different purpose.

### any hash utility?

searched for `toHashSha256|hashContent|computeHash` in src/.

**result**: no shared hash utility exists. each file implements inline:
- `computeStoneJudgeInputHash.ts`: `crypto.createHash('sha256')`
- `computeStoneReviewInputHash.ts`: `crypto.createHash('sha256')`
- `getOneSavepoint.ts`: `createHash('sha256')`

**conclusion**: no shared utility to reuse. and even if one existed, it would use node crypto which requires content in memory.

---

## why the new patterns are necessary

| pattern | why not extant | why necessary |
|---------|----------------|---------------|
| shell redirect | unique use case (large output) | avoids node buffer |
| shell hash | extant uses node crypto | content never enters node |
| shell wc -c | extant uses fs.statSync | plan mode has no file |

each new mechanism exists because:
1. the extant approach (node buffer) was the root cause of ENOBUFS
2. the vision explicitly prohibits diff content in node

---

## could I have done this differently?

### alternative: spawn with streams

could have used `child_process.spawn` with `stdio: ['pipe', 'pipe', 'pipe']` and streamed to file via node streams.

**pros**: pure node, no shell dependency
**cons**: more complex, async, requires refactor of synchronous `setSavepoint`

**why not chosen**: blueprint chose shell pipes as simpler approach. the stream approach would require async refactor.

### alternative: temporary file via spawn

could have used spawn to write to temp file, then renamed.

**pros**: atomic write
**cons**: vision says atomicity not needed ("write then hash is fine")

---

## conclusion

every new mechanism was introduced because:
1. no extant mechanism serves the use case (large git output)
2. the vision explicitly requires "diff content never enters node"
3. shell pipes are the simplest approach to achieve this

no duplication of extant functionality. new patterns are necessary for the fix.

r3 complete.
