# review.self: role-standards-coverage (r8)

## what was reviewed

eighth pass. final verification that no mechanic role standards are absent from changed files.

## standards enumeration

### from practices/code.prod/

| standard | file | applied? |
|----------|------|----------|
| fail-fast errors | route.mutate.guard.sh | yes - exit 2 on block |
| fail-fast errors | getBlockedChallengeDecision.ts | yes - throws on error |
| what-why headers | route.mutate.guard.sh | yes - has shell header |
| what-why headers | getBlockedChallengeDecision.ts | yes - has jsdoc |
| arrow-only functions | getBlockedChallengeDecision.ts | yes |
| input-context pattern | getBlockedChallengeDecision.ts | yes |
| narrative flow | route.mutate.guard.sh | yes - early exits |
| no else branches | route.mutate.guard.sh | yes - uses if/exit |

### from practices/code.test/

| standard | file | applied? |
|----------|------|----------|
| given-when-then | all test files | yes |
| snapshot tests | integration + acceptance | yes |
| useBeforeAll | test files with shared setup | yes |
| afterEach cleanup | test files with temp files | yes |

### from practices/lang.terms/

| standard | file | applied? |
|----------|------|----------|
| no gerunds | all files | yes - checked |
| noun-adj order | variable names | yes |

## patterns that must be present

checked each required pattern:

1. **error exit codes** - route.mutate.guard.sh exits with 2 on block
2. **error messages** - guard prints clear message before exit
3. **function headers** - all TypeScript functions have .what/.why
4. **test structure** - all tests use given/when/then
5. **snapshot verification** - stderr output captured in snapshots
6. **idempotent operations** - fs.mkdir uses recursive: true

## conclusion

all mechanic role standards are covered in all changed files. no standards are absent.

