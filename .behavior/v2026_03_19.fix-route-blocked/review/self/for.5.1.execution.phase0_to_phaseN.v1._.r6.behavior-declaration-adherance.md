# self-review r6: behavior-declaration-adherance

deep dive review of code vs specification.

---

## stepRouteDrive.ts line-by-line analysis

re-read lines 411-431 carefully:

### line 411: comment

```typescript
// tea pause for stuck drivers (same trigger as suggestBlocked)
```

**check:** comment accurately describes purpose and trigger.
**verdict:** adherant.

### line 412: guard condition

```typescript
if (input.suggestBlocked) {
```

**vision requirement:** "tea pause appears at TOP after count > N (same trigger as bottom message)"
**criteria requirement:** "when count > N, tea pause section appears"
**code fact:** `suggestBlocked` is set when `count > 5` (verified in formatRouteDrive call site)
**verdict:** adherant — same trigger as bottom message.

### lines 413-415: command variables

```typescript
const arrivedCmd = `rhx route.stone.set --stone ${input.stone} --as arrived`;
const passedCmd = `rhx route.stone.set --stone ${input.stone} --as passed`;
const blockedCmd = `rhx route.stone.set --stone ${input.stone} --as blocked`;
```

**criteria requirement:** "shows all three options: arrived, passed, blocked"
**check:** all three commands are defined.
**verdict:** adherant.

### line 416: tea pause header

```typescript
lines.push(`🍵 tea first. then, choose your path.`);
```

**vision requirement:** vision example shows `🍵 tea first. then, choose your path.`
**check:** exact text match.
**verdict:** adherant.

### lines 417-426: tree structure with options

```typescript
lines.push(`   │`);
lines.push(`   ├─ you must choose one`);
lines.push(`   │  ├─ ready for review?`);
lines.push(`   │  │  └─ ${arrivedCmd}`);
lines.push(`   │  │`);
lines.push(`   │  ├─ ready to continue?`);
lines.push(`   │  │  └─ ${passedCmd}`);
lines.push(`   │  │`);
lines.push(`   │  └─ blocked and need help?`);
lines.push(`   │     └─ ${blockedCmd}`);
```

**blueprint requirement:** exact tree format with 3-space indent
**check:** 3-space indent verified, tree structure matches blueprint
**verdict:** adherant.

### lines 427-429: mandate

```typescript
lines.push(`   │`);
lines.push(`   └─ ⚠️ to refuse is not an option.`);
lines.push(`      work on the stone, or mark your status.`);
```

**vision requirement:** mandate: "to refuse is not an option"
**criteria requirement:** "shows mandate"
**check:** exact text match.
**verdict:** adherant.

### line 430: final blank line

```typescript
lines.push('');
```

**check:** consistent with extant pattern (blank line after sections)
**verdict:** adherant.

---

## stepRouteDrive.test.ts line-by-line analysis

### [case7] structure

```typescript
given('[case7] tea pause after 5+ hooks', () => {
```

**blueprint requirement:** "[case7] tea pause tests"
**check:** exact name match.
**verdict:** adherant.

### [t0] fewer than 6 hooks

```typescript
when('[t0] fewer than 6 hooks triggered', () => {
  then('output does NOT contain tea pause', async () => {
    for (let i = 0; i < 3; i++) {
      await stepRouteDrive({ route: scene.tempDir, mode: 'hook' });
    }
    const result = await stepRouteDrive({...});
    expect(result.emit?.stdout).not.toContain('tea first');
    expect(result.emit?.stdout).not.toContain('to refuse is not an option');
    expect(result.emit?.stdout).toContain('are you here?');
  });
});
```

**criteria requirement:** "when count <= N, tea pause does NOT appear"
**check:** test verifies tea pause absent when count <= 5
**check:** test verifies standard prompt still shown
**verdict:** adherant.

### [t1] 6 or more hooks

```typescript
when('[t1] 6 or more hooks triggered', () => {
  then('output contains tea pause with all three options', async () => {
    for (let i = 0; i < 2; i++) {
      await stepRouteDrive({ route: scene.tempDir, mode: 'hook' });
    }
    const result = await stepRouteDrive({...});
    expect(result.emit?.stdout).toContain('tea first');
    expect(result.emit?.stdout).toContain('choose your path');
    expect(result.emit?.stdout).toContain('--as arrived');
    expect(result.emit?.stdout).toContain('--as passed');
    expect(result.emit?.stdout).toContain('--as blocked');
    expect(result.emit?.stdout).toContain('to refuse is not an option');
    expect(result.emit?.stdout).toContain('work on the stone');
  });
});
```

**criteria requirement:** "when count > N, tea pause appears with all three options and mandate"
**check:** all assertions present for header, options, and mandate
**verdict:** adherant.

### [t2] snapshot

```typescript
when('[t2] tea pause snapshot', () => {
  then('output matches snapshot', async () => {...});
});
```

**blueprint requirement:** "vibecheck snapshot"
**check:** snapshot test captures visual format
**verdict:** adherant.

---

## route.stone.set.sh line-by-line analysis

### header block (lines 1-25)

**vision requirement:** "skill header documents all status options"
**criteria requirement:** "skill header documents --as arrived, --as passed, --as blocked"

**verified contents:**
- line 6-9: four status options with descriptions
- line 12-15: four usage examples
- line 18-24: options section with all four values explained

**verdict:** adherant — exceeds criteria (includes `approved` which is valid extant status).

---

## boot.yml line-by-line analysis

### structure (lines 1-10)

```yaml
always:
  briefs:
    ref:
      - ...
  skills:
    say:
      - skills/route.stone.set.sh
```

**vision requirement:** "boot.yml shows skill via `say`"
**blueprint requirement:** exact yaml structure with `skills.say`

**check:** structure matches blueprint exactly
**verdict:** adherant.

---

## summary of adherance check

| file | lines checked | issues found | adherant? |
|------|---------------|--------------|-----------|
| stepRouteDrive.ts | 411-431 | 0 | yes |
| stepRouteDrive.test.ts | 351-419 | 0 | yes |
| route.stone.set.sh | 1-28 | 0 | yes |
| boot.yml | 1-10 | 0 | yes |

no deviations from specification found.

