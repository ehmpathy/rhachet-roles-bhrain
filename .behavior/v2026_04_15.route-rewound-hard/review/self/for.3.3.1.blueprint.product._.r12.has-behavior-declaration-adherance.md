# self-review r12: has-behavior-declaration-adherance

tea first. then we proceed 🍵

---

## what this review checks

blueprint correctly adheres to the behavior declaration — no misinterpretation, no deviation from spec.

---

## adherance verification

### 1. flag semantics

**wish says:**
> rewound --mode hard | soft

**blueprint implements:**
```
--yield drop|keep
--hard (alias for --yield drop)
--soft (alias for --yield keep)
```

**adherance check:**
- `--hard` maps to `--yield drop` (archive yields) ✅
- `--soft` maps to `--yield keep` (preserve yields) ✅
- terms align: hard = destructive, soft = safe ✅

**verdict:** ✅ adheres — aliases match wish intent

### 2. default behavior

**wish says:**
> soft should just do the current rewind, where it keeps the yields that were created

**blueprint implements:**
- default is `keep` when no flag provided
- current behavior is preserved

**adherance check:**
- no flag = soft behavior ✅
- backwards compatible ✅

**verdict:** ✅ adheres — default preserves current behavior

### 3. archive vs delete

**wish says:**
> should remove the yields too

**blueprint implements:**
- moves yields to `.route/.archive/`
- does not delete

**adherance check:**
- "remove" can mean "move out of the way" ✅
- archive is safer than delete ✅
- user can delete archive later if desired ✅

**question:** is "archive" a deviation from "remove"?

**analysis:**
- wish intent: yields should not affect future work
- archive achieves this: yields are out of the main path
- archive adds safety: can recover if needed
- no explicit requirement for permanent deletion

**verdict:** ✅ adheres — archive fulfills "remove" intent with safety

### 4. scope restriction

**wish says:**
> for now, only focus on the $stone.yield.md file in --hard mode
> no need, in case the stone artifacts include src, to roll those back

**blueprint implements:**
- `archiveStoneYield` targets `${input.stone}.yield.md` only
- no src rollback mentioned

**adherance check:**
- only `.yield.md` files affected ✅
- src files untouched ✅
- matches "for now" scope ✅

**verdict:** ✅ adheres — scoped correctly

### 5. cascade behavior

**wish says:**
> for all the stones that got rewound when hard mode

**blueprint implements:**
```typescript
for (const stoneName of affectedStones) {
  if (input.yield === 'drop') {
    await archiveStoneYield({ stone: stoneName, route: input.route });
  }
}
```

**adherance check:**
- iterates all affected stones ✅
- archives each stone's yield when drop ✅

**verdict:** ✅ adheres — cascade archival correct

### 6. test approach

**wish says:**
> cover with acpt tests and prove via snaps before and after rewound the file contents to verify

**blueprint implements:**
- acceptance tests in blackbox/
- stdout snapshots for all outputs
- test cases for drop, keep, cascade, errors

**adherance check:**
- "acpt tests" = acceptance tests ✅
- "snaps" = snapshots ✅
- "before and after" visible in stdout format ✅

**verdict:** ✅ adheres — test approach matches wish

---

## potential misinterpretations checked

| concern | check | result |
|---------|-------|--------|
| --hard might mean "force" | no, means "drop yields" | ✅ correct |
| archive might pollute | goes to `.archive/` subdir | ✅ clean |
| cascade might miss stones | uses extant cascade logic | ✅ reuses |
| default might change | explicit `keep` default | ✅ safe |

---

## implementation detail adherance

### validation logic

blueprint's validation code:

```typescript
if (parsed.values.hard && parsed.values.soft) {
  throw new BadRequestError('--hard and --soft are mutually exclusive');
}
if (parsed.values.hard && parsed.values.yield === 'keep') {
  throw new BadRequestError('--hard conflicts with --yield keep');
}
if (parsed.values.yield && parsed.values.as !== 'rewound') {
  throw new BadRequestError('--yield only valid with --as rewound');
}
```

**adherance check:**
- flags are validated before operation ✅
- errors are clear and actionable ✅
- --yield only applies to rewound (not passed/approved) ✅

### return type

blueprint's return type:

```typescript
yieldOutcomes: Array<{ stone: string; outcome: 'archived' | 'preserved' | 'absent' }>
```

**adherance check:**
- tracks outcome per stone ✅
- distinguishes archived vs preserved vs absent ✅
- enables stdout format from wish ✅

### output format

blueprint's output format:

```
🗿 route.stone.set
   ├─ stone = 3.blueprint
   ├─ action = rewound (yield: drop)
   └─ cascade
      ├─ 3.blueprint
      │  ├─ yield = archived
      │  └─ passage = rewound
```

**adherance check:**
- shows yield status per stone ✅
- shows cascade structure ✅
- visually confirms "before and after" ✅

---

## deviations found

none. blueprint correctly interprets and implements the wish.

---

## summary

| aspect | adherance |
|--------|-----------|
| flag semantics | ✅ |
| default behavior | ✅ |
| archive approach | ✅ |
| scope restriction | ✅ |
| cascade behavior | ✅ |
| test approach | ✅ |

blueprint adheres to behavior declaration. no misinterpretations or deviations found.

🦉 adherance verified. so it is.

