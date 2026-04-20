# review: has-consistent-conventions (r4)

## the question

do the new names and patterns diverge from extant conventions?

## deep dive: function name conventions

### extant `parse*` functions

```typescript
parseStdinValues    // parse values from stdin
parseArgsForSet     // parse args for set operation
parseArgsForGet     // parse args for get operation
parseArgsForTriage  // parse args for triage operation
```

pattern: `parse` + `Source` or `parse` + `Args` + `For` + `Operation`

### new `parseStdinPrompt`

```typescript
parseStdinPrompt    // parse prompt from stdin
```

follows `parse` + `Source` + `DataType` pattern.
consistent with `parseStdinValues`.

**verdict**: ✓ follows convention

### extant `emit*` functions

```typescript
emitOwlHeader       // emit owl header
emitSubBucket       // emit sub bucket
emitGoalFull        // emit goal in full format
emitGoalCondensed   // emit goal in condensed format
```

pattern: `emit` + `WhatToEmit`

### new `emitOnTalkReminder`

```typescript
emitOnTalkReminder  // emit onTalk reminder
```

follows `emit` + `WhatToEmit` pattern.
the "OnTalk" prefix ties it to the hook mode.

**verdict**: ✓ follows convention

### extant mode values

```typescript
mode: 'triage' | 'hook.onStop'
```

pattern: namespace + `.` + camelCase or standalone word

### new mode value

```typescript
mode: 'triage' | 'hook.onStop' | 'hook.onTalk'
```

`'hook.onTalk'` follows same structure as `'hook.onStop'`:
- `hook` namespace
- `.` separator
- `onTalk` camelCase event

**verdict**: ✓ follows convention

## deep dive: test file conventions

### extant test files

```
blackbox/achiever.goal.triage.acceptance.test.ts
blackbox/achiever.goal.guard.acceptance.test.ts
blackbox/achiever.goal.lifecycle.acceptance.test.ts
```

pattern: `achiever.goal.{feature}.acceptance.test.ts`

### new test file

```
blackbox/achiever.goal.onTalk.acceptance.test.ts
```

**verdict**: ✓ follows convention

## deep dive: jsdoc conventions

### extant jsdoc

```typescript
/**
 * .what = emit owl header
 * .why = consistent vibes across all goal operations
 */
```

pattern: `.what =` and `.why =` fields

### new jsdoc

```typescript
/**
 * .what = parse prompt from Claude Code stdin JSON string
 * .why = separates pure parse from I/O for testability
 */
```

**verdict**: ✓ follows convention

## conclusion

all new names, patterns, and structures follow extant conventions. no divergence found.
