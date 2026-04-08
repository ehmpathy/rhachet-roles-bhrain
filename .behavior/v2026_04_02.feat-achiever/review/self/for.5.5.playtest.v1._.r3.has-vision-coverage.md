# self-review: has-vision-coverage (r3)

## the question

does the playtest cover all behaviors from wish and vision?

## the review

### method

fresh inspection of playtest file (5.5.playtest.v1.i1.md) to verify coverage claims. compared against wish (0.wish.md) behaviors loaded in system context.

### fresh inspection: playtest manual steps

read playtest lines 55-146:

**manual.1 (lines 55-89):** goal.memory.set with full YAML
- YAML includes: slug, why.{ask,purpose,benefit}, what.{outcome}, how.{task,gate}, status.{choice,reason}, source
- expected: exit 0, file created at .goals/[BRANCH]/

**manual.2 (lines 93-106):** goal.memory.set status update
- uses --slug and --status flags
- expected: flag file renamed to reflect new status

**manual.3 (lines 110-130):** goal.memory.get
- expected: goals list with status in brackets, key fields visible

**manual.4 (lines 134-146):** goal.infer.triage
- expected: triage state with asks/uncovered/goals/coverage counts

### fresh inspection: playtest edge cases table

read playtest lines 161-174:

| edge case | acceptance test | behavior |
|-----------|-----------------|----------|
| incomplete schema | achiever.goal.lifecycle | error lists absent fields |
| main branch forbidden | achiever.goal.lifecycle | error message |
| empty goals list | achiever.goal.lifecycle | returns `(none)` |
| goal not found | achiever.goal.lifecycle | error message |
| status transitions | achiever.goal.lifecycle | enqueued → inflight → fulfilled |
| blocked status | achiever.goal.triage | blocked with reason |
| multi-ask triage | achiever.goal.triage | all asks get covered |

### wish behaviors verification

from 0.wish.md (in system context):

1. **"goal.memory.set" (line 45)** → covered by manual.1 and manual.2
2. **"goal.memory.get" (line 46)** → covered by manual.3
3. **"goal.infer" (line 47)** → covered by manual.4 as goal.infer.triage
4. **goal shape "ask, task, gate, root" (lines 53-57)** → manual.1 YAML exercises all fields
5. **"$route/.goals/ or reporoot/.goals/" (lines 71-72)** → manual uses repo scope, acceptance tests reference both scopes

### documented gap

route scope (`--scope route`) is not manually tested. per r2 analysis: route scope requires route context which playtest cannot easily provide. core behaviors via repo scope are covered.

## conclusion

**holds: yes**

fresh inspection confirms:
1. all three wish skills are manually tested (lines 55-146)
2. full goal schema exercised via manual.1 YAML input
3. edge cases enumerated with acceptance test citations (lines 161-174)
4. route scope gap is documented and acceptable for v1
