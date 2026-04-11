# rule.require.explicit-stdin-flags

## .what

stdin inputs must be explicitly declared via flags like `--reason @stdin`, never implicitly consumed.

## .why

implicit stdin consumption is magic behavior that:
- surprises users when stdin is silently interpreted
- breaks composability (can't pipe other content)
- hides the contract (no way to know stdin is expected)
- causes silent failures when stdin is absent

explicit flags make contracts visible:
- `--reason @stdin` clearly declares stdin expectation
- self-documented CLI usage
- predictable behavior

## .pattern

```bash
# bad — stdin silently consumed as reason
echo "my reason" | rhx goal.memory.set --slug foo --status fulfilled

# good — explicit stdin flag
echo "my reason" | rhx goal.memory.set --slug foo --status fulfilled --reason @stdin
```

## .implementation

```typescript
// bad — implicit stdin
const reason = stdinContent.trim() || 'status updated';

// good — require explicit flag
if (!fields['status.reason']) {
  throw new BadRequestError('--status.reason required for status update');
}
```

## .scope

applies to all CLI skills that accept piped input.

## .enforcement

implicit stdin consumption = blocker
