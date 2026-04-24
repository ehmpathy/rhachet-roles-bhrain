# self-review: has-grounded-in-reality

## summary

the vision is grounded in reality. verified internal references, confirmed the fix was already applied.

## external references

**verified: no external dependencies**

the wish is about migration of `--mode hook` to `--when hook.onBoot/onStop`. this is purely internal CLI parameter name change — no external APIs, services, or docs involved.

## internal references

### contracts verified

| reference | file | line | verified |
|-----------|------|------|----------|
| stepRouteDrive accepts `when` param | src/contract/cli/route.ts | ~494 | yes — read the file, `when?: 'hook.onBoot' \| 'hook.onStop'` exists |
| getDriverRole hooks use `--when` | src/domain.roles/driver/getDriverRole.ts | 29, 53 | yes — onBoot uses `--when hook.onBoot`, onStop uses `--when hook.onStop` |

### vocab verified

| term | usage | verified |
|------|-------|----------|
| `--when` parameter | consistent with achiever role (goal.triage.infer, goal.triage.next) | yes — searched src/domain.roles/achiever |
| `hook.onBoot` / `hook.onStop` | matches Claude Code hook names | yes — these are the actual hook event names |

### stdouts verified

| artifact | file | verified |
|----------|------|----------|
| hook.onBoot test | blackbox/driver.route.drive.acceptance.test.ts:139-155 | yes — case2 tests `--when hook.onBoot` |
| hook.onStop test | blackbox/driver.route.drive.acceptance.test.ts:243-268 | yes — case4 tests `--when hook.onStop` |
| blocker state tests | blackbox/driver.route.drive.blockedOn.acceptance.test.ts | yes — tests approval vs review blockers |

## findings

### issue: the refs docs said `--mode hook` was still in use

the `refs/defect.route-drive-mode-hook.[finding].md` document said the hooks use `--mode hook`, but after I read `getDriverRole.ts`, I found they already use `--when hook.onBoot/onStop`.

**resolution:** the fix was already applied by commits `57c95ec` and `ffb7937`. the refs are now stale. the vision correctly describes the "after" state which is the current state.

### non-issue: route.bounce and route.mutate.guard still use `--mode hook`

i noted this in the vision. verified these are different — they use stdin-based tool filter, not the onBoot/onStop distinction. `--mode hook` is correct for their use case (pretool hooks).

## conclusion

vision is coherent with reality. internal contracts verified. acceptance tests exist. no assumptions made without verification.
