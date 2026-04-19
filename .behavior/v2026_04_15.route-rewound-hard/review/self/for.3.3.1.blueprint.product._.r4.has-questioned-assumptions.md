# self-review r4: has-questioned-assumptions

tea first. then we proceed 🍵

---

## deeper review

the prior review surfaced 10 assumptions. let me question assumptions that may have been missed.

---

## assumption #11: yield file is always at route root

**the assumption:** yield files live at `$route/$stone.yield.md`

**what if the opposite were true?**
- yields in `.route/`? → would require different glob
- yields nested by phase? → more complex structure

**evidence:**
- codebase shows yields at route root
- wish says "$stone.yield.md" without path qualifier
- simpler location for driver to find

**verdict:** ✅ assumption holds — matches extant convention

---

## assumption #12: only one yield file per stone

**the assumption:** each stone has at most one yield file

**what if the opposite were true?**
- multiple yields per stone? → `$stone.yield.1.md`, `$stone.yield.2.md`?
- different yield types? → `$stone.yield.review.md`, `$stone.yield.impl.md`?

**evidence:**
- wish: "the $stone.yield.md file" (singular)
- no extant pattern for multiple yields
- route-driven workflow produces one yield per pass

**verdict:** ✅ assumption holds — singular per wish

---

## assumption #13: archive dir can be created recursively

**the assumption:** `fs.mkdir(archiveDir, { recursive: true })` works

**what if the opposite were true?**
- permission denied? → would error, appropriate
- path collision with file? → would error, appropriate

**evidence:**
- `.route/` dir already exists (route requires it)
- recursive mkdir is standard pattern
- delStoneGuardArtifacts uses same approach

**verdict:** ✅ assumption holds — standard pattern

---

## assumption #14: timestamp format ISO with dashes

**the assumption:** collision timestamp uses `new Date().toJSON().replace(/[:.]/g, '-')`

**what if the opposite were true?**
- unix timestamp? → less readable, but unique
- uuid? → overkill, not time-sortable
- counter? → requires directory scan

**evidence:**
- ISO is human-readable and sortable
- replace of : and . avoids filename issues on some filesystems
- delStoneGuardArtifacts uses same pattern

**verdict:** ✅ assumption holds — human-readable, sortable

---

## assumption #15: error messages are English

**the assumption:** error messages like "--hard and --soft are mutually exclusive" are English

**what if the opposite were true?**
- i18n? → not needed for CLI tool
- codes instead of strings? → less helpful for users

**evidence:**
- all extant CLI errors are English
- target audience is developers
- no i18n infrastructure in codebase

**verdict:** ✅ assumption holds — matches extant convention

---

## assumption #16: outcome values are 'archived' | 'preserved' | 'absent'

**the assumption:** yieldOutcome uses these three values

**what if the opposite were true?**
- boolean (archived: true/false)? → loses 'absent' case
- more granular? → not needed

**evidence:**
- three cases are mutually exclusive and exhaustive:
  1. yield existed and was archived → 'archived'
  2. yield existed and was kept → 'preserved'
  3. yield did not exist → 'absent'

**verdict:** ✅ assumption holds — exhaustive, mutually exclusive

---

## assumption #17: validation before archive

**the assumption:** flag validation happens before any archive operations

**what if the opposite were true?**
- validate in archive loop? → could partial archive before error
- async validation? → not needed

**evidence:**
- fail-fast principle: validate all input before side effects
- extant pattern in route.ts: parseArgs → validate → dispatch

**verdict:** ✅ assumption holds — fail fast

---

## assumption #18: single archive operation per yield

**the assumption:** each yield is archived in one operation (rename)

**what if the opposite were true?**
- copy-on-write? → more complex, less atomic
- compression? → overkill for small files

**evidence:**
- rename is atomic on same filesystem
- yields are typically small markdown files
- simpler is better

**verdict:** ✅ assumption holds — simple, atomic

---

## cross-reference with implementation details

let me verify the blueprint's code snippets:

### §1 cli flag parse

```typescript
yield: { type: 'string' },   // 'keep' | 'drop'
hard: { type: 'boolean' },
soft: { type: 'boolean' },
```

**assumption:** string for yield, boolean for hard/soft
**verification:** makes sense — yield has values, hard/soft are flags

### §3 setStoneAsRewound

```typescript
if (input.yield === 'drop') {
  const yieldResult = await archiveStoneYield({ stone: stoneName, route: input.route });
  yieldOutcomes.push({ stone: stoneName, outcome: yieldResult.outcome });
}
```

**assumption:** archive only on 'drop', not 'keep'
**verification:** correct — 'keep' preserves, 'drop' archives

### §4 archiveStoneYield

```typescript
await fs.rename(yieldPath, archivePath);
```

**assumption:** rename works cross-directory within same filesystem
**verification:** yes — route and .route/.archive/ are same filesystem

---

## new assumptions found: 8

| # | assumption | evidence | holds? |
|---|------------|----------|--------|
| 11 | yield at route root | extant convention | ✅ |
| 12 | one yield per stone | wish (singular) | ✅ |
| 13 | recursive mkdir | standard pattern | ✅ |
| 14 | ISO timestamp format | human-readable | ✅ |
| 15 | English errors | extant convention | ✅ |
| 16 | three outcome values | exhaustive | ✅ |
| 17 | validation before archive | fail fast | ✅ |
| 18 | single rename per yield | atomic, simple | ✅ |

---

## total assumptions questioned: 18

combined with prior review (10) and this review (8) = 18 total

all 18 assumptions hold based on evidence from:
- wish/criteria requirements
- extant codebase patterns
- safety and correctness principles

---

## conclusion

no hidden assumptions based on habit alone. all 18 are grounded in evidence.

🦉 assumptions questioned deep. all hold. so it is.

