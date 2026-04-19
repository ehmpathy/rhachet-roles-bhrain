# self-review r8: has-consistent-mechanisms

tea first. then we proceed 🍵

---

## what this review checks

new mechanisms in the blueprint should not duplicate extant functionality.

---

## mechanisms in archiveStoneYield

the blueprint proposes these mechanisms in `archiveStoneYield.ts`:

| mechanism | purpose |
|-----------|---------|
| `fs.access` | check if yield file exists |
| `fs.mkdir(..., { recursive: true })` | create .route/.archive/ |
| `fs.rename` | move file to archive |
| timestamp suffix | handle collision with prior archive |

---

## search for extant patterns

### fs.access pattern

found in: `delStoneGuardArtifacts.ts:25-34`

```typescript
try {
  await fs.access(routeDir);
} catch {
  return { ... };
}
```

**blueprint proposes:**
```typescript
const exists = await fs.access(yieldPath).then(() => true).catch(() => false);
if (!exists) return { outcome: 'absent' };
```

**verdict:** ✅ matches extant pattern

### fs.mkdir pattern

found in: `findsertRouteGitignore.ts:22`

```typescript
await fs.mkdir(routeDir, { recursive: true });
```

**blueprint proposes:**
```typescript
const archiveDir = path.join(input.route, '.route', '.archive');
await fs.mkdir(archiveDir, { recursive: true });
```

**verdict:** ✅ matches extant pattern

### fs.rename pattern

search result: no extant `fs.rename` usage in codebase

**blueprint proposes:**
```typescript
await fs.rename(yieldPath, archivePath);
```

**verdict:** ✅ new mechanism, not a duplicate (archival is new feature)

### timestamp suffix pattern

search result: no extant timestamp suffix collision pattern in codebase

**blueprint proposes:**
```typescript
if (archiveExists) {
  const timestamp = new Date().toJSON().replace(/[:.]/g, '-');
  archivePath = path.join(archiveDir, `${baseName}.${timestamp}`);
}
```

**verdict:** ✅ new mechanism, unique to archival collision handle

---

## could any be replaced with extant?

| mechanism | extant alternative? | decision |
|-----------|-------------------|----------|
| fs.access pattern | n/a — already matches extant | keep |
| fs.mkdir pattern | n/a — already matches extant | keep |
| fs.rename | none found | keep (new feature) |
| timestamp suffix | none found | keep (new feature) |

---

## why not enumFilesFromGlob?

`delStoneGuardArtifacts` uses `enumFilesFromGlob` to find files by pattern.

**question:** should `archiveStoneYield` use `enumFilesFromGlob` instead of `fs.access`?

**analysis:**
- yield path is known: `${input.stone}.yield.md` — not a pattern
- single file, not multiple files
- `enumFilesFromGlob` is for pattern-based search
- `fs.access` is simpler for known single file

**verdict:** ✅ `fs.access` is appropriate for single known file

---

## new utilities created?

the blueprint creates `archiveStoneYield.ts` — a new communicator.

**question:** should this be a general utility in `@src/utils/` instead?

**analysis:**
- the function is specific to route/stone yield files
- it uses route-specific paths (`.route/.archive/`)
- the collision logic is specific to stone archival
- general file archival would have different requirements

**verdict:** ✅ domain-specific function is appropriate, not a candidate for extraction

---

## conclusion

| mechanism | status |
|-----------|--------|
| fs.access | matches extant pattern |
| fs.mkdir | matches extant pattern |
| fs.rename | new, no duplicate |
| timestamp suffix | new, no duplicate |

no duplication found. all mechanisms either:
1. match extant patterns (consistency ✅)
2. are new features unique to archival (no extant equivalent)

🦉 mechanisms reviewed. consistent with extant patterns. so it is.

