# F8 — the repo root is the cwd rhx dispatched from

## .the fork

- **A.** `repoRoot = process.cwd()`, as every learner face does
- **B.** derive the root by `git rev-parse --show-toplevel` or a walk up

## .taken — A

`rhx` finds a skill under `<cwd>/.agent/repo=*/role=*/skills`
(`rhachet/dist/domain.operations/invoke/discoverSkillExecutables.js`), so `rhx learn.terms.hook`
run from a subdir finds no skill at all: the toggle only ever runs with cwd at the repo root. the
repo law binds the same: cwd never leaves the gitroot (`rule.forbid.cwd-outside-gitroot`). the
peer face `learn.domain.terms` reads `process.cwd()` the same way.

B adds a git dependency to a toggle that needs none, to cover a call path rhx cannot reach.

## .rework — clean

one line in `learnTermsHook`, should rhx ever dispatch from a subdir.

## .confidence — 90%, why not higher

a caller could invoke the skill file directly (`bash …/learn.terms.hook.sh`) from a subdir; that
path bypasses rhx and its contract.

## .where

`src/contract/cli/learn.terms.hook.ts`
