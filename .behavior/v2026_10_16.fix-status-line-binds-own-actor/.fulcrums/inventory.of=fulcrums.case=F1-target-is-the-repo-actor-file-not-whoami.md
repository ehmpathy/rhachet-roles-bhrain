# F1 · the target is the repo actor's file, not the whoami actor's

## .the fork
- **A (wish spec)** — `ACTOR_EXID=$(rhachet clone whoami …)`, write `actor.via.$EXID/brain/.claude/settings.of.repo.json`
- **B (taken)** — write `<repo>/.claude/settings.of.repo.json`, the repo actor's file

## .taken, and why at the time
rhachet 1.49.2 `genBrainCliConfigArtifact` rewrites a non-repo actor's `settings.of.repo.json`
whole from the repo actor's on each enroll and each `rhx init --hooks`. so A survives the layout
findsert and dies at the next derivation — the same silent loss. B writes the source; the
derivation carries it to every actor (non-hook keys pass through `getSettingsForRoles`).
`<repo>/.claude` is always the repo actor's dir (`setRepoBrainDirSymlink`), and rhachet's own doc
names it as the role-init write door.

## .rework
clean — the target is one assignment in one init, plus its tests.

## .confidence — 90%, and why not higher
read from dist at 1.49.2 only; a later rhachet could stop the derivation or narrow non-hook keys.
the wisher may hold a reason outside the code (e.g. a planned per-actor settings model).

## .where
`src/domain.roles/driver/inits/init.claude.status-line.sh:31`

## .verdict
— (open, for the vision gate)
