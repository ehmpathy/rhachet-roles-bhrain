# self-review: role-standards-coverage (round 7)

## the question

are all relevant mechanic role standards applied where they should be?

## method

r7.role-standards-adherance checked that code does NOT violate standards. this review checks that code APPLIES standards where applicable — proactive coverage, not just absence of violation.

---

## standards applied

### standard 1: readable.comments

**applied to setStoneAsApproved.ts**

the function has `.what` and `.why` jsdoc:

```typescript
/**
 * .what = marks a stone as approved by human
 * .why = enables human approval gates for milestones
 */
export const setStoneAsApproved = async (
```

**applied to formatRouteStoneEmit.ts**

the blocked branch has inline comment:

```typescript
if (input.action === 'blocked') {
  // header for blocked state
  lines.push('🦉 patience, friend.');
```

**conclusion:** standards applied. not just absent violation.

---

### standard 2: readable.narrative

**applied to setStoneAsApproved.ts**

code flows as flat narrative with early return:

```typescript
// reject if stone absent
if (!stoneMatched) {
  throw new BadRequestError('stone not found', { stone: input.stone });
}

// block if not human
if (!isHuman) {
  return {
    approved: false,
    emit: { ... },
  };
}

// set approval marker
await setStoneGuardApproval({ ... });
```

each block is a code paragraph with intent comment. no nested branches.

**conclusion:** narrative flow applied.

---

### standard 3: pitofsuccess.errors

**applied to setStoneAsApproved.ts**

early exit with BadRequestError:

```typescript
if (!stoneMatched) {
  throw new BadRequestError('stone not found', { stone: input.stone });
}
```

early return on !isHuman:

```typescript
if (!isHuman) {
  return {
    approved: false,
    emit: { ... },
  };
}
```

fail-fast pattern applied. error provides context via metadata.

**conclusion:** fail-fast applied.

---

### standard 4: evolvable.procedures

**applied to setStoneAsApproved.ts**

uses (input, context) pattern:

```typescript
export const setStoneAsApproved = async (
  input: {
    stone: string;
    route: string;
  },
  context: {
    isTTY: boolean;
  },
): Promise<{
```

arrow function, not function keyword. inline types, not separate interface.

**conclusion:** procedure pattern applied.

---

### standard 5: lang.tones (owl persona)

**applied to howto.drive-routes.[guide].md**

the brief has owl wisdom section:

```markdown
## the owl's wisdom 🌙

> read the stone messages carefully.
> when lost, run `rhx route.drive`.
> ...
> patience, friend. the way reveals itself. 🪷
```

uses owl emojis (🦉, 🌙, 🪷). lowercase prose. "patience, friend" phrase.

**applied to formatRouteStoneEmit.ts**

blocked message uses owl header:

```typescript
lines.push('🦉 patience, friend.');
```

**conclusion:** owl persona applied in both output and documentation.

---

### standard 6: lang.terms (noun_adj order)

**applied to setStoneAsApproved.ts**

variable names follow [noun][state] order:

- `stoneMatched` — not `matchedStone`
- `isHuman` — boolean predicate (acceptable)

**conclusion:** noun_adj order applied.

---

### standard 7: code.test.frames.behavior

**applied to test files**

tests use given/when/then from test-fns:

```typescript
given('[case1] scenario', () => {
  when('[t0] action', () => {
    then('outcome', async () => {
      // assertion
    });
  });
});
```

labels follow [caseN] and [tN] convention.

**conclusion:** bdd test pattern applied.

---

## standards not applicable

| standard | why not applicable |
|----------|-------------------|
| evolvable.domain.objects | no domain objects changed |
| code.test.scope.unit | no unit tests for formatRouteStoneEmit blocked branch (tested via integration) |
| work.flow.release | release workflow not part of this change |

---

## coverage summary

| standard | applied? | evidence |
|----------|----------|----------|
| readable.comments | ✓ | .what/.why on setStoneAsApproved |
| readable.narrative | ✓ | early returns, code paragraphs |
| pitofsuccess.errors | ✓ | BadRequestError, fail-fast |
| evolvable.procedures | ✓ | (input, context), arrow function |
| lang.tones.owl | ✓ | owl wisdom section, 🦉 header |
| lang.terms.noun_adj | ✓ | stoneMatched not matchedStone |
| code.test.frames.behavior | ✓ | given/when/then pattern |

---

## conclusion

all applicable mechanic role standards are actively applied, not just passively not violated.

the code:
- has .what/.why headers (not just absent errors)
- flows as narrative (not just absent else branches)
- fails fast with context (not just absent swallowed errors)
- uses proper procedure pattern (not just absent positional args)
- embodies owl persona (not just absent harsh tone)
- follows noun_adj order (not just absent reversed names)
- tests follow bdd pattern (not just absent random structure)

coverage is proactive, not just defensive.

