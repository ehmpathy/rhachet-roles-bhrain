# self-review: has-consistent-conventions (round 4)

## the question

do we diverge from extant name conventions and patterns?

## deeper examination

i went back to the source files and compared character-by-character against extant patterns.

### 1. guidance string phrase patterns

**our guidance:**
```typescript
'as a driver, you should:',
'   ├─ `--as passed` = signal work complete, proceed',
'   ├─ `--as arrived` = signal work complete, request review',
'   └─ `--as blocked` = escalate if stuck',
```

**extant pattern from formatRouteStoneEmit.ts:**
```typescript
'   ├─ `--as passed` = signal work complete, proceed',
'   ├─ `--as arrived` = request human approval before proceed',
```

the `=` separator and backtick-wrapped command are consistent with extant patterns.

**verdict:** consistent.

### 2. tree indent: 3 spaces

**our code:**
```typescript
'   ├─ `--as passed` = ...'
```

**extant code in formatRouteStoneEmit.ts:**
```typescript
lines.push(`   ├─ \`--as passed\` = signal work complete, proceed`);
```

counted: 3 spaces before `├─`. matches.

**verdict:** consistent.

### 3. header emoji placement

**our header:**
```typescript
lines.push('🦉 patience, friend.');
```

**extant headers in formatRouteStoneEmit.ts:**
```typescript
lines.push(`🦉 what have you seen?`);
lines.push(`🦉 whats the rush?`);
```

emoji at start, space, lowercase phrase, punctuation at end. our header follows this.

**verdict:** consistent.

### 4. brief markdown structure

**our brief `howto.drive-routes.[guide].md`:**
```markdown
# howto: drive routes

## the road ahead

> quote block for owl wisdom

## when you're on the road

| table | format |
```

**extant brief `howto.create-routes.[ref].md`:**
```markdown
# howto: create routes

## overview

> wisdom

## structure

| table | format |
```

both use:
- `# howto:` prefix
- wisdom in `>` quote blocks
- tables for structured data

**verdict:** consistent.

### 5. boot.yml indentation

**our addition:**
```yaml
    say:
      - briefs/howto.drive-routes.[guide].md
```

**extant structure:**
```yaml
    ref:
      - briefs/im_a.bhrain_owl.md
      - briefs/define.routes-are-gardened.[philosophy].md
```

4 spaces for `say:`, 6 spaces for list items with `- `. matches extant `ref:` indentation.

**verdict:** consistent.

### 6. test assertion style

**our test assertions:**
```typescript
expect(res.stdout).toContain('--as passed');
expect(res.stdout).toContain('--as arrived');
expect(res.stdout).toContain('--as blocked');
```

**extant test pattern:**
```typescript
expect(res.stdout).toContain('only humans can approve');
```

same `toContain` pattern on `res.stdout`.

**verdict:** consistent.

## what i looked for but did not find

i searched for potential divergence in:
- constant names: none introduced
- type names: none introduced
- file extensions: `.md` for brief, consistent
- import paths: no new imports needed

## conclusion

every aspect of the implementation matches extant conventions:
- tree indentation (3 spaces)
- emoji header format (emoji + space + lowercase)
- guidance string format (`command` = description)
- brief structure (howto prefix, quote wisdom, tables)
- boot.yml indentation (4 spaces section, 6 spaces items)
- test assertion style (toContain on stdout)

no divergence found.
