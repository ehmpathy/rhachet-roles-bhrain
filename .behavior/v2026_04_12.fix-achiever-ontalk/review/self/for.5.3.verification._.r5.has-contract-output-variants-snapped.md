# review: has-contract-output-variants-snapped (r5)

## the question

does each public contract have exhaustive snapshots?

## contract: goal.triage.infer --when hook.onTalk

this is the only new public contract added by this behavior.

### output variants

| variant | test case | snapped? | rationale |
|---------|-----------|----------|-----------|
| success (normal message) | case1 | yes | shows complete treestruct output format |
| success (multiline) | case8 | yes | shows multiline in sub.bucket |
| silent (empty prompt) | case2 | n/a | no output = no snapshot (assertion proves empty) |
| silent (malformed JSON) | case5 | n/a | no output = no snapshot (assertion proves empty) |

### snapshot verification

opened `blackbox/__snapshots__/achiever.goal.onTalk.acceptance.test.ts.snap`:

1. **case1 snapshot** — shows full output:
   - owl header: `🦉 to forget an ask is to break a promise`
   - skill invocation: `🔮 goal.triage.infer --from peer --when hook.onTalk`
   - from field: `from = peer:human`
   - ask in sub.bucket with message content
   - consider prompt with triage command

2. **case8 snapshot** — shows multiline in sub.bucket:
   - same structure as case1
   - each line preserved: `line one`, `line two`, `line three`

### checklist

- [x] positive path (success) is snapped — case1, case8
- [x] negative path (error) is snapped — n/a (no error output, exits 0 silently)
- [x] help/usage is snapped — n/a (not a user-invoked command)
- [x] edge cases are snapped — multiline (case8) snapped; empty/malformed have no output
- [x] snapshot shows actual output, not placeholder — verified real treestruct

## why it holds

1. all variants that emit output have snapshots
2. silent variants (empty, malformed) have no output to snap
3. snapshots show real output format with treestruct and sub.bucket
4. no variant is absent from test coverage

