# rule.require.agent-skill-tests-collocated

> **a test of a `.agent/repo=.this` skill lives beside that skill, in the agent dir, at integration
> grain. never under `blackbox/`.**

```
.agent/repo=.this/role=any/skills/$skill.sh
.agent/repo=.this/role=any/skills/$skill.integration.test.ts
.agent/repo=.this/role=any/skills/__snapshots__/$skill.integration.test.ts.snap
```

## .why

- `blackbox/` holds acceptance tests of the **published contract**: the built package, called the
  way a consumer calls it. a repo-local skill ships to no consumer, so it is no part of that contract
- a skill run in a real process, against this repo, is integration grain
- beside the skill, its test is found by the one who edits the skill, and moves with it

## 🔴 .the two hazards a move must cure — both are silent

| the hazard | what goes wrong | the cure |
|---|---|---|
| jest `testMatch` lists `'!**/.agent/**'` | a moved suite is **skipped by construction**, and no check turns red. a negation beats any positive glob, so a positive pattern cannot let it back in | drop the negation; a `testPathIgnorePatterns` regex cuts `.agent/` save `repo=.this/`: `'/\\.agent/(?!repo=\\.this/)'` |
| a file in `skills/` that no glob names **boots as a skill ref** | each test and snapshot charges every session a path, and can tip the boot past its cap | list `skills/*.test.ts` and `skills/__snapshots__/**` under `always.skills.not` |

⇒ **prove the move, never assume it.** run each moved suite and match its test count to the count
before the move; then confirm ci's shard logs list each moved file.

| when… | then… |
|---|---|
| you write a test for a skill under `.agent/repo=.this/` | 🔴 put it beside the skill, `.integration.test.ts` |
| you move one in | match the test count before and after; a zero is the first hazard |
| you add a file to a `skills/` dir that is not a skill | name it under `always.skills.not`, or it boots |
| a moved suite resolves paths from `__dirname` | the repo root is four levels up: `'../../../..'` |

blocker: a test of a `.agent/repo=.this` skill under `blackbox/` · a jest config that skips
`.agent/repo=.this/**` · a test file in `skills/` that boots as a ref.

⇒ see also: `jest.integration.config.ts` (the lookahead) · `boot.yml` (`always.skills.not`) ·
`rule.forbid.unbounded-recursive-globs`.
