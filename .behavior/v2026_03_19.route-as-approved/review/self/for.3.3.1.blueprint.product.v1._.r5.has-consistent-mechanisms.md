# self-review: has-consistent-mechanisms (round 5)

## deep mechanism consistency review

the guide asks: "review for new mechanisms that duplicate extant functionality."

---

## step 1: codebase search for related patterns

### searched for: guidance patterns

```bash
grep -r "guidance:" src/
```

**found:**
- `formatRouteStoneEmit.ts:56`: `guidance: string;` (type definition)
- `setStoneAsApproved.ts:46`: `guidance: 'please ask a human to run this command'` (current value)

**conclusion:** the `guidance` field is an extant mechanism. the blueprint proposes to change its VALUE, not add a new mechanism.

### searched for: header patterns

```bash
grep -r "HEADER_" src/domain.operations/route/
grep -r "patience.*friend" src/
```

**found constants:**
- `formatRouteStoneEmit.ts:15`: `const HEADER_GET = '🦉 and then?';`
- `formatRouteStoneEmit.ts:16`: `const HEADER_SET = '🦉 the way speaks for itself';`
- `formatRouteStoneEmit.ts:17`: `const HEADER_DEL = '🦉 hoo needs 'em';`

**found inline headers:**
- `route.ts:1146`: `'🦉 patience, friend',` (inline, no constant)
- `formatPatienceFriend.ts:16`: `lines.push(\`🗿 patience, friend\`);` (inline, no constant)

**conclusion:** the codebase uses BOTH constants (for operation-level headers) AND inline strings (for context-specific headers). the blueprint follows the inline pattern.

### searched for: brief name patterns

```bash
ls src/domain.roles/driver/briefs/
```

**found:**
- `define.routes-are-gardened.[philosophy].md`
- `howto.create-routes.[ref].md`
- `im_a.bhrain_owl.md`
- `research.importance-of-focus.[philosophy].md`

**conclusion:** the codebase uses `howto.*.md` pattern. the blueprint follows this pattern.

---

## step 2: mechanism-by-mechanism consistency analysis

### mechanism.1: guidance string change

**exact code location:**

`setStoneAsApproved.ts` lines 41-47:
```typescript
stdout: formatRouteStoneEmit({
  operation: 'route.stone.set',
  stone: stoneMatched.name,
  action: 'blocked',
  reason: 'only humans can approve',
  guidance: 'please ask a human to run this command',  // ← this string changes
}),
```

**what the blueprint proposes:**

change line 46 to:
```typescript
guidance: `as a driver, you should:
      ├─ \`--as passed\` = signal work complete, proceed
      ├─ \`--as arrived\` = signal work complete, request review
      └─ \`--as blocked\` = escalate if stuck

   the human will run \`--as approved\` when ready.`,
```

**does this duplicate any extant mechanism?**

no. analysis:
- the `guidance` field already exists at line 56 of `formatRouteStoneEmit.ts`
- the formatter already renders `guidance` at line 291: `lines.push(\`   └─ ${input.guidance}\`)`
- we reuse the extant `guidance` field
- we do NOT create a new field, function, or type

**verdict:** CONSISTENT. reuses extant `guidance` field. no new mechanism.

---

### mechanism.2: header inline for blocked action

**exact code location:**

`formatRouteStoneEmit.ts` lines 287-292:
```typescript
if (input.action === 'blocked') {
  lines.push(`🗿 ${input.operation}`);  // ← no header added here currently
  lines.push(`   ├─ stone = ${input.stone}`);
  lines.push(`   ├─ ✗ ${input.reason}`);
  lines.push(`   └─ ${input.guidance}`);
  return lines.join('\n');
}
```

note: currently blocked action uses NO header line. the `header` variable is set at line 141-142 but not used in blocked branch.

**what the blueprint proposes:**

add header before the 🗿 line:
```typescript
if (input.action === 'blocked') {
  lines.push('🦉 patience, friend.');  // ← NEW inline header
  lines.push('');
  lines.push(`🗿 ${input.operation}`);
  ...
}
```

**does this duplicate any extant mechanism?**

no. analysis:
- `route.ts:1146` uses inline `'🦉 patience, friend',` (precedent for inline)
- `formatPatienceFriend.ts:16` uses inline `🗿 patience, friend` (precedent for inline)
- we do NOT add a new constant (HEADER_BLOCKED would be a new mechanism)
- we use inline string like extant patterns

**why not use a constant?**

constants are used for OPERATION-level headers:
- HEADER_GET for route.stone.get operation
- HEADER_SET for route.stone.set operation
- HEADER_DEL for route.stone.del operation

blocked is an ACTION within route.stone.set, not a new operation. consistent with inline patterns.

**verdict:** CONSISTENT. follows extant inline header patterns.

---

### mechanism.3: new brief file

**exact file path:**

`src/domain.roles/driver/briefs/howto.drive-routes.[guide].md`

**extant brief patterns:**

| extant name | pattern | type suffix |
|-------------|---------|-------------|
| `howto.create-routes.[ref].md` | `howto.*.md` | `[ref]` |
| `define.routes-are-gardened.[philosophy].md` | `define.*.md` | `[philosophy]` |
| `research.importance-of-focus.[philosophy].md` | `research.*.md` | `[philosophy]` |
| `im_a.bhrain_owl.md` | `im_a.*.md` | none |

**what the blueprint proposes:**

`howto.drive-routes.[guide].md`
- follows `howto.*.md` pattern
- uses `[guide]` suffix (new type, but consistent bracket syntax)
- uses kebab-case

**does this duplicate any extant mechanism?**

no. analysis:
- no extant "how to drive" brief exists
- the name follows extant convention
- no duplicate content

**verdict:** CONSISTENT. follows extant brief name conventions.

---

### mechanism.4: boot.yml say section

**exact file content:**

`boot.yml` current state:
```yaml
always:
  briefs:
    ref:
      - briefs/im_a.bhrain_owl.md
      - briefs/define.routes-are-gardened.[philosophy].md
      - briefs/research.importance-of-focus.[philosophy].md
      - briefs/howto.create-routes.[ref].md
```

**what the blueprint proposes:**

```yaml
always:
  briefs:
    ref:
      - briefs/im_a.bhrain_owl.md
      - ...
    say:                                              # NEW section
      - briefs/howto.drive-routes.[guide].md          # NEW entry
```

**does this duplicate any extant mechanism?**

no. analysis:
- `say:` is a standard rhachet boot.yml section (like `ref:`)
- follows same list format (dash-prefixed entries)
- does not modify extant `ref:` entries
- purely additive

**verdict:** CONSISTENT. follows extant boot.yml structure.

---

## summary

| mechanism | extant pattern found | blueprint approach | duplicates? |
|-----------|---------------------|-------------------|-------------|
| guidance string | `guidance` field at formatRouteStoneEmit.ts:56 | change value only | no |
| header inline | inline headers at route.ts:1146, formatPatienceFriend.ts:16 | inline string | no |
| brief file | `howto.*.md` pattern | `howto.drive-routes.[guide].md` | no |
| boot.yml say | `ref:` section format | `say:` section, same format | no |

**no mechanism inconsistencies found.**

all blueprint mechanisms either:
1. reuse extant mechanisms (guidance field)
2. follow extant patterns (inline header, brief name)
3. are additive to extant structure (boot.yml say section)

---

## the owl reflects 🦉

> before you forge a new path, walk the old ones.
> before you build a new tool, seek the extant ones.
>
> the guidance field already exists — use it.
> the inline pattern already exists — follow it.
> the brief convention already exists — honor it.
>
> consistency is not laziness.
> consistency is respect for those who came before. 🪷

