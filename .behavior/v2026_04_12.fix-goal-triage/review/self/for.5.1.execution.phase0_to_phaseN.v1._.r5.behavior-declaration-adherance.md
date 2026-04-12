# self review: behavior-declaration-adherance (r5)

## review

verified implementation adheres to behavior declaration (vision + blueprint).

### vision adherance

| requirement | adhered? | evidence |
|-------------|----------|----------|
| actionable output per incomplete goal | yes | shows `to fix, run: \`rhx goal.memory.set --slug X --why.purpose "..."\`` |
| first absent field only | yes | uses `meta.absent[0] ?? 'why.purpose'` |
| `--mode` renamed to `--when` | yes | `parseArgsForTriage` uses `when` key |
| skill renamed `goal.triage.infer` | yes | file renamed, function renamed |
| partition by status.choice | yes | `g.status.choice !== 'incomplete'` |
| per-goal tip in goal.triage.next | yes | shows `tip: run \`rhx goal.memory.get --slug X\`` |

### blueprint adherance

| prescribed change | adhered? |
|-------------------|----------|
| `goal.ts` output format update | yes |
| `goal.ts` function rename | yes |
| `goal.ts` flag rename | yes |
| `getTriageState.ts` partition fix | yes |
| `getTriageState.integration.test.ts` status tests | yes |
| shell skill rename | yes |
| `getAchieverRole.ts` hook command | yes |
| `boot.yml` skill reference | yes |
| `readme.md` skill reference | yes |
| `howto.triage-goals.[guide].md` references | yes |
| `userpromptsubmit.ontalk.sh` command | yes |
| acceptance tests updated | yes |

### no deviations

all changes match the blueprint filediff tree and codepath tree exactly.

## outcome

full adherance to behavior declaration confirmed.
