# self-review: has-consistent-mechanisms (r3)

## review question

review for new mechanisms that duplicate extant functionality.

## deeper reflection

in r2 i identified one minor duplication: `collectStdinContent()` overlaps with `readStdin()` in goal.ts.

let me now decide: should i fix this, or is it acceptable?

### analysis of the stdin read duplication

**option 1: extract shared utility**

pros:
- removes duplication
- single source of truth

cons:
- requires a new file (e.g., `src/utils/readStdinSync.ts`)
- increases scope beyond the wish
- goal.ts and route.ts have different module structures
- the implementations differ slightly (cat subprocess vs fd read)

**option 2: leave as-is**

pros:
- both work correctly
- no scope creep
- implementations are optimized for their contexts
- minor duplication (<20 lines)

cons:
- two places to maintain if behavior changes

### decision

**leave as-is**. rationale:

1. **scope**: the wish was to add `route.stone.add`, not to refactor stdin utilities
2. **stability**: both implementations work and are tested
3. **size**: the duplication is small (~15 lines)
4. **purpose**: they serve different CLI modules with different needs
5. **risk**: a refactor could introduce regressions

### recommendation for future

if more CLI modules need stdin read, consider:
- `src/contract/cli/_shared/readStdinSync.ts`
- then update goal.ts and route.ts to use it

but this is out of scope for this behavior.

## other mechanisms reviewed

- **isValidStoneName**: unique functionality (no duplication)
- **getContentFromSource**: unique purpose (template + stdin + literal resolution)
- **formatRouteStoneEmit extension**: reuses extant mechanism

## final verdict

⚠️ one minor duplication identified (stdin read). decision: leave as-is due to scope constraints. documented for future refactor consideration.
