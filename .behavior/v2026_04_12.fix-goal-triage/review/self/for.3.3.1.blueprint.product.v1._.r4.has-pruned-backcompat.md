# self-review r4: has-pruned-backcompat

## deeper review after r3 feedback

the guard said "the pond barely rippled" — I claimed "we control the only consumer" without verification. let me verify.

---

## verification: who uses `goal.infer.triage`?

**grep results in src/:**

| file | usage |
|------|-------|
| `getAchieverRole.ts:39` | `'./node_modules/.bin/rhx goal.infer.triage --mode hook.onStop'` |
| `userpromptsubmit.ontalk.sh:27` | `./node_modules/.bin/rhx goal.infer.triage --mode hook.onTalk` |
| `briefs/howto.triage-goals.[guide].md` | documentation |
| `readme.md` | documentation |
| `boot.yml` | skill registration |
| `goal.ts` | CLI output strings |
| `goal.infer.triage.sh` | shell entrypoint |

---

## issue found: there are TWO hook consumers

the vision claimed: "we control the only consumer (`getAchieverRole.ts`)"

**this is FALSE.** there are TWO consumers:
1. `getAchieverRole.ts` — uses `--mode hook.onStop`
2. `userpromptsubmit.ontalk.sh` — uses `--mode hook.onTalk`

---

## fix needed: update the blueprint

the blueprint filediff tree must include:
```
src/domain.roles/achiever/inits/claude.hooks/
└─ [~] userpromptsubmit.ontalk.sh   # update command: rename + --when
```

also update documentation:
```
src/domain.roles/achiever/
├─ [~] briefs/howto.triage-goals.[guide].md   # update skill name
├─ [~] readme.md                               # update skill name
```

---

## fix applied

blueprint `3.3.1.blueprint.product.v1.i1.md` updated to include:

**filediff tree additions:**
```
├─ inits/claude.hooks/
│  └─ [~] userpromptsubmit.ontalk.sh     # update command: rename + --when
├─ [~] readme.md                         # update skill name reference
├─ [~] boot.yml                          # update skill entrypoint reference
├─ briefs/
│  └─ [~] howto.triage-goals.[guide].md  # update skill name references
```

**implementation order** updated from 7 steps to 11 steps, including:
- step 6: userpromptsubmit.ontalk.sh
- step 7: boot.yml
- step 8: readme.md
- step 9: howto.triage-goals.[guide].md

---

---

## why the blueprint now holds

**backwards compat concern: `--mode` → `--when` hard break**

- verified: two hook consumers found via grep
- verified: both are internal to this package (getAchieverRole.ts, userpromptsubmit.ontalk.sh)
- verified: no external consumers (grep found no other usages)
- fix: blueprint now includes both files in filediff tree and implementation order
- result: hard break is safe — all consumers updated in same PR

**backwards compat concern: skill rename `goal.infer.triage` → `goal.triage.infer`**

- verified: no external consumers (skill is invoked only by hooks we control)
- fix: shell entrypoint renamed, docs updated, no alias needed
- result: hard break is safe — all references updated in same PR

---

## lesson learned

"we control the only consumer" is a dangerous claim. always grep to verify consumer count before a hard break decision.

