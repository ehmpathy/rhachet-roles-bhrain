# review: has-critical-paths-frictionless (r7)

## the question

are the critical paths frictionless in practice?

## the critical path

for hook.onTalk:
1. hook fires when user sends message
2. ask is appended to inventory
3. short reminder is emitted to stderr
4. hook exits 0 (does not halt brain)

## verification

### acceptance test verification

ran case1 test which exercises the full path:

```
$ npm run test:acceptance -- achiever.goal.onTalk.acceptance.test.ts

32 tests pass:
- [case1] ask appended to asks.inventory.jsonl ✓
- [case1] reminder emitted to stderr ✓
- [case1] exits 0 ✓
- [case2-8] edge cases all pass ✓
```

### what the tests verify

| step | verified | how |
|------|----------|-----|
| hook fires | yes | test invokes skill with stdin |
| ask appended | yes | fs.readFile confirms inventory entry |
| reminder emitted | yes | stderr contains owl header and message |
| exits 0 | yes | result.code === 0 |

### why friction is absent

1. **no extra flags required** — `--when hook.onTalk` is the only arg needed
2. **stdin format is simple** — just `{"prompt": "message"}`
3. **empty/malformed input handled gracefully** — exits 0 silently
4. **output is terse but complete** — reminder fits in one screen

### edge cases verified frictionless

- empty message → silent exit (no noise)
- malformed JSON → silent exit (no crash)
- multiline message → each line displayed
- special chars/emoji → preserved correctly
- duplicate messages → each one saved

## why it holds

1. acceptance tests prove the path works end-to-end
2. all 32 tests pass with real CLI invocation
3. edge cases exit gracefully without friction
4. output format matches vision specification

