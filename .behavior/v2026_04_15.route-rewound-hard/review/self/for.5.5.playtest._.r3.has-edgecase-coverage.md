# self-review: has-edgecase-coverage (r3)

## deliberate re-examination

i paused and re-read the playtest yield file and vision edgecases section.

for each edge case in the vision table, i traced it to a specific playtest step:
- opened both files side by side
- verified the test command matches the edge case
- checked the expected outcome addresses the edge case

i also asked: "what edge cases are NOT in the vision but SHOULD be tested?"

## edge cases verified

| edge case | coverage | why it holds |
|-----------|----------|--------------|
| no yield file | step 7 | tests `yield = absent` output |
| multiple extensions | step 8 | tests `.yield`, `.yield.md`, `.yield.json` |
| default is keep | step 3 | tests no flag behavior |
| `--hard` + `--soft` | step 9 | tests error message |
| `--hard` + `--yield keep` | step 10 | tests conflict error |
| `--soft` + `--yield drop` | step 11 | tests conflict error |
| yield on non-rewound | step 12 | tests action validation |
| cascade boundary | step 6 | tests stone 1 preserved, 2-3 archived |
| archive dir absent | step 1 | implicitly creates `.route/.archive/` |

## what could go wrong?

- **invalid stone name**: caught by stone lookup before yield logic
- **yield file locked**: os-level; not feature scope
- **archive dir readonly**: os-level; not feature scope
- **nested stone names**: step 6 cascade tests this implicitly

## unusual but valid inputs

- **empty yield file**: step 7 covers (no yield = no-op)
- **large yield file**: not tested, but not a boundary condition for archive
- **symlinked yield**: out of scope (feature uses direct file ops)

## verdict

all relevant edge cases are covered. the playtest tests boundaries that matter for the feature. os-level edge cases (permissions, locks) are outside feature scope.
