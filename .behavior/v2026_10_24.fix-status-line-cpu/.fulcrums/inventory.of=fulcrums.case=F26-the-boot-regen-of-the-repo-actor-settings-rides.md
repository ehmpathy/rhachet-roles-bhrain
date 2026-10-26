# F26 — the boot's regen of the repo actor settings rides this pr

- **the fork:** the boot's `rhx upgrade` re-rendered
  `.agent/.actors/actor.via.repo=ambient/brain/.claude/settings.of.repo.json` (a 350-line reorder
  that narrowed one `.route/**` grant).
  (a) keep it in the pr · (b) revert it to `origin/main` · (c) split it into its own pr
- **taken:** (a), the file as this branch's own driver init renders it. the boot repair rides this pr
  by the commander's instruction, and a file stale against the installed package re-renders on the
  next `rhx upgrade` in any seat, unreviewed
- **the evidence:** a reviewer must not diff a permission change by hand, so the set diff is a skill,
  `rhx settings.permissions.diff --of <path> --from <rev>` (acceptance
  `blackbox/settings.permissions.diff.acceptance.test.ts`)
- **the verdict, at 5.3:** a rerun of this branch's driver init
  (`npx rhachet roles init --repo bhrain --role driver`) healed the `.route/**` grant and restored
  main's order. against `origin/main` the file now differs by one line — the status line command,
  `cli/route` → `cli/route.status.line` — and the set diff reads 0 added, 0 removed on allow, deny,
  and ask. ⇒ the reorder and the narrowed grant no longer ride; what rides is `case=4` itself
- **rework:** clean — `git checkout origin/main -- <path>` leaves the seat on the legacy command,
  which still hits the cache (`legacy warm`)
- **confidence: 90%**
- **where:** the settings file above; `.agent/repo=.this/role=any/skills/settings.permissions.diff.sh`
