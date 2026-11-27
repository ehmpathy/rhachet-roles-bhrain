# F031 — a hook skill reads its payload on stdin with no `@stdin` flag

- **fork**: the skeptic's hook skills read the hook json on stdin by default; or they take it only behind an explicit flag (`--payload @stdin`), per `rule.require.explicit-stdin-flags`
- **read**:
  - Claude Code hands every hook its event json on stdin, and rhachet's dispatcher passes it through; the role's hook commands (`getSkepticRole.ts`) are the ones a session runs, and every bhrain hook skill reads stdin the same way (`route.drive --when hook.onStop`, `memory.guard`)
  - the rule's own example is a human command (`goal.set --reason @stdin`), where a pipe that a human did not mean would be read as input
  - a human hand run with no pipe now reads naught (the tty guard added this round), so the surprise the rule guards against is gone; each skill's `--help` names the stdin form
- **taken**: keep stdin as the hook contract
- **rework**: clean. a `--payload @stdin` flag on seven skills and seven hook commands
- **confidence**: 80%
- **where**: the seven skills under `src/domain.roles/skeptic/skills/`, `getSkepticRole.ts`
- **verdict**: open — peer review i001 (repo-rules nitpick.1)
