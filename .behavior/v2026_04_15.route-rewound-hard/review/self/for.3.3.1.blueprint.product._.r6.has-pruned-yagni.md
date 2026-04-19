# self-review r6: has-pruned-yagni

tea first. then we proceed 🍵

---

## fix verification

in r5, I found one YAGNI violation:
- `archivePath` was returned from archiveStoneYield but never used

the blueprint has been updated. let me verify the fix.

---

## before (r5)

```typescript
): Promise<{
  outcome: 'archived' | 'absent';
  archivePath: string | null;  // ← YAGNI
}> => {
  ...
  if (!exists) return { outcome: 'absent', archivePath: null };
  ...
  return { outcome: 'archived', archivePath };
};
```

## after (current blueprint)

```typescript
): Promise<{
  outcome: 'archived' | 'absent';
}> => {
  ...
  if (!exists) return { outcome: 'absent' };
  ...
  return { outcome: 'archived' };
};
```

**fix verified:** `archivePath` removed from return type and return statements.

---

## why this was YAGNI

`archivePath` was added "just in case" someone might want to know where the file went.

but:
- the output format shows `yield = archived`, not the path
- tests assert on `outcome`, not `archivePath`
- the CLI user doesn't need to know the exact path
- if they need to find it, `.route/.archive/` is predictable

**lesson:** return what callers use, not what "might be useful."

---

## re-verify: no other YAGNI

after the fix, re-scan the blueprint:

| component | YAGNI? | evidence |
|-----------|--------|----------|
| `--yield drop\|keep` | no | criteria requirement |
| `--hard` alias | no | wish terminology |
| `--soft` alias | no | wish terminology |
| archive location | no | criteria requirement |
| collision timestamp | no | criteria requirement |
| cascade archival | no | wish requirement |
| archiveStoneYield.ts | no | needed for implementation |
| yieldOutcomes | no | needed for output |
| 5 error cases | no | pit-of-success |
| acceptance tests | no | wish requirement |
| unit tests | no | standard practice |

**all clean.** zero YAGNI remains.

---

## conclusion

YAGNI violation found in r5:
- `archivePath` return — unused, "just in case"

YAGNI violation fixed:
- removed from return type
- removed from return statements
- blueprint §4 now minimal

the blueprint is now YAGNI-clean. all components serve a purpose.

🦉 YAGNI found. YAGNI fixed. YAGNI verified. so it is.

