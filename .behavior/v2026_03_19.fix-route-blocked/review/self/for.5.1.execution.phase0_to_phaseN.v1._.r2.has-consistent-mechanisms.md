# self-review r2: has-consistent-mechanisms

review for new mechanisms that duplicate extant functionality.

---

## mechanisms reviewed

### 1. command variable pattern in tea pause

**new code:**
```typescript
const arrivedCmd = `rhx route.stone.set --stone ${input.stone} --as arrived`;
const passedCmd = `rhx route.stone.set --stone ${input.stone} --as passed`;
const blockedCmd = `rhx route.stone.set --stone ${input.stone} --as blocked`;
```

**extant pattern in same file (lines 419-420, 450):**
```typescript
const arrivedCmd = `rhx route.stone.set --stone ${input.stone} --as arrived`;
const passedCmd = `rhx route.stone.set --stone ${input.stone} --as passed`;
// ...
const blockedCmd = `rhx route.stone.set --stone ${input.stone} --as blocked`;
```

**verdict:** uses EXACT same pattern. no duplication — reuses extant mechanism.

---

### 2. tree format pattern

**new code:**
```typescript
lines.push(`🍵 tea first. then, choose your path.`);
lines.push(`   │`);
lines.push(`   ├─ you must choose one`);
lines.push(`   │  ├─ ready for review?`);
lines.push(`   │  │  └─ ${arrivedCmd}`);
```

**extant pattern in same file (lines 413-426):**
```typescript
lines.push(`🗿 route.drive`);
lines.push(`   ├─ where do we go?`);
lines.push(`   │  ├─ route = ${input.route}`);
lines.push(`   │  └─ stone = ${input.stone}`);
lines.push(`   │`);
```

**verdict:** uses EXACT same tree format:
- 3-space indentation per level
- `├─ └─ │` characters
- `lines.push()` method

no new mechanism — consistent with extant.

---

### 3. lines.push() accumulation pattern

**analysis:** the entire formatRouteDrive function uses `lines.push()` to accumulate output, then `lines.join('\n')` at the end.

**verdict:** tea pause uses SAME pattern. no new mechanism.

---

### 4. suggestBlocked guard pattern

**new code:**
```typescript
if (input.suggestBlocked) {
  // tea pause lines
}
```

**extant pattern (line 448):**
```typescript
if (input.suggestBlocked) {
  // show blocked option when stuck
  const blockedCmd = ...
}
```

**verdict:** reuses EXACT same guard pattern and same input property.

---

## search for extant utilities

**searched for:** formatRouteDrive utilities, tree formatters

**found:** formatRouteDriveNudge() at line 430 — separate function for nudge content

**analysis:** should tea pause be extracted to separate function?

**verdict:** no — tea pause is simpler than nudge (just lines.push). WET principle says wait for 3+ usages before extraction. only 1 usage for tea pause.

---

## summary

| mechanism | duplicates extant? | action |
|-----------|-------------------|--------|
| command variable pattern | no — exact match | none |
| tree format pattern | no — exact match | none |
| lines.push accumulation | no — exact match | none |
| suggestBlocked guard | no — exact match | none |
| separate function | n/a — not needed yet | none |

no duplication found. all mechanisms are consistent with extant patterns.
