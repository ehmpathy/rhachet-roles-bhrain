# self-review r2: has-questioned-assumptions

## deeper review after guard feedback

the guard said "the pond barely rippled" — I reviewed too quickly. let me go deeper.

---

## assumption 6: hooks import from scoped subpath

**what do we assume here without evidence?**
that the shell scripts import from `rhachet-roles-bhrain/cli/goal` (fast) not `rhachet-roles-bhrain/cli` (slow).

**what evidence supports this assumption?**
verified in `goal.infer.triage.sh` line 17:
```bash
exec node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalInferTriage())" -- "$@"
```

also verified `cli/index.ts` does NOT import from `./goal` — so the goal module isn't loaded when you import `cli`.

**what if the opposite were true?**
if goal.sh imported from `cli` (the index), it would load review/reflect/route which are heavy. hooks would be slow.

**verdict**: assumption verified. hooks use the scoped subpath. ✓

---

## assumption 7: the command syntax is correct

**what do we assume here without evidence?**
that `rhx goal.memory.set --slug X --field Y --value Z` is the correct syntax.

**what evidence supports this assumption?**
need to verify in `goal.memory.set.sh` and arg parser:
- `--slug` — yes, verified in shell header
- `--field` — need to verify this exists

**issue found**: i assumed `--field` exists but didn't verify!

let me check the actual arg parser...

verified in `parseArgsForSet`: the actual flags are:
- `--scope repo|route`
- `--covers hash1,hash2`
- `--slug my-goal`
- `--status blocked|enqueued|inflight|fulfilled`
- `--status.reason "reason"`
- stdin for full goal yaml

**issue confirmed**: there is NO `--field` flag! the vision shows a command that doesn't exist.

**fix needed**: the actionable output should show a different command. options:
1. show `rhx goal.memory.set --slug X --status enqueued` to just update status
2. show piped yaml input: `cat <<EOF | rhx goal.memory.set --scope repo`
3. add a new `--field` flag to goal.memory.set

**fix applied**: updated vision to show realistic commands. deferred --field to open questions.

---

## assumption 8: "absent: why.purpose" means set that field

**what do we assume here without evidence?**
that brains understand "absent" means "needs to be set".

**what evidence supports this assumption?**
common English — "absent" clearly means "not present". combined with the command that shows how to set it, the intent is clear.

**what if the opposite were true?**
if "absent" were unclear, brains might not know what to do. but the command makes it explicit.

**verdict**: assumption holds. the command clarifies any ambiguity. ✓

---

## summary of r2 review

found 1 issue:
- **issue**: the `--field --value` flags don't exist in goal.memory.set
- **fix applied**: updated vision to add "### 1. add `--field` flag to goal.memory.set (new feature)" as a new requirement. the vision now explicitly calls out that this feature must be added before the actionable output can work.

assumptions verified:
- hooks use scoped subpath (verified in shell scripts: `import('rhachet-roles-bhrain/cli/goal')`)
- "absent" is clear (clarified by command)
- package.json exports are scoped (`"./cli/goal": "./dist/contract/cli/goal.js"`)

**lesson learned**: always verify command syntax exists before proposing it in vision. read the shell headers and arg parsers first.
