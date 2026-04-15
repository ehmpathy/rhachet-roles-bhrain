# self-review: has-pruned-backcompat (r2)

## review question

review for backwards compatibility that was not explicitly requested.

## articulation

i will now examine each changed file and ask: did we add backcompat code that was not requested?

### file: blackbox/.test/invokeRouteSkill.ts

**change**: line 173-174, changed from double quotes to single quotes

```typescript
// before
.map((arg) => (arg.startsWith('--') ? arg : `"${arg}"`))

// after
.map((arg) => (arg.startsWith('--') ? arg : `'${arg}'`))
```

**analysis**: this is a bug fix. the prior code allowed bash to expand variables like `$behavior`. the new code prevents this expansion. no backwards compat concern here — we fixed incorrect behavior.

**verdict**: ✅ no backcompat code

### file: src/contract/cli/route.ts

**change**: added `routeStoneAdd` function (lines ~789-850)

**analysis**: this is entirely new code. no modification to extant functions. the new function is called from the command dispatcher in the same pattern as `routeStoneSet`, `routeStoneGet`, `routeStoneDel`.

**verdict**: ✅ no backcompat code

### file: src/domain.operations/route/formatRouteStoneEmit.ts

**change**: added `'add'` to the action union type

**analysis**: additive change. extant actions (`get`, `set`, `del`) are unchanged. no code handles the `add` action in a fallback manner — it is handled explicitly.

**verdict**: ✅ no backcompat code

### file: src/domain.roles/driver/skills/route.stone.add.sh

**change**: new file

**analysis**: entirely new file. no backcompat concern.

**verdict**: ✅ no backcompat code

### files: src/domain.operations/route/stepRouteStoneAdd.ts, getContentFromSource.ts, isValidStoneName.ts

**change**: new files

**analysis**: entirely new files. no backcompat concern.

**verdict**: ✅ no backcompat code

## summary

all changes are either:
1. **bug fixes** — fix prior incorrect behavior
2. **additive** — new code that does not modify extant behavior

no backwards compat code was added "to be safe". no deprecated aliases. no version checks. no fallback behavior.

## final verdict

✅ no unnecessary backwards compat code
