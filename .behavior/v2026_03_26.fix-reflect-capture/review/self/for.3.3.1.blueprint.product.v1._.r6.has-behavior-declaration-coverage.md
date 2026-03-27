# self-review r6: has-behavior-declaration-coverage

## step back and breathe

r1-r5 confirmed complete coverage. final verification with stillness.

---

## final verification: the core fix

**problem**: ENOBUFS when `git diff` output exceeds node buffer

**solution in blueprint**:

```typescript
// instead of buffer in node:
const patch = execSync('git diff', { encoding: 'utf-8' }); // ENOBUFS!

// write directly to file via shell:
execSync(`git diff > "${path}"`, { cwd }); // no buffer!
```

note: `encoding` is a Node.js API property name (unavoidable).

**does this solve the problem?**: YES. diff content never enters node.

---

## final verification: the hash

**problem**: if content is not in node, how to hash?

**solution in blueprint**:

```typescript
// hash via shell on the written files:
execSync(`cat "${staged}" "${unstaged}" | sha256sum | cut -d' ' -f1`);
```

**is this correct?**: YES. same content, same hash.

---

## final verification: the size

**problem**: if content is not in node, how to get byte size?

**solution in blueprint**:

```typescript
// read size from filesystem:
fs.statSync(path).size;
```

**is this correct?**: YES. file size equals content size.

---

## final verification: backwards compat

**problem**: plan mode should not write files

**solution in blueprint**:

```typescript
// plan mode uses maxBuffer instead:
execSync('git diff', { maxBuffer: 50 * 1024 * 1024 });
```

**is this addressed?**: YES. plan mode behavior preserved.

---

## conclusion

r6 final verification:
- core fix: verified
- hash: verified
- size: verified
- backwards compat: verified

blueprint has complete, correct behavior declaration coverage.
