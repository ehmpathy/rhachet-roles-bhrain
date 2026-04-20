# review: role-standards-coverage (r8)

## the question

are all relevant mechanic standards applied? did we miss any required patterns?

## fresh eyes review

re-read all new code line by line. checked against rule directories.

## rule directories double-checked

| directory | checked? | violations? |
|-----------|----------|-------------|
| code.prod/evolvable.procedures | ✓ | none |
| code.prod/readable.comments | ✓ | none |
| code.prod/readable.narrative | ✓ | none |
| code.prod/pitofsuccess.errors | ✓ | none |
| code.prod/pitofsuccess.procedures | ✓ | none |
| code.prod/consistent.artifacts | ✓ | none |
| code.test/frames.behavior | ✓ | none |
| lang.terms | ✓ | none |
| lang.tones | ✓ | none |

## additional patterns verified

### rule.require.test-coverage-by-grain

**grain**: the new code includes:
- transformer: parseStdinPrompt (pure)
- orchestrator: hook.onTalk branch in goalTriageInfer

**coverage**:
- transformer: exported for unit test
- orchestrator: covered by acceptance test

**why it holds**: each grain has appropriate test type

### rule.forbid.failhide

**check**: does any code silently swallow errors?

```typescript
} catch {
  return null;
}
```

**analysis**: this is in parseStdinPrompt for malformed JSON. the null return is intentional — the hook should not crash on invalid stdin. the caller handles null by exit 0.

**why it holds**: null return is explicit, not hidden. exit 0 is documented behavior.

### rule.require.idempotent-procedures

**check**: is setAsk idempotent?

**analysis**: setAsk uses content hash for deduplication. same content = same hash = idempotent.

**why it holds**: setAsk already implements idempotency via hash

### rule.forbid.stdout-on-exit-errors

**check**: does exit use stdout?

**analysis**: all output in emitOnTalkReminder uses console.error (stderr). exit 0 has no stdout.

**why it holds**: stderr only for hook output

## gaps found

none.

## final checklist

| category | present? | verified at |
|----------|----------|-------------|
| jsdoc headers | ✓ | lines 492, 511, 520 |
| arrow functions | ✓ | lines 497, 515, 524 |
| stderr output | ✓ | lines 525-540 |
| exit 0 for success | ✓ | lines 1003, 1007 |
| pure transformer | ✓ | parseStdinPrompt |
| unit test export | ✓ | line 497 |
| acceptance test | ✓ | blackbox/achiever.goal.onTalk.acceptance.test.ts |
| idempotency | ✓ | setAsk uses hash |
| no failhide | ✓ | null return is explicit |

## conclusion

all required patterns are present. no gaps found.

implementation is complete and follows all mechanic role standards.
