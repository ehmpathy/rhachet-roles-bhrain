# diagnosis.adhoc — snapshot coverage & acceptance-journey coverage
 
scope: two rubrics only — `ergo-contract-snapshots` and
`ergo-acceptance-journey-coverage`. no mechanic, repo-rules, test-intent, or
snapshot-visual-blemish findings are included here. those are other lanes
territory (in particular, the raw-JSON-metadata-dump-under-the-human-message
blemish, tracked by `.dream/v2026_09_10.fix.every-cli-error-appends-a-raw-json-context-dump.md`,
is a visual blemish on an already-committed snapshot, not a missing-coverage
gap, and is explicitly out of scope here). 
## .prior context
 
This behavior 5.3.verification stone went through 20+ peer-review
iterations (i001 through i022) on exactly these two rubrics. Every round, the reviewer
found one more new deterministic CLI/stderr surface (pour announce, group-leak
advisory, the three RHACHET_*_TIMEOUT_MS readers routed through
asGuardPositiveInt, the empty-string edge of each env override, the 12-wide
roster, the tail status-line) that had no committed toMatchSnapshot()
oracle, and the driver repaired nearly every one. A few were correctly
REFUTED (stderr transient spinner sequence is not a stable contract, so it
stays un-snapped by design). Verified as landed in the current tree: 
- i001/i004: driver.route.peer-concurrency-default and the positive
  [journey] arm of driver.route.peer-concurrency-env gained
  toMatchSnapshot().
- i004/i005/i006: pour-announce plus F13 group-leak advisory snapshotted at
  [t0]/[t1]/[t5]; the i006 truncated-mid-sentence defect is fixed.
  the filter at blackbox/driver.route.peer-concurrency.acceptance.test.ts:936-947
  now captures the whole six-line advisory.
- i006/i018/i019/i020: refusal punctuation AND the missing repair-hint on the
  asGuardPositiveInt numeric refusals are fixed. the template at
  src/domain.operations/asGuardPositiveInt.ts:65 now ends with a repair
  clause, and the committed snapshot reflects it. Also, i012/i018/i020: all three RHACHET_*_TIMEOUT_MS readers each have a
  dedicated acceptance suite with both the abc and empty-string variants
  snapshotted.
- i013: the volatile .log/bhrain/review/<iso>.<pid>.<uuid>/ segment is now
  masked via an extension to sanitizeTimeForSnapshot.
- i019/i020: three hand-rolled child-env builders consolidated into one
  exported asChildEnv; the hand-rolled scene in
  review.timeout-env-refusals.acceptance.test.ts replaced with useBeforeAll.
- i019 r002 nitpick.1 (12-member roster as one unbroken line) has no recorded
  taken.by_self, but the current snapshot already renders one member per
  branch. closed by the time this diff landed. Also, i020: the tail status line in genContextCliEmit.test.ts gained a
  committed snapshot, and the one un-snapped journey step in the whole corpus
  ([case10] in driver.route.peer-concurrency.acceptance.test.ts) gained
  its stdout has good vibes snapshot.
- i022 never produced a report (the reviewer own context window overflowed
  before rendering an opinion). no unresolved finding to carry forward.
 
Net: no OPEN, unaddressed r002/r004 finding from the prior thread still
reproduces in the current tree. 
## .findings
 
Both rubrics were re-run fresh against the current diff across every
new/changed src/contract/ file and every new acceptance suite named in the
task brief.
 
Contract-snapshot exhaustiveness:
- judgeReviewed slug-based tally fix in src/contract/cli/route.ts is
  covered by a new src/contract/cli/routeStoneJudgeTally.acceptance.test.ts,
  which spawns the real CLI twice (both bug directions) and snapshots the
  whole judge stdout each time. Also, the --help text change to route.drive is covered by a new
  routeDriveHelp.test.ts, which drives the real help path and snapshots it.
- The new routeStoneSetContemplation.acceptance.test.ts drives the real CLI
  and ships a 628-line .snap.
- src/contract/cli/telepath.ts is not part of this feature. it belongs to
  an unrelated behavior (.behavior/v2026_09_04.feat-telepath-role/) present
  in the diff for unrelated reasons; it was not graded here, matching how
  every prior round on this behavior also left it unscoped. 
Acceptance-journey coverage: every new suite named in the task brief
(peer-concurrency-default/-env/-solo/-refusals, peer-concurrency,
peer-level-unlock-latch, peer-fallback-timeout-refusal,
peer-pour-timeout-refusal, review.timeout-env-refusals, the renamed
peer-budget-multimember-l1) exercises a real CLI spawn and snapshots its
deterministic output, with both positive and malformed/edge variants pinned
where the surface has a refusal arm. 
No new contract-surface change in this diff (the concurrency/group/
groups guard-yaml keys, the three timeout env vars, the level-unlock latch,
the judge slug-based tally fix) renders through the CLI without an
acceptance/snapshot test exercising it end-to-end.
 
No blockers or nitpicks are raised. The two rubrics graded here are, as of
this diff, fully closed.
 
0 blockers
0 nitpicks