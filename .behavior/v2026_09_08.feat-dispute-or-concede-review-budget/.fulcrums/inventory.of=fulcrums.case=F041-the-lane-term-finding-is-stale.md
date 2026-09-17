# F041 — the "lane" domain term point is stale, already resolved

## the fork

`enroll-impl-behavior-intent` (r010, i008) lists as "genuinely still open, never answered in any
round": *"`lane` domain term — never itemized into `domain.terms/` (raised i006, repo-rules)."*

## taken

dispute. `lane` IS itemized — as a forbidden contract synonym of the canonical term `peer`, in
`.agent/repo=.this/role=any/briefs/domain.terms/term=route.guard.review.peer._.choice.reason.md`
under `## 🔴 .why lane is forbidden in a contract, though it is the natural prose word`, with a
full `.evidence` section (measured grep counts, cluster count) and a `.disputes` section that
states why no dispute is open.

## why disputable

the point checks whether a cluster exists at a path shaped like `term=lane`. none does, because
`lane` names no distinct concept — it is a synonym OF `peer`, and the canonical entry lives
under the `peer` boundary, exactly as `rule.forbid.domain-term-synonyms` prescribes: the synonym
is recorded on the canonical term's own cluster, never minted a cluster of its own.
`rule.forbid.domain-term-itemization` is satisfied by that entry.

## rework

clean. no code or doc changes anywhere near it.

## confidence

95% — the cited cluster file is on disk, dated, with a measured evidence section.
