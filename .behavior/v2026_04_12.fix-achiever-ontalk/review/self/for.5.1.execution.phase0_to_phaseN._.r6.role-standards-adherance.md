# review: role-standards-adherance (r6)

## the question

does the code follow mechanic role standards?

## rule directories checked

relevant brief categories from `.agent/repo=ehmpathy/role=mechanic/briefs/practices/`:
- `code.prod/evolvable.procedures/` — procedure patterns
- `code.prod/readable.comments/` — comment discipline
- `code.prod/readable.narrative/` — narrative flow
- `code.prod/pitofsuccess.errors/` — error patterns
- `lang.terms/` — term restrictions
- `lang.tones/` — tone guidelines

## standard-by-standard verification

### rule.require.what-why-headers

**standard**: every named procedure needs `.what` and `.why` in jsdoc

**checked functions**:

1. `parseStdinPrompt`:
```typescript
/**
 * .what = parse prompt from Claude Code stdin JSON string
 * .why = separates pure parse from I/O for testability
 */
```
✓ compliant

2. `extractPromptFromStdin`:
```typescript
/**
 * .what = extract prompt from Claude Code stdin JSON
 * .why = UserPromptSubmit hook receives JSON with prompt field
 */
```
✓ compliant

3. `emitOnTalkReminder`:
```typescript
/**
 * .what = emit onTalk reminder to stderr
 * .why = vision specifies this exact format
 */
```
✓ compliant

**verdict**: ✓ all functions have .what and .why

### rule.require.input-context-pattern

**standard**: procedures use `(input, context?)` signature

**checked**: all new functions use appropriate signatures

- `parseStdinPrompt(raw: string)` — pure transformer, single input is acceptable
- `extractPromptFromStdin()` — no-arg wrapper, acceptable
- `emitOnTalkReminder(content: string)` — single output function, acceptable

**verdict**: ✓ signatures appropriate for function types

### rule.forbid.gerunds

**standard**: no gerunds in names or comments

**checked**: all new function names and comments

- `parseStdinPrompt` — verb + noun + noun ✓
- `extractPromptFromStdin` — verb + noun + preposition + noun ✓
- `emitOnTalkReminder` — verb + noun ✓

**comments scanned**: no gerunds found in new code sections

**verdict**: ✓ no gerunds

### rule.require.narrative-flow

**standard**: flat linear code, no nested branches

**checked**: hook.onTalk branch

```typescript
if (mode === 'hook.onTalk') {
  const prompt = extractPromptFromStdin();
  if (!prompt) process.exit(0);  // early exit
  await setAsk({ content: prompt, scopeDir });
  emitOnTalkReminder(prompt);
  process.exit(0);
}
```

- flat structure ✓
- early exit pattern ✓
- no nested branches ✓

**verdict**: ✓ narrative flow

### rule.forbid.else-branches

**standard**: no else or if-else

**checked**: new code

the `if (!prompt) process.exit(0)` is early return, not if-else.

**verdict**: ✓ no else branches

### rule.require.failfast

**standard**: invalid state should fail early

**checked**: parseStdinPrompt

returns null for invalid input rather than throw — this is intentional for hook context where invalid stdin should result in silent exit, not error.

**verdict**: ✓ appropriate for context (hooks should not crash loudly)

### rule.require.arrow-only

**standard**: use arrow functions, not function keyword

**checked**: all new functions

```typescript
export const parseStdinPrompt = (raw: string): string | null => { ... };
const extractPromptFromStdin = (): string | null => { ... };
const emitOnTalkReminder = (content: string): void => { ... };
```

**verdict**: ✓ all arrow functions

### rule.forbid.as-cast

**standard**: no `as` type casts

**checked**: new code sections — no `as` casts found

**verdict**: ✓ no type casts

### rule.prefer.lowercase

**standard**: lowercase for comments and docs

**checked**: jsdoc comments use lowercase

**verdict**: ✓ lowercase

## issues found

none.

## conclusion

| standard | status |
|----------|--------|
| what-why-headers | ✓ |
| input-context-pattern | ✓ |
| forbid-gerunds | ✓ |
| narrative-flow | ✓ |
| forbid-else | ✓ |
| failfast | ✓ |
| arrow-only | ✓ |
| forbid-as-cast | ✓ |
| prefer-lowercase | ✓ |

all mechanic role standards followed.
