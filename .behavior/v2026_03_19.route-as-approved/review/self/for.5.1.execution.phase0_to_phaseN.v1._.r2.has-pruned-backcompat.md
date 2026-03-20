# self-review: has-pruned-backcompat (round 2)

## the question

did we add backwards compatibility that was not explicitly requested?

## re-review with fresh eyes

i reviewed each file line by line:

### setStoneAsApproved.ts

the guidance string replaces the old message completely:

**before:** `'please ask a human to run this command'`

**after:** multi-line string with driver alternatives

there is no:
- fallback to old format
- feature flag toggle
- deprecated parameter support
- version check for old behavior

**verdict:** no backwards compat added.

### formatRouteStoneEmit.ts

the blocked action case adds a new conditional branch:

```typescript
if (input.action === 'blocked') {
  // new format
}
```

this is additive — no extant behavior was modified. the blocked action case did not have this special header before, so there's no prior format to maintain compatibility with.

**verdict:** no backwards compat needed or added.

### howto.drive-routes.[guide].md

this is a new file. there is no prior version to maintain compatibility with.

**verdict:** not applicable.

### boot.yml

a single line was added under a new `say:` section. the extant `ref:` section was not modified.

```yaml
say:
  - briefs/howto.drive-routes.[guide].md
```

**verdict:** no backwards compat concerns.

### test files

test assertions were updated to reflect the new guidance format. the old assertions were removed, not kept alongside.

**verdict:** correct — no backwards compat in tests.

## conclusion

upon second review: no backwards compatibility was added. the change is a clean replacement with no legacy paths, which is appropriate for internal CLI improvements where no external contracts depend on the message format.
