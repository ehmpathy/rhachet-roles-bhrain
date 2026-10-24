# F31 — the transformer unit tables stay data-driven

- **the fork:** five new transformer unit suites run a `TEST_CASES` table through `test()`. (a)
  wrap each row in given/when/then · (b) keep the table as written
- **taken:** (b). `rule.prefer.data-driven` (ehmpathy/mechanic) names exactly this shape —
  `TEST_CASES.map(thisCase => test(thisCase.description, ...))` — as the preferred form for
  transformer unit tests, and `rule.require.given-when-then` marks the bdd frame required for
  integration tests and recommended for unit tests. each row is one input and one output, so a
  given and a when would repeat the description twice. the integration and acceptance suites in
  this pr use given/when/then throughout
- **verdict, 5.3 i002: reversed to (a), and reworked.** the reviewer showed the two rules compose:
  a table can emit through the bdd frames, and the pr's other pure-transformer suites
  (`sanitizeBranchName.test.ts`, `asErrorCauseClause.test.ts`) already do. each row is now
  `given('[caseN] <description>') > when('[t0] …') > then(…)`, the table kept; six suites, the
  new `asStatusLineCacheDropFaultRow.test.ts` included. 18 tests pass, snapshots renamed
- **rework:** clean — a mechanical wrap of five tables
- **confidence: 80%**
- **where:** `asRouteStatusLineCachePath.test.ts`, `asRouteStatusLineRouteDir.test.ts`,
  `isRouteStatusLineCacheAgeWithinMax.test.ts`, `asStatusLineFaultRow.test.ts`,
  `asRouteBindFlagName.test.ts`
