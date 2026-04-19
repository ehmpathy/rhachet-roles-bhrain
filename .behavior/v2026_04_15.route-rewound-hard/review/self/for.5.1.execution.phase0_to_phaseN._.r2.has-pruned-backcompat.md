# self-review: has-pruned-backcompat (r2)

## deeper examination

I will read each changed file and look for backcompat code that wasn't requested.

### file: archiveStoneYield.ts

```typescript
export const archiveStoneYield = async (
  input: { stone: string; route: string },
  context: { log: LogMethods },
): Promise<{ archived: string[] }> => {
```

**backcompat check**: no. this is a new function. no old API to maintain.

### file: setStoneAsRewound.ts

```typescript
export const setStoneAsRewound = async (
  input: {
    stone: string;
    route: string;
    yield?: 'keep' | 'drop';
  },
```

**backcompat check**: the `yield` parameter is optional with implicit default `keep`.

- **was this asked for?** the wish says "soft should just do the current rewind, where it keeps the yields". this means: when not specified, behave like before.
- **is this backcompat or just default?** this is a sensible default, not backwards compatibility code. there's no old API maintained - just a new optional parameter.

**verdict**: not backcompat. just optional parameter with default.

### file: stepRouteStoneSet.ts

```typescript
input: {
  stone: string;
  route: string;
  as: 'passed' | 'approved' | 'promised' | 'rewound' | 'blocked' | 'arrived';
  that?: string;
  yield?: 'keep' | 'drop';
}
```

**backcompat check**: same as above. optional parameter.

### file: route.ts (CLI)

```typescript
// derive final yield value (default: keep)
const yieldMode: 'keep' | 'drop' | undefined =
  options.as === 'rewound'
    ? hasHard
      ? 'drop'
      : hasSoft
        ? 'keep'
        : ((options.yield as 'keep' | 'drop') ?? 'keep')
    : undefined;
```

**backcompat check**: no migration code. no dual formats. no deprecated flags maintained.

### what would unasked backcompat look like?

examples of backcompat that would be blocker:

1. retain old `--mode` flag alongside new `--yield` flag
2. migration code that converts old format to new
3. support both old behavior and new behavior via feature flag
4. shim layers for old callers

**none of these exist in the implementation.**

### conclusion

no backwards compatibility code was added. the optional parameters with defaults are not backcompat - they are standard API design for optional features. the wish explicitly requested that default behavior (no flag) = keep yields (extant behavior).
