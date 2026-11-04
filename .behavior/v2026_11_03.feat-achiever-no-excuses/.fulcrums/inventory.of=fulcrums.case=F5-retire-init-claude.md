# F5 — retire init.claude.sh

- fork: (a) delete it and wire onStop via `Role.hooks` in `getAchieverRole.ts`; (b) write the absent `init.claude.hooks.sh`
- taken: (a)
- why: `src/domain.roles/achiever/inits/init.claude.sh` calls `init.claude.hooks.sh`, which does not exist, and edits `.claude/settings.json` by hand. rhachet applies `Role.hooks.onBrain` itself; onBoot, onTool, and onTalk are wired that way today
- rework: clean
- risk: none — local claude settings, applied by rhachet's own hook mechanism; it touches no credential and writes no prod
- confidence: 90%
- verdict: open
