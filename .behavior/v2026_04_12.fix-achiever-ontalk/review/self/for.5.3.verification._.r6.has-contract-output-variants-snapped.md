# review: has-contract-output-variants-snapped (r6)

## the question

does each public contract have exhaustive snapshots?

## the contract

`goal.triage.infer --when hook.onTalk` — this is the only new public contract added by this behavior.

## verification

### step 1: enumerate output variants

| variant | behavior | produces output? |
|---------|----------|------------------|
| success (normal message) | appends ask, emits reminder | yes |
| success (multiline) | same, preserves lines | yes |
| empty prompt | no-op, exits 0 | no |
| malformed JSON | no-op, exits 0 | no |

### step 2: verify snapshots exist

read `blackbox/__snapshots__/achiever.goal.onTalk.acceptance.test.ts.snap`:

```
exports[`... [case1] ... stderr matches snapshot 1`] = `
"🦉 to forget an ask is to break a promise. remember.

🔮 goal.triage.infer --from peer --when hook.onTalk
   ├─ from = peer:human
   ├─ ask
   │  ├─
   │  │
   │  │    help me refactor the auth module
   ...
"`;

exports[`... [case8] ... multiline stderr matches snapshot 1`] = `
"🦉 to forget an ask is to break a promise. remember.
...
   │  │    line one
   │  │    line two
   │  │    line three
...
"`;
```

both output-emitted variants have snapshots with real content.

### step 3: verify no-output variants

for empty/malformed:
- test assertion: `expect(result.stderr.trim()).toEqual('')`
- snapshot not needed for empty string
- this matches the pattern — silent exits need no vibecheck

### checklist

- [x] positive path (success) is snapped — case1
- [x] negative path (error) is snapped — n/a (no error path, exits 0)
- [x] help/usage is snapped — n/a (hook, not user-invoked cli)
- [x] edge cases are snapped — multiline (case8); empty/malformed have no output
- [x] snapshot shows actual output — verified treestruct with owl header

## why it holds

1. two output variants exist; both are snapped
2. silent variants (empty, malformed) produce no output to snap
3. snapshot content shows real treestruct format, not placeholder
4. no output variant is absent from coverage

