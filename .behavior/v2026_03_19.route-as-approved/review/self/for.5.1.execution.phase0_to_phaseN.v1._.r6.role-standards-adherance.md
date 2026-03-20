# self-review: role-standards-adherance (round 6)

## the question

does the code follow mechanic role standards correctly?

## step 1: enumerate relevant rule directories

based on the files changed, these mechanic brief categories apply:

| briefs directory | relevance |
|-----------------|-----------|
| `practices/code.prod/evolvable.procedures/` | procedure structure for setStoneAsApproved.ts |
| `practices/code.prod/readable.comments/` | .what/.why headers |
| `practices/code.prod/readable.narrative/` | code flow in formatRouteStoneEmit.ts |
| `practices/code.prod/pitofsuccess.errors/` | error messages |
| `practices/lang.terms/` | term usage, gerund avoidance |
| `practices/lang.tones/` | lowercase, owl persona |

categories NOT applicable:
- `practices/code.test/` — test files not modified
- `practices/work.flow/` — workflow tools not used
- `practices/code.prod/evolvable.domain.objects/` — no domain objects changed

## step 2: check each changed file

### file 1: setStoneAsApproved.ts

**rule: require.input-context-pattern**

```typescript
export const setStoneAsApproved = async (
  input: {
    stone: string;
    route: string;
  },
  context: {
    isTTY: boolean;
  },
): Promise<...>
```

✓ uses `(input, context)` pattern.

**rule: require.what-why-headers**

```typescript
/**
 * .what = marks a stone as approved by human
 * .why = enables human approval gates for milestones
 */
export const setStoneAsApproved = async (
```

✓ has `.what` and `.why` jsdoc.

**rule: forbid.gerunds**

scanned the file for -ing words:
- line 46: "as a driver, you should:" — no gerund
- all variable names: no gerunds

✓ no gerund violations.

**rule: forbid.else-branches**

```typescript
if (!isHuman) {
  return { ... };
}
// ... rest of function
```

✓ uses early return, no else.

**rule: prefer.lowercase**

- comments are lowercase
- string literals appropriate case for user display

✓ follows convention.

### file 2: formatRouteStoneEmit.ts

**rule: require.narrative-flow**

```typescript
if (input.action === 'blocked') {
  lines.push('🦉 patience, friend.');
  lines.push('');
  // ... format output
  return lines.join('\n');
}
```

✓ uses early return pattern, no else branches.

**rule: forbid.gerunds**

scanned added lines (287-299):
- no -ing words in variable names
- no -ing words in string literals

✓ no gerund violations.

**rule: require.what-why-headers**

the function already has its header comment at the top of file. no new functions introduced.

✓ not applicable to this change (we added a code branch, not a new function).

### file 3: howto.drive-routes.[guide].md

**rule: forbid.gerunds**

scanned the brief for -ing words:
- "accumulated" — not a gerund (past participle)
- no gerund nouns found

✓ no gerund violations.

**rule: prefer.lowercase**

- headings and body text are lowercase where appropriate
- proper nouns capitalized correctly

✓ follows convention.

**rule: owl persona (im_a.bhrain_owl.md)**

- uses owl wisdom section with 🦉 and 🌙 emojis
- "patience, friend" phrase matches owl persona
- 🪷 lotus emoji used appropriately

✓ follows owl persona standards.

### file 4: boot.yml

**rule: file structure**

```yaml
always:
  briefs:
    ref:
      - ...
    say:
      - briefs/howto.drive-routes.[guide].md
```

✓ follows extant structure with `say:` parallel to `ref:`.

## potential violations checked but not found

| rule | concern | check result |
|------|---------|--------------|
| forbid.io-as-domain-objects | guidance string as inline type | ✓ guidance is a plain string, not a domain object |
| forbid.undefined-attributes | input attributes | ✓ all attributes are required (no `?`) |
| require.single-responsibility | one purpose per file | ✓ no new files with multiple responsibilities |
| require.idempotent-procedures | side effects | ✓ setStoneAsApproved is idempotent (writes to passage.jsonl) |

## conclusion

all changed files adhere to mechanic role standards:

- `(input, context)` pattern: ✓
- `.what/.why` headers: ✓
- no gerunds: ✓
- no else branches: ✓
- lowercase convention: ✓
- owl persona: ✓
- extant structure patterns: ✓

no violations found.
