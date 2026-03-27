# self-review r4: has-consistent-conventions

## step back and breathe

r1-r3 all clear. one more angle: what would a code reviewer flag?

---

## reviewer angle: would they flag any names?

### `MAX_BUFFER` — would reviewer flag?

**concern**: is "MAX" the right prefix?

**alternatives**:
- `BUFFER_SIZE` — describes what, not limit
- `MAX_BUFFER_SIZE` — redundant "size"
- `PLAN_MODE_BUFFER` — too specific

**extant pattern**: `BUFSIZE` exists in codebase (short form).

**verdict**: `MAX_BUFFER` is clear and follows pattern. no flag.

### `combinedHash` — would reviewer flag?

**concern**: is "combined" clear about what is combined?

**context**: it is the hash of `staged + unstaged` content.

**alternatives**:
- `patchesHash` — more specific
- `diffHash` — also clear

**verdict**: `combinedHash` is acceptable in context. no flag needed.

---

## reviewer angle: would they flag any patterns?

### shell redirect pattern — would reviewer flag?

**concern**: shell redirect instead of node write is unusual.

**justification**: this IS the fix. node buffer was the problem.

**verdict**: no flag. this is intentional and documented.

### shell hash pattern — would reviewer flag?

**concern**: shell hash instead of node crypto is unusual.

**justification**: content is in file, not memory. shell hash avoids read-back.

**verdict**: no flag. this is intentional and documented.

---

## reviewer angle: inconsistencies between plan and apply modes?

| aspect | plan mode | apply mode |
|--------|-----------|------------|
| diff capture | node buffer | shell redirect |
| hash | node crypto | shell hash |
| size | Buffer.byteLength | fs.statSync |

**are these inconsistent?**: no. they are different approaches for different constraints.

- plan mode: no file writes
- apply mode: files written

**verdict**: not inconsistent. different constraints, different approaches.

---

## summary

r4 examined from reviewer perspective:
- names are clear and follow patterns
- new patterns are justified and documented
- mode differences are explained by constraints

no convention divergence found.
