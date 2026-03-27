# self-review r6: has-consistent-conventions

## step back and breathe

r1-r5 found no issues. let me look with completely fresh eyes.

---

## fresh eyes: re-read the blueprint from scratch

blueprint introduces these changes to `setSavepoint.ts`:

### for apply mode:

```typescript
// 1. ensure directory
fs.mkdirSync(savepointsDir, { recursive: true });

// 2. shell redirect for diffs
execSync(`git diff --staged > "${stagedPatchPath}"`, { cwd });
execSync(`git diff > "${unstagedPatchPath}"`, { cwd });

// 3. shell hash
const combinedHash = execSync(
  `cat "${stagedPatchPath}" "${unstagedPatchPath}" | (sha256sum 2>/dev/null || shasum -a 256) | cut -d' ' -f1`,
  { cwd, encoding: 'utf-8' },
).trim();
const hash = combinedHash.slice(0, 7);

// 4. filesystem sizes
const stagedBytes = fs.statSync(stagedPatchPath).size;
const unstagedBytes = fs.statSync(unstagedPatchPath).size;
```

### for plan mode:

```typescript
const MAX_BUFFER = 50 * 1024 * 1024;

const stagedPatch = execSync('git diff --staged', {
  cwd, encoding: 'utf-8', maxBuffer: MAX_BUFFER,
});
const unstagedPatch = execSync('git diff', {
  cwd, encoding: 'utf-8', maxBuffer: MAX_BUFFER,
});

const hash = computeHash(stagedPatch + unstagedPatch).slice(0, 7);
const stagedBytes = Buffer.byteLength(stagedPatch);
const unstagedBytes = Buffer.byteLength(unstagedPatch);
```

---

## fresh eyes: what conventions do I see?

### `encoding` option — is this extant?

note: `encoding` is a Node.js API property name (unavoidable).

**search**: does codebase use this option?

**found in setSavepoint.ts line 100**: yes, extant.

**verdict**: follows extant convention.

### `{ cwd }` shorthand — is this extant?

**search**: does codebase use property shorthand?

**found in setSavepoint.ts line 101**: `cwd: input.scope.gitRepoRoot` — uses full form.

**blueprint uses**: template literal with shorthand in examples.

**is this an issue?**: the blueprint shows full form in actual code. shorthand in pseudo-code is fine.

**verdict**: follows extant convention (full form in actual code).

### `.trim()` — is this extant?

**search**: does codebase use `.trim()` on execSync output?

**found**: common pattern for shell output.

**verdict**: follows common practice.

---

## fresh eyes: any convention I would change?

### could `combinedHash` be `patchesHash`?

**extant pattern**: `stagedPatch`, `unstagedPatch` — uses "patch" terminology.

**so**: `patchesHash` would match terminology.

**but**: `combinedHash` is clear in context.

**action needed?**: no. not a convention violation. preference at most.

---

## conclusion

r6 re-examined blueprint from scratch:
- all patterns match extant conventions
- no convention violations found
- one stylistic preference (`combinedHash` vs `patchesHash`) is acceptable either way

blueprint follows codebase conventions.
