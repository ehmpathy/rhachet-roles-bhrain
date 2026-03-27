# self-review r3: has-consistent-mechanisms

## step back and breathe

r1 and r2 found no duplication. let me look at this from a different angle.

---

## invert the question: what extant patterns should I follow?

instead of "does this duplicate?", ask "what patterns should this match?"

### pattern 1: how does the codebase handle shell commands?

**search**: how is `execSync` used elsewhere?

**patterns found**:
- `execSync('git command', { cwd, encoding: 'utf-8' })` — common pattern
- no `maxBuffer` usage anywhere — new for this fix

**does blueprint follow this pattern?**: yes. blueprint uses `execSync` with `cwd` and `encoding`.

### pattern 2: how does the codebase handle file writes?

**search**: how is `fs.writeFileSync` used?

**patterns found**:
- `fs.writeFileSync(path, content)` — direct write
- `fs.mkdirSync(dir, { recursive: true })` — ensure directory first

**does blueprint follow this pattern?**: yes. blueprint ensures directory with `mkdirSync` before shell redirect.

### pattern 3: how does the codebase handle hashes?

**search**: how are hashes computed?

**patterns found**:
- `createHash('sha256').update(content).digest('hex')` — node crypto
- no shell-based hash

**does blueprint follow this pattern?**: partially.
- plan mode: follows pattern (node crypto)
- apply mode: new pattern (shell hash)

**why apply mode diverges**: content is in files, not memory. shell hash is appropriate for content in files.

---

## conclusion

| pattern | followed? | notes |
|---------|-----------|-------|
| execSync usage | yes | adds maxBuffer for plan mode |
| file writes | yes | mkdirSync then shell redirect |
| hash | partially | plan mode follows, apply mode uses shell |

apply mode divergence (shell hash) is justified:
- content is in files, not memory
- shell hash avoids read-back into memory
- consistent with "avoid node buffer" goal

---

## summary

r3 examined patterns the blueprint should follow:
- follows execSync pattern (with maxBuffer addition)
- follows file write pattern (ensure dir, then write)
- diverges from hash pattern in apply mode (justified)

no duplication. blueprint is consistent with codebase patterns.
