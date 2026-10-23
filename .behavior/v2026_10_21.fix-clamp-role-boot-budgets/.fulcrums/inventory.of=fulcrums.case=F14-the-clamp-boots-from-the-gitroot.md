# F14 — the clamp test runs the real `roles boot` from the gitroot

## the fork

`roleBootClamps.integration.test.ts` spawns `rhachet roles boot --what <bootUri>` per role.

- **A** — run it with `cwd: REPO_ROOT`, the gitroot
- **B** — run it from a temp dir, so any write the cli makes lands in a disposable place
  (peer `arch-hazards-behavior` i002 nitpick.3)

## taken: A, and why

- `roles boot` only reads and prints. it writes no file. after the full suite and a `--resnap`
  run, `git status --untracked-files=all` lists no log, cache, or state file from a boot
- the paths it prints are relative to its cwd (`<brief.say path="src/domain.roles/…">`), and the
  test resolves the booted set against the gitroot. from a temp cwd, those paths would point at
  the temp dir, which breaks the read of the booted set
- `rule.forbid.cwd-outside-gitroot` (this repo) makes the gitroot the anchor for every subprocess
- the one write the suite makes, the over-budget fixture, already lives in a `genTempDir`

the anchor and its reason are a `.note` beside `runRhachet`.

## rework: clean

one `cwd` field in one communicator, plus a path rebase in two transformers.

## confidence: 85%, and why it is not higher

- "writes no file" is measured against today's rhachet. a later rhachet that logs or caches on
  boot would write into the tree, and only a `git status` after the suite would show it

## where

`src/domain.roles/roleBootClamps.integration.test.ts` (`runRhachet`) · peer
`arch-hazards-behavior` i002 nitpick.3.
