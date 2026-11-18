# F26 — the wider role list waits for its own pr

## .the fork

- **A.** this pr keeps main's `prepare:rhachet` role list (mechanic through learner), main's `.agent/keyrack.yml`, and no hooks for roles main does not link. the package bumps stay
- **B.** this pr links the wider list (achiever, telepath, operator, observer, deployer, playwright, enroller), with the ghlitch keyracks it extends and the hooks `rhachet init` lays out for those roles
- **C.** B, plus an `AWS_PROFILE` or `AWS_ACCESS_KEY_ID` secret for CI's test env

## .taken — A

the wider list was in the work tree before this route opened, and the toggle needs none of its roles. it first ran at the checkpoint, when the rebase's lock refresh triggered `prepare`. the ghlitch observer and operator keyracks require `AWS_PROFILE` (or `AWS_ACCESS_KEY_ID`) in every env, and CI holds neither, so every brain suite stopped at the keyrack step. B breaks CI. C needs a secret only a human can set. the wish's nano bound settles it: the toggle only.

## .rework — clean

restore the role list in its own pr, once CI holds the AWS key. `rhachet init --hooks` then lays the hooks and keyracks back out.

## .confidence — 85%, why not higher

someone added the wider list on purpose, and this pr defers it with no word from them.

## .where

`package.json` (`prepare:rhachet`) · `.agent/keyrack.yml` · `.agent/.actors/actor.via.repo=ambient/brain/.claude/settings.of.repo.json`
