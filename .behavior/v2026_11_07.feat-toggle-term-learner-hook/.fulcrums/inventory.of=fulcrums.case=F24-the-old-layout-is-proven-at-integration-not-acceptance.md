# F24 — the old layout is proven at integration, not through `npx rhx`

## .the fork

- **A.** the old layout (`.claude/settings.json` is the real file) is clamped at integration (case2, case4, case5, case12, case14–16), through the same cli wrapper the published `rhx` runs; every acceptance scene runs on the layout `rhx init` lays out, the split one
- **B.** add an acceptance scene that stages the old layout under `npx rhx`

## .taken — A

every acceptance scene must link the learner, so that `rhx` finds the skill, and only `rhx init` links it. `rhx init` lays out the split layout, so an old-layout scene through the published cli must undo the init's own layout by hand: remove the `.claude` link, then write a real `.claude/settings.json` in its place. that hand edit is the whole difference the scene would test, and integration already writes that same file and runs every verb over it. the layout decides only which path the toggle picks (`getOneTermsHookTarget`), and both layouts reach it through one cli.

## .rework — clean

one more `given` in the acceptance file, built on the REFUSALS shape; no prod change.

## .confidence — 80%, why not higher

a repo laid out by an older rhachet could still hold the old layout with the learner linked, so a published-cli scene of it would mirror a real repo. the layout pick it would exercise is the same code integration runs.

## .where

`blackbox/learner.terms.hook.journey.acceptance.test.ts` (header `.note`) · `src/contract/cli/learn.terms.hook.integration.test.ts` (case2, case4)
