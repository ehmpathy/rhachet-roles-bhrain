# self review: has-pruned-backcompat (r2)

## deeper review

took a fresh look at backwards compatibility concerns.

### places where backwards compat COULD have been added

1. **`--mode` flag alias**
   - could have kept `--mode` as an alias for `--when`
   - did not: vision said "hard break"
   - rationale: we control the only consumer (getAchieverRole.ts hook)

2. **skill name alias**
   - could have kept `goal.infer.triage` as an alias for `goal.triage.infer`
   - did not: vision said "hard break"
   - rationale: old skill file was deleted, only new file exists

3. **deprecation warnings**
   - could have emitted warnings instead of a hard break
   - did not: vision said "hard break"
   - rationale: no external consumers, no need for migration period

### evidence from the vision

from `1.vision.md`:

> "**\[answered\]**: hard break. we control the only consumer (`getAchieverRole.ts`). update hook command in same PR."

this explicitly answers the open question about backwards compat. the answer was: hard break.

### verification

- `getAchieverRole.ts` updated: `goal.triage.infer --when hook.onStop`
- `userpromptsubmit.ontalk.sh` updated: `goal.triage.infer --when hook.onTalk`
- old shell skill deleted
- all tests updated and pass

### why this holds

the hard break approach is correct because:
1. the vision explicitly requested it
2. there are no external consumers to break
3. all internal consumers were updated in this PR
4. tests verify the new names and flags work

## outcome

no unnecessary backwards compat was added. confirmed after deeper review.
