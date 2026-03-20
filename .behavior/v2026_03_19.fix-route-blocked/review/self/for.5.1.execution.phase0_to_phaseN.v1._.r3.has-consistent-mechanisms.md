# self-review r3: has-consistent-mechanisms

fresh pass on mechanism consistency.

---

## deep dive: search for related codepaths

### grep for tree format patterns

searched: `lines.push.*├─` in stepRouteDrive.ts

found extant usages:
- line 413: `lines.push(\`   ├─ where do we go?\`);`
- line 421: `lines.push(\`   ├─ are you here?\`);`
- line 434: `lines.push(\`   ├─ here's the stone\`);`
- line 451: `lines.push(\`   ├─ are you here?\`);`

tea pause uses same pattern:
- `lines.push(\`   ├─ you must choose one\`);`

**verdict:** consistent.

---

### grep for command template patterns

searched: `const.*Cmd.*rhx route.stone.set`

found extant usages:
- line 419: `const arrivedCmd = \`rhx route.stone.set...\``
- line 420: `const passedCmd = \`rhx route.stone.set...\``
- line 450: `const blockedCmd = \`rhx route.stone.set...\``

tea pause declares same variables inside its scope:
```typescript
const arrivedCmd = `rhx route.stone.set --stone ${input.stone} --as arrived`;
const passedCmd = `rhx route.stone.set --stone ${input.stone} --as passed`;
const blockedCmd = `rhx route.stone.set --stone ${input.stone} --as blocked`;
```

**note:** the extant arrivedCmd/passedCmd at lines 419-420 are OUTSIDE the `if (input.suggestBlocked)` block. tea pause defines its OWN copies inside the if block. this is correct — scoped to the block where used.

**verdict:** consistent pattern, correct scope.

---

### grep for suggestBlocked usage

searched: `suggestBlocked` in stepRouteDrive.ts

found:
- line 403: `suggestBlocked: boolean` in input type
- line 448: `if (input.suggestBlocked) {` — bottom prompt variation

tea pause uses same input property:
- `if (input.suggestBlocked) {` — tea pause section

**verdict:** consistent.

---

## question: why not extract to function?

formatRouteDriveNudge() exists at ~line 470 and is called at line 430.

should tea pause be extracted similarly?

**analysis:**
- formatRouteDriveNudge returns string[] (11 lines)
- tea pause is 16 lines of `lines.push()` calls
- nudge is called once, tea pause is called once
- neither is reused elsewhere

**verdict:** WET principle — wait for 3+ usages. to extract now would be premature. both nudge and tea pause could be refactored together later if a pattern emerges.

---

## summary

| check | result |
|-------|--------|
| tree format pattern | consistent |
| command template pattern | consistent |
| suggestBlocked guard | consistent |
| separate function needed? | no — WET principle |

all mechanisms consistent with extant code.
