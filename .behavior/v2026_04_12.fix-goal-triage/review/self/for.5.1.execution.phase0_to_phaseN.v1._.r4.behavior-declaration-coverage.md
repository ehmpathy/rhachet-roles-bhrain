# self review: behavior-declaration-coverage

## review

checked each requirement from vision and blueprint against implementation.

### vision requirements

| requirement | done? | evidence |
|-------------|-------|----------|
| actionable output per incomplete goal | yes | `goal.ts` emits `to fix, run: \`rhx goal.memory.set --slug X --why.purpose "..."\`` |
| rename `--mode` to `--when` | yes | `parseArgsForTriage` now uses `when` key |
| rename `goal.infer.triage` to `goal.triage.infer` | yes | function renamed, shell skill renamed |
| fix bug: partition by status.choice | yes | `getTriageState.ts` uses `g.status.choice !== 'incomplete'` |
| per-goal tip in goal.triage.next | yes | `goal.ts` emits `tip: run \`rhx goal.memory.get --slug X\`` |
| update hook command in getAchieverRole.ts | yes | hook uses `goal.triage.infer --when hook.onStop` |

### blueprint filediff coverage

| file | prescribed change | done? |
|------|-------------------|-------|
| `src/contract/cli/goal.ts` | update output, rename function, fix flag | yes |
| `src/domain.operations/goal/getTriageState.ts` | fix partition logic | yes |
| `src/domain.operations/goal/getTriageState.integration.test.ts` | add status-based tests | yes (6 new tests) |
| `src/domain.roles/achiever/skills/goal.triage.infer.sh` | create renamed skill | yes |
| `src/domain.roles/achiever/skills/goal.infer.triage.sh` | delete old skill | yes |
| `src/domain.roles/achiever/getAchieverRole.ts` | update hook command | yes |
| `src/domain.roles/achiever/boot.yml` | update skill reference | yes |
| `src/domain.roles/achiever/readme.md` | update skill name | yes |
| `src/domain.roles/achiever/briefs/howto.triage-goals.[guide].md` | update skill references | yes |
| `src/domain.roles/achiever/inits/claude.hooks/userpromptsubmit.ontalk.sh` | update command | yes |
| `blackbox/achiever.goal.triage.acceptance.test.ts` | update tests | yes |
| `blackbox/achiever.goal.triage.next.acceptance.test.ts` | update tests | yes |

### test verification

- integration tests: 32 pass (includes 6 new status-based partition tests)
- acceptance tests goal.triage: 124 pass
- acceptance tests goal.triage.next: 28 pass

### why this holds

all requirements from vision and blueprint are implemented. no gaps found.

## outcome

full coverage of behavior declaration confirmed.
