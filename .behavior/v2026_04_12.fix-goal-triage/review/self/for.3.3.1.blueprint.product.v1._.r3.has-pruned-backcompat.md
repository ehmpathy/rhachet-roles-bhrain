# self-review r3: has-pruned-backcompat

## backwards compatibility review

for each backwards-compat concern, ask: was it explicitly requested? or did we assume it "to be safe"?

---

## potential backcompat 1: alias `--mode` to `--when`

**what the blueprint says**: hard break. no alias.

**did we add backwards compat?** no. we chose hard break.

**was this decision explicit?** yes. the vision says:
> **decision**: hard break. we control the only consumer (`getAchieverRole.ts`). update hook command in same PR.

**verdict**: no backcompat added. this is correct.

---

## potential backcompat 2: keep old skill name `goal.infer.triage`

**what the blueprint says**: delete old shell skill, create new one.

**did we add backwards compat?** no. we delete the old skill.

**was this decision explicit?** yes. wisher said: "they should be symmetric"

**verdict**: no backcompat added. this is correct.

---

## potential backcompat 3: old hooks that use `--mode` or old skill name

**question**: should we update docs or emit deprecation warnings?

**answer**: no. we control the only consumer (`getAchieverRole.ts`). the hook command is updated in the same PR. no external consumers exist.

**evidence**: vision confirms "we control the only consumer"

**verdict**: no backcompat needed. no external consumers.

---

## potential backcompat 4: old package.json exports

**question**: if `goal.infer.triage` was exported, do we need to preserve the old export?

**answer**: need to verify package.json exports at implementation. but skill entrypoints are typically not exported — they're invoked via shell.

**verdict**: verify at implementation. likely no backcompat needed.

---

## summary

the blueprint has no backwards compatibility concerns:
- `--mode` → `--when`: hard break (wisher confirmed)
- skill rename: hard break (wisher confirmed)
- hook command: updated in same PR
- no external consumers to break

no backcompat was added "to be safe".

