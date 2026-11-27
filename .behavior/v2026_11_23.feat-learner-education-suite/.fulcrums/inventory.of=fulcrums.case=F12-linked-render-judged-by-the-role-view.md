# F12: a linked role's clean render is judged by the entry in the role's own view

- **fork**: (a) the `4.graduate` judge checks the entry shows in `.agent/repo=$pkg/role=$slug/briefs/education/` · (b) the judge reads rhachet's view record (`refusal: null`) · (c) the judge runs `rhx init --hooks` itself
- **taken**: (a). rhachet rebuilds a linked role's own dir from its mod links, keyed by each `briefs/…` path (`setRoleModdedView`), and a refused mod returns that dir to its published form (`syncRoleModdedViews`). so the entry shows there only after a clean render. (b) reads a record path and shape rhachet does not export; (c) gives a judge a write side effect
- **rework**: clean — one private helper, `asPedigreeDirRendered`, in `getOneEducationJudgeVerdict.ts`
- **confidence**: 80% — the layout was read from rhachet 1.54.1's dist, and the clamp (`[case3]`) proves the judge against a fixture of that layout, not against a live render
- **where**: `src/domain.operations/education/getOneEducationJudgeVerdict.ts`; journey `[case3]`
- **verdict**: unresolved — a live linked pursuit at 5.3 verification settles it
