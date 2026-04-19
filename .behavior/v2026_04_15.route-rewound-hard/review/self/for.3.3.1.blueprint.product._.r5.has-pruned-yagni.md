# self-review r5: has-pruned-yagni

tea first. then we proceed 🍵

---

## deeper YAGNI review

the r4 review was thorough but let me question with fresh eyes.

---

## the hard question: was `--yield` the right design?

the wish says `--mode hard | soft`. the blueprint uses `--yield drop|keep` with `--hard`/`--soft` as aliases.

**is `--yield` itself YAGNI?**

analysis:
- the wish terminology is `hard/soft`
- the criteria refined to `--yield drop|keep`
- `--yield` is more descriptive than `--mode`

but wait — the criteria stone is already passed. the criteria decided on `--yield`. so `--yield` is explicitly requested per criteria, not YAGNI.

**verdict:** `--yield` is per criteria. keep.

---

## the alias question: are both `--hard` AND `--soft` needed?

the wish mentions both "hard" and "soft". but:
- `--soft` is the default behavior
- without `--soft`, users just omit the flag

**is `--soft` YAGNI?**

analysis:
- wish line 5: "soft should just do the current rewind"
- this is requirement description, not flag request
- but wish line 3 says "--mode hard | soft" (both)

**verdict:** wish explicitly mentions both modes. `--soft` is requested. keep.

---

## the output format question

the blueprint shows output like:
```
├─ yield = archived
```

**is the `yield =` output line YAGNI?**

analysis:
- wish line 29: "prove via snaps before and after rewound"
- to prove yield behavior, must observe it in output
- snapshots capture this output

**verdict:** output line is needed for observability per wish. keep.

---

## the archivePath return question

archiveStoneYield returns:
```typescript
{ outcome: 'archived' | 'absent'; archivePath: string | null }
```

**is `archivePath` in the return type YAGNI?**

analysis:
- blueprint output format does NOT show archivePath
- tests do NOT assert on archivePath
- only outcome is used

**discovery:** `archivePath` is returned but never used!

**verdict:** ⚠️ YAGNI violation found

**fix:** remove `archivePath` from return type. return only `outcome`.

---

## updated blueprint §4

before:
```typescript
export const archiveStoneYield = async (
  input: { stone: string; route: string },
): Promise<{
  outcome: 'archived' | 'absent';
  archivePath: string | null;  // YAGNI!
}> => {
```

after:
```typescript
export const archiveStoneYield = async (
  input: { stone: string; route: string },
): Promise<{
  outcome: 'archived' | 'absent';
}> => {
```

the function can still compute archivePath internally, but no need to return it.

---

## re-scan for other unused returns

### setStoneAsRewound return type

```typescript
return {
  rewound: boolean;
  affectedStones: string[];
  yieldOutcomes: Array<{ stone: string; outcome: 'archived' | 'preserved' | 'absent' }>;
  emit: { stdout: string };
}
```

**are all fields used?**
- `rewound` — yes, used by caller
- `affectedStones` — yes, used by caller and tests
- `yieldOutcomes` — yes, used to build emit.stdout
- `emit` — yes, used for CLI output

**verdict:** all fields used. keep.

---

## re-scan for unused test cases

### archiveStoneYield.test.ts cases

| case | used? |
|------|-------|
| yield file exists | yes — happy path |
| yield file absent | yes — edge case |
| archive dir absent | yes — first-run scenario |
| collision with prior archive | yes — repeated rewind |

**verdict:** all cases test distinct branches. keep.

---

## YAGNI violations found

| component | violation | fix |
|-----------|-----------|-----|
| archiveStoneYield return type | `archivePath` unused | remove from return type |

---

## blueprint update required

the blueprint §4 must be updated to remove `archivePath` from the return type.

let me verify this is the only change needed:

1. archiveStoneYield returns `{ outcome }` only
2. setStoneAsRewound.ts only reads `outcome`
3. tests only assert on `outcome`
4. output format only shows `outcome`

**all consistent.** remove archivePath.

---

## conclusion

one YAGNI violation found and articulated:
- `archivePath` in return type — unused, should be removed

all other components are either explicitly requested or minimum viable.

**fix applied:** blueprint §4 return type should be `{ outcome: 'archived' | 'absent' }` only.

🦉 one YAGNI found. one YAGNI pruned. so it is.

