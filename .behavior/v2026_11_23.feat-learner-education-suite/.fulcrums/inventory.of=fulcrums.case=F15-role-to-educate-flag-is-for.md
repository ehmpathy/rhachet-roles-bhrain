# F15: the role to educate is named by `--for`, never `--role`

- **fork**: the caller flag that names the role a pursuit educates: (a) `--for` · (b) `--student` · (c) `--of` · (d) keep `--role` and ask callers to call the `.sh` direct
- **the defect it answers**: `rhx` reads `--role` as its own role filter and never forwards it. `rhx globsafe --pattern readme.md --role learner` refuses with `no skill "globsafe" found with --role learner`, so `rhx education.pursuit init --role mechanic` looks for the skill in the mechanic role and never reaches the face. the repo already treats `--skill/--role/--repo` as harness flags (`getOwnInvocationArgs`, `learn` case15)
- **taken**: (a) `--for`. it reads as the sentence the director says (`init a pursuit --for mechanic`, `pedigree get --for mechanic`), collides with no harness flag, and keeps the internal field `role`. (b) names the role by a metaphor the code never uses; (c) is the verb `review._.cost` already takes for a breadth (`--of run`), a second sense; (d) breaks the documented `rhx` path
- **also**: `asEducationArgs` now drops every harness flag through `getOwnInvocationArgs`, wherever it sits, so a flag order no longer matters
- **rework**: clean — one flag name across the three faces, their help, their refusals, the skill headers, the vision cases, and the snapshots; no caller outside this suite
- **confidence**: 80% — the defect is proven; the word is a best guess
- **where**: `src/contract/cli/education.{pursuit,pedigree}.ts` · `src/contract/cli/asEducationArgs.ts` · `src/domain.operations/education/{getOneEducationRole,initCourseRoute}.ts` · `src/domain.roles/learner/skills/education.*.sh` · `1.vision.experience.case=*.md`
- **verdict**: open — the foreman rules on the word
