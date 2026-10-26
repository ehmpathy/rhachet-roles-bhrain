# F35 — the consumer patch leaves role assets out

- **the fork:** pnpm refused the whole patch at install (`ERR_PNPM_PATCH_FAILED`), though
  `git apply --check` passed. the cause: a consumer's host holds role assets read-only. rhachet
  links them read-only, and pnpm's store hardlinks one inode per content, so the copy pnpm patches is
  read-only, and its engine cannot write it. the one changed asset is the driver init's
  `init.claude.status-line.jsonc`. (a) leave assets out, name them, and let an init write the old
  command until the release · (b) a delete-then-create pair for the asset, which rests on a write
  to its directory, equally unproven · (c) no consumer patch; the release alone
- **taken:** (a). the cpu cure is in the compiled `.js`: the legacy `cli/route` export forwards to
  the cached entry, so a seat that keeps the old command gets the hit (`legacy warm`, 0.700s
  against 0.967s). the subpath command (0.059s) is one settings line a consumer may set by hand,
  and the release's init sets it for all
- **against:** a consumer that re-runs the inits meanwhile gets the smaller cut, not the full ~16×
- **rework:** clean — the skill's overlay filter, one case (`[case10b]`), and the pr body's steps
- **confidence: 85%** — the read-only mechanism is inferred from the observed mode and the
  hardlink model; the observed facts are the mode on the installed copy and pnpm's refusal
- **where:** `.agent/repo=.this/role=any/skills/gen.consumer-patch.sh`,
  `.agent/repo=.this/role=any/skills/prove.consumer-patch.sh`,
  `blackbox/gen.consumer-patch.acceptance.test.ts` `[case10b]`
- **found:** at the done gate, when the patch was first installed the way a consumer would. every
  copy of it since F15 had passed `git apply --check` and would not have installed
