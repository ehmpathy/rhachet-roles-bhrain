# self-review: has-consistent-mechanisms

## the question

did we create new mechanisms that duplicate extant functionality?

## review of each new mechanism

### 1. guidance string format in setStoneAsApproved.ts

**what was added:** a multi-line guidance string with tree-format alternatives

**does extant code do this?**

yes. i searched for similar patterns:

```typescript
// in formatRouteStoneEmit.ts, similar tree-format strings exist:
lines.push(`   ├─ \`--as passed\` = signal work complete, proceed`);
```

the guidance string follows the extant tree-format convention used throughout the codebase. the format with `├─` and `└─` is consistent with other emit functions.

**verdict:** consistent with extant patterns.

### 2. blocked action header override in formatRouteStoneEmit.ts

**what was added:**

```typescript
if (input.action === 'blocked') {
  lines.push('🦉 patience, friend.');
  // ...
}
```

**does extant code do this?**

yes. the file already has similar action-specific handlers:

```typescript
if (input.action === 'challenge:absent') {
  // custom header and format
}
if (input.action === 'challenge:first' || input.action === 'challenge:rushed') {
  // custom header and format
}
```

the blocked action case follows the same pattern as other action-specific handlers.

**verdict:** consistent with extant patterns.

### 3. howto.drive-routes.[guide].md brief

**what was added:** a new brief file

**does extant code have similar briefs?**

yes. the driver role already has briefs:

- `briefs/im_a.bhrain_owl.md`
- `briefs/define.routes-are-gardened.[philosophy].md`
- `briefs/howto.create-routes.[ref].md`

the new brief follows the same name convention: `howto.{topic}.[{type}].md`

**verdict:** consistent with extant brief patterns.

### 4. boot.yml say section

**what was added:**

```yaml
say:
  - briefs/howto.drive-routes.[guide].md
```

**does extant code use this mechanism?**

yes. the boot.yml already has a `ref:` section. the `say:` level is a known boot.yml feature documented in the role system.

**verdict:** consistent with extant boot.yml patterns.

## conclusion

all new code follows extant patterns. no new mechanisms were introduced — we reused the tree-format convention, action-specific handler pattern, brief name conventions, and boot.yml structure.
