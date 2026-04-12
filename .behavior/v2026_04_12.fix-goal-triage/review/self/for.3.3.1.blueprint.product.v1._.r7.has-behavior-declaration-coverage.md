# self-review r7: has-behavior-declaration-coverage

## verification approach

read vision requirements, check each against blueprint line by line.

---

## requirements from 0.wish.md

| requirement | blueprint coverage |
|-------------|-------------------|
| "it should tell them how to complete the goals" | ✅ codepath line 75-76, 84: `to fix, run: \`rhx goal.memory.set --slug X --why.purpose "..."\`` |
| `--mode hook.onStop` → `--when hook.onStop` | ✅ codepath line 67-68: `--when hook.onStop` |
| skill rename: `goal.infer.triage` → `goal.triage.infer` | ✅ filediff line 32-33: delete old, create new |
| bug: goals with status=incomplete shown as complete | ✅ codepath line 55-59: partition by `status.choice !== 'incomplete'` |
| per-goal tip in goal.triage.next | ✅ codepath line 99-100: `run \`rhx goal.memory.get --slug X\` to see the goal` |
| are achiever hooks registered? | ✅ vision verifies this; blueprint updates hook command |

---

## requirements from 1.vision.stone

### section: changes

| change | blueprint coverage |
|--------|-------------------|
| 1. field flags already exist | ✅ blueprint notes they exist, uses them in output |
| 2. actionable guidance per goal in goal.triage.infer | ✅ codepath lines 75-76, 84 |
| 3. actionable guidance per goal in goal.triage.next | ✅ codepath lines 99-100 |
| 4. skill rename | ✅ filediff lines 32-33, codepath line 65 |
| 5. flag rename | ✅ codepath lines 67-68 |
| 6. bug fix: status.choice partition | ✅ codepath lines 55-59 |
| 7. update hook command in getAchieverRole.ts | ✅ filediff line 24 |
| 8. shell entrypoint header update | ✅ implicit in skill rename |

### section: verification - achiever hooks registered

| verification | blueprint coverage |
|--------------|-------------------|
| hooks are registered in getAchieverRole.ts | ✅ filediff line 24: update hook command |
| userpromptsubmit.ontalk.sh also uses hook | ✅ filediff line 30: update this file too |

### section: hook performance

| verification | blueprint coverage |
|--------------|-------------------|
| hooks are fast, use isolated imports | ✅ vision confirms extant state, no blueprint change needed |

---

## requirements from usecases in vision

| usecase | blueprint coverage |
|---------|-------------------|
| brain sees incomplete goals | ✅ codepath shows output format |
| brain copies command, fills in value | ✅ command has placeholder `"..."` |
| brain re-runs triage to verify | ✅ triage required section says "then re-run" |
| hook halts on uncovered/incomplete | ✅ hook mode shows same output then exits 2 |

---

## questioned: did I miss any requirements?

re-read wish line by line:

1. "it should tell them how to complete the goals"
   - ✅ blueprint shows `to fix, run: \`rhx goal.memory.set --slug X --why.purpose "..."\``

2. "--mode hook.onStop -> --when hook.onStop"
   - ✅ blueprint codepath line 67-68

3. "are the achiever hooks registered into the Role.build?"
   - ✅ vision verified: hooks ARE registered in getAchieverRole.ts
   - ✅ blueprint updates the hook command (filediff line 24)

4. "do they import from their own scoped dir? i.e., goals dir? with minimum dependencies?"
   - verified: grep goal.ts imports shows:
     - `child_process` (builtin)
     - `helpful-errors` (lightweight)
     - `domain.objects/Achiever/Goal` (domain objects)
     - `domain.operations/goal/*` (goal operations)
     - `domain.operations/route/bind` (route bind)
   - NO heavy deps (openai, brain infrastructure)
   - ✅ vision confirms: "hooks don't load the heavy cli/review or cli/reflect paths"
   - no blueprint change needed, extant state is correct

5. "goal.infer.triage -> goal.triage.infer"
   - ✅ blueprint filediff line 32-33

6. "how is it possible that goal.triage.infer can consider a goal with status=incomplete as complete?"
   - ✅ blueprint codepath line 55-59 fixes this

7. "just have a subbranch under each (1), (2) under status that says `tip: run ...`"
   - ✅ blueprint codepath line 99-100 for goal.triage.next

---

## summary

all requirements from wish and vision are covered by the blueprint:

| category | count | covered |
|----------|-------|---------|
| wish requirements | 6 | 6/6 |
| vision changes | 8 | 8/8 |
| vision verifications | 3 | 3/3 |
| vision usecases | 4 | 4/4 |

no gaps found.
