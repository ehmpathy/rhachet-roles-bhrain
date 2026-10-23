# F20 · two extant outputs change on purpose: exit 0 on a human-fixable state, and no backup of a seeded target

## the fork
- (a) keep both changes: a state a human must fix warns and exits 0 (an absent config included), and a
  target the run seeded empty earns no backup
- (b) revert both: exit 2 and `status = blocked` on an absent config, and a backup of the seeded `{}`

## .taken, and why at the time
(a), on both.

**exit 0.** the settled seed S2 (`.seeds/inventory.of=seeds.case=S2-init-never-fails-an-upgrade.md`; its
`.settled` reads: a role init that cannot bind the status line degrades to a warn, never a nonzero exit) says `rhx init` and `rhx upgrade` must never fail on this init: the symptom the
human reported was red output on `rhx upgrade` for a state they could fix. an absent `.jsonc` is a partial
install, which the human fixes by a reinstall, so it is the same family as a link, a malformed target, and a
dangled grove. the loud signal moved from the exit code to the warn tree (status, reason, settings, fix), which
is asserted and snapped. a genuine malfunction (a jq fault) still exits 1, loud, and is now tested.
`rule.require.exit-code-semantics` says a caller-must-fix constraint exits 2; S2 overrides it for this init, on
purpose, because rhachet's init frame turns any nonzero exit into a red `rhx upgrade`.

**no backup of a seeded target.** a peer reviewer of the 5.1 stone raised that a first bind seeded `{}`, backed
it up, and printed `backup = …` for a file with no content; the repair is `backup = none`. the old-layout
`[case1]` snapshot moved with it, and the `[case3]` first-run baseline went from one backup to none (its
assertion, "a rerun adds no backup", holds against either baseline).

## .rework
clean — a revert of either is one function and its snapshots.

## .confidence — 85%, and why it is not higher
S2 covers every init that cannot bind, and an absent `.jsonc` is one; no sentence names an absent `.jsonc`
alone, so the reach to that state is mine.
a wisher who wants a loud exit for a partial install would take (b) for that one state.

## .where
`src/domain.roles/driver/inits/init.claude.status-line.sh` (`warn_not_configured`, `BACKUP_LEAF`),
`src/domain.roles/driver/inits/init.claude.permissions.route.sh` (`warn_not_healed`, `BACKUP_LEAF`).

## .verdict
confirmed by the wisher, 2026-10-17: keep exit 0 for every state a human can fix, an absent config included
