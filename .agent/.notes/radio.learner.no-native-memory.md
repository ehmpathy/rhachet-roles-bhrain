## what

add a claude-code hook that stops use of claude code's **native memory** features and redirects all knowledge capture into this repo's rhachet briefs and skills under .agent/repo=.this/role=any.

## why

- this repo's knowledge system is rhachet briefs (.agent/repo=.this/role=any/briefs/) and skills (.agent/repo=.this/role=any/skills/), not claude code's built-in memory
- claude native memory (the memory tool, ~/.claude memory writes, the "#" memory shortcut, CLAUDE.md auto-memory) creates a competing, untracked source of truth that drifts from the briefs/skills system
- knowledge should be externalized into versioned briefs (per rule.always.externalize.lessons.into_briefs) and tactics into skills (per rule.always.externalize.tactics.into_skills), so it is reviewable, shareable, and lives in the repo

## scope

- add a hook that blocks claude's native memory tool calls (investigate the current claude-code memory surface first to enumerate exactly what to intercept)
- on block, the stderr nudge must redirect the agent into .agent/repo=.this/role=any:
  - lessons -> write a brief in .agent/repo=.this/role=any/briefs/ (per rule.always.externalize.lessons.into_briefs)
  - tactics -> write a skill in .agent/repo=.this/role=any/skills/ (per rule.always.externalize.tactics.into_skills)
- wire the hook into the learner role's init / hooks apply step, consistent with how other roles register PreToolUse hooks in .claude/settings.json
- keep the message owl-themed and point at the externalize rules

## acceptance

- any attempt to use claude native memory is blocked with a clear stderr nudge pointing into .agent/repo=.this/role=any/briefs and .agent/repo=.this/role=any/skills
- the hook is registered via the learner role boot/init so it applies on: rhachet roles boot --role learner
- a brief documents the decision (why native memory is forbidden here, redirect into .agent/repo=.this/role=any) so the rule is discoverable

## refs

- .agent/repo=bhrain/role=learner/briefs/rule.always.externalize.lessons.into_briefs.md
- .agent/repo=bhrain/role=learner/briefs/rule.always.externalize.tactics.into_skills.md
- prior PreToolUse hook patterns in .claude/settings.json (e.g. mechanic's forbid-* hooks)
