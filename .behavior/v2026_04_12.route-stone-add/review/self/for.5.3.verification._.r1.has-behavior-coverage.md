# self-review: has-behavior-coverage

## verified: all behaviors from wish have tests

### behaviors from 0.wish.md → test coverage

| behavior | covered by | status |
|----------|------------|--------|
| drivers can self add stones to their route | case1, case2 | ✓ |
| use a template to bootup the stone | case5 (template source) | ✓ |
| declare contents via stdin | case6 (stdin source) | ✓ |
| --where must be within current bound route (failfast if none) | case10 (route not found) | ✓ |
| --how must be from @stdin or 'words...' | case2 (literal), case5 (template), case6 (stdin) | ✓ |
| matches extant flags/conventions of route.stone.* | case1 (plan mode default), case2 (apply mode) | ✓ |
| cover with snaps | all success cases have `.toMatchSnapshot()` | ✓ |

### error case coverage

| error case | test case | status |
|------------|-----------|--------|
| stone collision | case3 | ✓ |
| invalid stone name (no numeric prefix) | case4 | ✓ |
| stdin with no content | case7 | ✓ |
| template not found | case8 | ✓ |
| absent --stone | case9 [t0] | ✓ |
| absent --from | case9 [t1] | ✓ |
| route not found | case10 | ✓ |

### test file location

`blackbox/driver.route.stone.add.acceptance.test.ts`

### test run results

- 10 test cases, all passed
- all success paths have snapshot assertions
- all error paths verify exit code 2 and stderr message

## conclusion

all behaviors from the wish are covered by acceptance tests. no gaps found.
