# self-review r3: has-pruned-yagni

## step back and breathe

in r2, I identified the try/catch error wrap as borderline YAGNI but kept it. let me reconsider with fresh eyes.

---

## reconsider the try/catch

**what the vision says**: fix the ENOBUFS error for apply mode.

**what the criteria says**: capture snapshots regardless of diff size.

**what the try/catch does**: improves error message when plan mode hits 50MB limit.

**is this in scope?**:
- the bug is in apply mode (ENOBUFS)
- the fix targets apply mode (shell redirect)
- plan mode is not broken (it already has a 1MB limit, now 50MB)
- improved plan mode error message is scope creep

**YAGNI verdict**: YES, the try/catch is YAGNI.

**why I kept it in r2**: I rationalized "low cost, high value" but that's the classic YAGNI trap. "while we're here" is scope creep.

---

## action: remove try/catch from blueprint

**before**:
```typescript
try {
  stagedPatch = execSync(...);
  unstagedPatch = execSync(...);
} catch (error) {
  if (error instanceof Error && error.message.includes('maxBuffer')) {
    throw new Error('diff too large for plan mode (>50MB)...');
  }
  throw error;
}
```

**after**:
```typescript
stagedPatch = execSync('git diff --staged', {
  cwd: input.scope.gitRepoRoot,
  encoding: 'utf-8',
  maxBuffer: MAX_BUFFER,
});

unstagedPatch = execSync('git diff', {
  cwd: input.scope.gitRepoRoot,
  encoding: 'utf-8',
  maxBuffer: MAX_BUFFER,
});
```

the maxBuffer stays (necessary for backwards compat). the try/catch goes (YAGNI).

---

## why this matters

minimal scope:
- fewer lines to review
- fewer lines to test
- fewer lines to maintain
- clearer focus on the actual fix

if users hit the 50MB plan mode limit:
- node throws "maxBuffer exceeded"
- they can use apply mode
- we can add a better error LATER if users complain

---

## fix applied

removed try/catch error wrap from blueprint § plan mode section.

**verification**: confirmed blueprint now reads "plan mode (retain with maxBuffer)" without try/catch block.

**before**: 29 lines with try/catch
**after**: 17 lines without try/catch

---

## summary

| component | r2 status | r3 status | action |
|-----------|-----------|-----------|--------|
| shell redirect | required | required | keep |
| portable hash | required | required | keep |
| fs.statSync | required | required | keep |
| maxBuffer plan | required | required | keep |
| try/catch error | kept | YAGNI | **removed** ✓ |

one YAGNI deletion applied. blueprint is now minimal.
