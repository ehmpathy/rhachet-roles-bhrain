# review: has-pruned-backcompat (r2)

## the question

did we add backwards compatibility code that was not explicitly requested?

## investigation

### 1. examined the type union change

```typescript
// before
mode: 'triage' | 'hook.onStop';

// after
mode: 'triage' | 'hook.onStop' | 'hook.onTalk';
```

this is additive - it extends the union. no backwards compat code was added.

### 2. examined the branch structure

```typescript
// hook.onTalk is first, with early exit
if (mode === 'hook.onTalk') {
  // ... new logic
  process.exit(0);
}

// hook.onStop comes next (unchanged)
if (mode === 'hook.onStop') {
  // ... identical to prior
}

// triage falls through (unchanged)
```

the new branch has no awareness of prior modes. it handles its own case and exits.
no fallback to old behavior. no version detection.

### 3. examined new functions

- `parseStdinPrompt`: pure parser, no backwards compat concerns
- `extractPromptFromStdin`: wrapper, no backwards compat concerns
- `emitOnTalkReminder`: output emitter, no backwards compat concerns

none of these functions check for "old behavior" or provide fallbacks.

### 4. examined the setAsk integration

```typescript
await setAsk({ content: prompt, scopeDir });
```

uses the extant `setAsk` function directly. no wrapper for "old format" support.

## why this holds

the wish specifies new behavior (`hook.onTalk` mode), not old behavior maintenance. the implementation adds the new mode without modification to the prior modes. there is no legacy behavior to maintain compatibility with - `hook.onTalk` is entirely new.

## verdict

no backwards compatibility code was added. none was needed.
