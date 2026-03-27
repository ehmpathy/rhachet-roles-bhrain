# self-review r2: has-consistent-mechanisms

## step back and breathe

r1 searched the codebase and found no duplication. let me dig deeper.

---

## deeper search: could extant mechanisms solve this?

### question 1: could we use extant `computeHash` in apply mode?

**r1 conclusion**: apply mode uses shell hash because content is in files.

**fresh eyes**: what if we read the files back into node and hash there?

**analysis**:
```typescript
// could do this:
execSync(`git diff > "${path}"`);
const content = fs.readFileSync(path, 'utf-8');
const hash = computeHash(content);
```

**why this is wrong**: we avoided ENOBUFS by not buffer in node. if we read the file back into node to hash, we reintroduce the buffer problem.

**verdict**: shell hash is necessary. cannot reuse extant `computeHash` for apply mode.

### question 2: could we use a shared utility for shell redirect?

**search**: does the codebase have a utility for "run command, write output to file"?

**found**: no. the codebase uses `execSync` directly everywhere.

**should we create one?**: no. that would be scope creep. a one-liner does not need a utility.

**verdict**: shell redirect is a single execSync call. no utility needed.

### question 3: could we use a shared utility for shell hash?

**search**: does the codebase have a utility for "compute hash via shell"?

**found**: no. the codebase uses node crypto everywhere.

**should we create one?**: no. that would be scope creep. we need shell hash only here.

**verdict**: shell hash is specific to apply mode here. no utility needed.

---

## question the two-codepath approach

r1 accepted two codepaths (plan mode vs apply mode). is this duplication?

| mode | diff capture | hash | size |
|------|--------------|------|------|
| plan | node buffer (maxBuffer) | node crypto | Buffer.byteLength |
| apply | shell redirect | shell hash | fs.statSync |

**are these duplicated mechanisms?**: no. they are different approaches for different constraints.

- plan mode: no file writes allowed, content in memory
- apply mode: files written, content not in memory

**could we unify?**: only by write + delete for plan mode (adds complexity).

**verdict**: two codepaths are justified by different constraints. not duplication.

---

## summary

| question | answer |
|----------|--------|
| use extant `computeHash` for apply? | no, reintroduces buffer |
| create shell redirect utility? | no, scope creep |
| create shell hash utility? | no, scope creep |
| are two codepaths duplication? | no, different constraints |

r2 confirms r1. no duplication in blueprint.
