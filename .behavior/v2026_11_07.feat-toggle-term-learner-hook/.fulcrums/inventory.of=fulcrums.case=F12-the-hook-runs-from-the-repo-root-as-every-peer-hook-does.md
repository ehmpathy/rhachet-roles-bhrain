# F12 — the hook runs from the repo root, as every peer hook does

## .the fork

- **A.** the command keeps relative paths (`.agent/repo=bhrain/role=learner`, `./node_modules/.bin/rhx`) and the 5s timeout, like the hook the learner withdrew
- **B.** anchor it on `$CLAUDE_PROJECT_DIR`, or have `get` probe whether the guard would pass from the caller's cwd

## .taken — A

- the withdrawn hook was `./node_modules/.bin/rhx learn.domain.terms --when hook.onStop` with `timeout: 'PT5S'` (`16928264:src/domain.roles/learner/getLearnerRole.ts:47-51`). the toggle restores that command, so the cwd assumption is the one the hook ran under before
- all 22 hooks in this repo's own `settings.of.repo.json` use a relative path (`./node_modules/.bin/rhx …` or `bash .agent/…`). a session whose cwd left the root breaks all 22, and this hook is not the one to fix that alone
- the repo forbids a cwd outside the gitroot (`rule.forbid.cwd-outside-gitroot`, with `Bash(cd:*)` denied)
- the face reads one sentinel and returns, far below 5s. the 5s is the bound the role declared

B splits this one entry from the pattern its 22 peers share, for a cwd the repo forbids. a `get` probe would test the caller's cwd, which is not the cwd the hook runs from.

## .rework — clean

one string in `TERMS_HOOK_DECLARED.command`, should rhachet adopt a project-dir anchor for all role hooks.

## .confidence — 85%, why not higher

the guard turns a misfire into a silent exit 0 where the old hook failed loud. the trade is deliberate (F5): an unlinked learner must never error at each stop.

## .where

`src/domain.operations/learn/termsHook/TERMS_HOOK_DECLARED.ts`
