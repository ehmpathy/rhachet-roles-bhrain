# self-review: has-contract-output-variants-snapped (r3)

## question

on third review: are there any blind spots in snapshot coverage?

## blind spot check

### potential blind spots

| potential blind spot | covered? | how |
|---------------------|----------|-----|
| --help variant | n/a | guard has no --help (hook invocation) |
| empty input | n/a | guard receives JSON via stdin, always present |
| error cases | yes | blocked cases captured |
| edge cases | yes | .route/ at different levels captured |

### guard invocation modes

the guard is invoked as a Claude Code hook, not directly by users. it receives:
- stdin: JSON with tool name, file path, etc.
- no CLI args

therefore, variants like `--help` or empty input don't apply.

### what is captured

| output type | variant | captured |
|-------------|---------|----------|
| stderr | allowed (exit 0) | yes |
| stderr | blocked (exit 2) | yes |
| stdout | n/a | guard uses stderr only |

## conclusion

no blind spots identified. the guard's output variants are fully captured. hook invocation mode means fewer variants than a direct CLI.
