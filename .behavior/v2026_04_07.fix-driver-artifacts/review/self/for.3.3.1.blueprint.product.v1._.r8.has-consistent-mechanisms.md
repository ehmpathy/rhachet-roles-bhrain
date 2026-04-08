# self-review r8: has-consistent-mechanisms

## verdict: pass

## deeper examination: similar patterns found

r7 searched for extant mechanisms. r8 found similar PATTERNS in `getAllStones.ts`.

### found: priority-ordered iteration pattern

**extant `extractStoneName`** (getAllStones.ts:56-65):
```typescript
const extensions = ['.src.stone', '.stone', '.src'];
for (const ext of extensions) {
  if (input.filename.endsWith(ext)) {
    return input.filename.slice(0, -ext.length);
  }
}
return input.filename;
```

**extant `findGuardPath`** (getAllStones.ts:71-90):
```typescript
const guardVariants = [`${stoneName}.guard`, ...];
for (const guardFile of guardVariants) {
  if (fs.existsSync(fullPath)) {
    return guardFile;
  }
}
return null;
```

**proposed `asArtifactByPriority`**:
```typescript
const patterns = [{ suffix: '.yield.md', priority: 1 }, ...];
for (const pattern of patterns) {
  const match = input.artifacts.find(a => a.endsWith(pattern.suffix));
  if (match) return match;
}
return input.artifacts.find(a => a.endsWith('.md')) ?? null;
```

### analysis: same pattern, different mechanism

| aspect | extractStoneName | findGuardPath | asArtifactByPriority |
|--------|------------------|---------------|---------------------|
| input | single string | stone name | array of strings |
| check | suffix match | file exists | array.find + suffix |
| return | transformed input | matched path | matched item |
| fallback | original input | null | first .md or null |

the PATTERN is the same: priority-ordered iteration with early return.

the MECHANISM differs:
- `extractStoneName` = single string suffix extraction
- `findGuardPath` = file system existence check
- `asArtifactByPriority` = array selection by suffix

### question: should we generalize?

a generic utility could be:
```typescript
const selectByPrioritySuffix = <T>(items: T[], ...) => {...}
```

**reasons NOT to generalize:**

1. **scope creep** - the ask is to add yield support, not refactor
2. **different returns** - extractStoneName returns transformed value, others return matched item
3. **different inputs** - single string vs array vs file system
4. **WET principle** - wait for third similar usecase before abstraction

### conclusion

the blueprint uses a PATTERN consistent with extant code (`extractStoneName`, `findGuardPath`). the MECHANISM is new because it operates on arrays from glob results, which no extant function does.

**no duplication** - the new transformer fills a gap (array selection by priority suffix) that extant mechanisms don't address. the pattern reuse is GOOD consistency, not duplication.
