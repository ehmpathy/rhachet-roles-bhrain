# review: has-behavior-coverage (r1)

## the question

does the verification checklist show every behavior from wish/vision has a test?

## behaviors from 0.wish.md

| behavior | test coverage |
|----------|---------------|
| reads stdin and calls setAsk | case1: invoke goal.triage.infer --when hook.onTalk |
| ask appended to asks.inventory.jsonl | case1, case3, case4, case7, case8 all verify file content |
| output is short reminder | case1, case6 verify stderr format |
| exits 0 (does not halt) | all 8 cases verify exit code 0 |
| extant hook.onStop unchanged | not tested - separate feature, not modified |

## why it holds

1. **stdin read + setAsk call**: case1 sends JSON via stdin, verifies ask is written to inventory
2. **ask appended**: multiple cases verify jsonl content, hash presence, content preservation
3. **short reminder**: case1 and case6 verify owl header, treestruct format, consider prompt
4. **exits 0**: every case explicitly asserts `result.code === 0`
5. **hook.onStop**: not tested because it was not modified in this behavior

## test coverage summary

- 8 test cases
- 32 assertions total
- 2 snapshots for output format verification

all behaviors from 0.wish.md are covered.

