# fulcrum F27: peer concerns held in verification round one

## .the fork

a peer concern in 5.3.verification i001 that the driver judges a misfire: concede it (change the
code to the reviewer's shape) or dispute it (keep the code, cite the evidence, let the council rule).

## .the concerns held

### r9 mech-test-scope-purity blocker.1 — the firewall case2 fixture key

- **the claim**: `blackbox/keyrack.firewall-key-absent.acceptance.test.ts` case2 fakes
  `OPENROUTER_API_KEY` (`'fixture-key-firewall-grants-on-presence'`), against
  `rule.forbid.acceptance.mocks`; restore the fail-loud guard on an absent env key
- **taken**: dispute. the value is the input of the system under test, not a credential the test
  authenticates with
  - the subject is `keyrack firewall`, which reads a json map of secrets from stdin and reports a
    row per declared key (`invokeFirewall`, lines 28–52). case1 feeds it `{}`; case2 feeds it a map
    with the key present. both are fixtures of the same input, on the same axis: absent vs present
  - the firewall grants on presence and never calls openrouter (case2 `.note`, lines 135–138), so a
    real key would prove naught more: the granted row's contract (`status: granted`, slug
    `ehmpathy.test.OPENROUTER_API_KEY`, exit 0, the secret echoed exactly once, masked in the snap)
    is identical for any non-empty value
  - no mock is present: the real `rhachet` binary runs as a child process with a clean env
    (`PATH` + an empty `HOME`)
  - to restore the env-key guard would make a keyless run red on a case that needs no key, against
    the foreman's F16 (a) verdict that the keyless run is this stone's verification; the live
    provider call is proven under `BRAIN_LIVE=true` by the brain-backed review suites
- **rework**: clean — revert lines 135–141 to the env read + ConstraintError, and gate case2 with
  `given.runIf(RUN_BRAIN_TEST)`
- **confidence**: 85% — the rule's text forbids a fake credential outright; the hold rests on the
  value not acting as a credential in this test

### r3 mech-external-contracts blocker.1 — the live-brain gate as a credential bypass

- **the claim**: `RUN_BRAIN_TEST` skips every real provider call on a default run, a bypass
  `rule.require.external-contract-integration-tests` forbids
- **taken**: dispute the gate, repair the stale claim beside it
  - the gate is the foreman's own verdict: F16 (a), per given, bulletin
    `live-brain-tests-three-tiers`. this stone is told to prove a keyless run; to un-gate is to
    overrule the foreman, which the driver may not
  - the rule's floor holds: real provider tests exist (the 41 gated givens, the stepReview and
    stepReflect suites) and run under `BRAIN_LIVE=true` against real keyrack creds; the
    lack-of-creds case runs keyless on every run (`keyrack.firewall-key-absent` case1: the CI step
    names `OPENROUTER_API_KEY` absent, with its fix)
  - no gate is silent: each carries `// a live brain: runs only on BRAIN_LIVE=true (bulletin
    live-brain-tests-three-tiers)`; none is `.skip()`
  - the valid half: `stepReview.integration.test.ts`'s docblock still claimed the contract runs on
    every ci run. repaired to name the live tier and the per-given gate
- **rework**: dirty — to un-gate reverses F16 (a) across 18 suites; only the foreman may
- **confidence**: 90%

### r3 mech-external-contracts nitpick.1 — the firewall case2 fixture key

the same concern as r9 blocker.1 above, at nitpick grade; the same hold.

### r4 ergo-acceptance-journey-coverage blocker.2 · r2 ergo-contract-snapshots nitpick.2 · r8 mech-test-intent nitpick.1 — the firewall case2 fixture key

the same concern as r9 blocker.1, from three lanes; the same hold. r2 and r8 each grant the
reason (the firewall grants on presence, no openrouter call) and ask only that the tradeoff be
on record: this entry and case2's `.note` are that record. no test proves a CI-supplied secret
flows through `keyrack firewall` end to end; the real provider call lives in the `BRAIN_LIVE`
suites.

### r4 ergo-acceptance-journey-coverage blocker.1 — the live-brain gate defers the journeys

the same concern as r3 blocker.1; the same hold. the gate is F16 (a), the foreman's verdict.

### r4 ergo-acceptance-journey-coverage nitpick.1 — the partition-journey snapshot names dropped

- **the claim**: three `[case1]` snapshots of `driver.route.partition-journey` lost their hint
  names; keep the names and keep the journey live
- **taken**: dispute. the journey drives a brain, so F16 (a) gates it. jest credits a skipped
  given's unnamed keys and never its named ones, so the named keys read obsolete and the keyless
  run fails with 0 failed tests (the yield's gap row names it). the hint names were dropped and
  the stored keys renamed; the bytes are unchanged
- **rework**: clean — restore the three names once the gate lifts, or once jest credits named keys
- **confidence**: 85%

### r7 mech-given-when-then nitpick.1 — `stepReflect.caseProseAuthor` acts in the given

- **taken**: dispute, out of scope. the act in `useBeforeAll` under `given.repeatably` is the
  shape on `origin/main`; this diff only adds the live-brain gate (`git diff origin/main` on the
  file: the import and `describeIfBrainTest`). a reshape of a live-brain suite the keyless run
  cannot exercise belongs to a change that can prove it
- **rework**: clean
- **confidence**: 85%

### r7 mech-given-when-then nitpick.2 — nine unit suites use `describe` + a `TEST_CASES` table

- **taken**: dispute. each is a pure transformer, and `rule.prefer.data-driven` (mechanic) prefers
  exactly this shape for transformer unit tests: a `TEST_CASES` array mapped to `test()` under one
  `describe`. `rule.require.given-when-then` expects bdd for unit tests; the data-driven rule is
  its named exception for caselists, and the repo holds both shapes side by side
- **rework**: clean — nine files, mechanical
- **confidence**: 80%

### i004 r12 enroll-verif-test-intent blocker.3 — the firewall case2 key is a fixture

the same concern as r9, r3, r4, r2, and r8 in i001; the same hold (the first section above). the
key is the input under test, not a faked credential: the firewall grants on a key's presence and
calls no provider, so a fixture key proves the grant and a real one adds no assertion.

### i004 r12 enroll-verif-test-intent blocker.5 — `stepReview.integration` case4 reshaped to `when.repeatably`

- **the claim**: the case went from `when` to `when.repeatably(REPEATABLY_CONFIG)` with no stated
  test reason
- **taken**: dispute. the case drives a brain: the `--output` write lands only after the brain
  replies, which the comment added beside it says. a live-brain case owes `when.repeatably`
  (`rule.require.repeatable-for-llm-tests`), and F16 (a) gates it per given. the
  `permission denied` assertion is unchanged
- **rework**: clean — one wrapper
- **confidence**: 85%

### i004 r12 enroll-verif-test-intent nitpick.6 — three smaller reshapes, intent kept

- **taken**: dispute. the reviewer grades each one as intent kept. `getOneReviewCountsViaBrain`
  case1 short-circuits before the brain (line 229), so its title now says what it proves. the
  partition-journey keys are the r4 i001 hold above
- **rework**: clean
- **confidence**: 85%

### i004 r10 enroll-verif-snapshot-coverage nitpick.1 — an own-role pursuit through rhx

- **taken**: dispute. the own, linked, and native kinds part in `getOneEducationRole`, below the
  cli. `rhx` hands the face one arg for each kind (`--for <slug>`), so the harness seam an
  acceptance journey proves is the same one case4 already crosses with a native role. the kind
  label is pinned at op grain (`getOneEducationRole.integration.test.ts`), and the own init render
  is snapped in-process (faces `[case6]`)
- **rework**: clean — one more acceptance given with an own-role fixture
- **confidence**: 85%

### i004 r11 enroll-verif-snapshot-blemishes nitpick.5 — `drive it as` names researcher

- **taken**: dispute. `asEnrollRoles` names `researcher` beside `learner` and `driver`, and all
  three ship in this one package (`src/domain.roles/researcher`). a repo that links the learner
  from `rhachet-roles-bhrain` installs the researcher too, and links it once `rhx init --roles`
  names it; the case fixtures link a subset only as a test shortcut. the label `drive it as`
  names the next move, so a verb phrase fits it
- **rework**: clean — rename the label, or drop `researcher` from the line
- **confidence**: 80% — whether `rhx enroll` refuses a role that ships but is unlinked is unread

### i004 r11 enroll-verif-snapshot-blemishes nitpick.6 — the ragged indent in the `2.2 held` guide

- **taken**: defer, with a dream (`.dream/v2026_11_27.fix.guard-say-parse-steps-continuation-lines.md`).
  the step comes from the guard `say` parse, which serves every route; a fix resnaps snapshots
  across the driver's suites and fails CLEAN for this round
- **rework**: dirty — a parse change with a repo-wide resnap
- **confidence**: 90%

### i004 r11 enroll-verif-snapshot-blemishes nitpick.8 — F26 and F14 ids in snapshot keys

- **taken**: dispute. both givens pin a known defect on purpose, so the day the upstream fix lands
  the snapshot goes red and names the fulcrum and the reseed dream to retire. the id in the key
  is that pointer; it leaves with the given when the dream closes
- **rework**: clean — rename two givens
- **confidence**: 85%

### i004 r11 enroll-verif-snapshot-blemishes nitpick.9 — the learner boot at 9,986 of 10,000 tokens

- **taken**: defer. the open dream `followup.pedigree-index-boot-mass` holds it. the cap is the
  guard that fires when the next brief lands, which is the moment the followup is owed
- **rework**: dirty — a boot-spec reshape across the learner's briefs
- **confidence**: 85%

### i005 r12 enroll-verif-test-intent blocker.3 — the firewall case2 fixture key, again

the same concern and the same hold as the first section. the reviewer's fix (gate a real-key
twin under `RUN_BRAIN_TEST`) would add a given that, like the fixture one, proves a grant on
presence; the firewall calls no provider either way.

### i005 r10 enroll-verif-snapshot-coverage nitpick.4 — no rhx journey for vision cases 2, 3, 6

- **taken**: dispute. each case is tested and snapped at the face grain in-process: the bare
  `pedigree get` (faces case1 t5, case5 t0), the `pursuit init` re-run (faces case4 t1, journey
  case1 t2), and the refuted claim at exit (templates case2 t11). the harness seam `rhx` adds is
  arg transport, which the acceptance journey proves for each face on its critipath. a second
  rhx pass per alterpath adds ~60s of acceptance wall time per case and no new arg path
- **rework**: clean — three more acceptance givens
- **confidence**: 80%

### i005 r11 enroll-verif-snapshot-blemishes nitpick.5 and nitpick.8 — rhachet's own renders

- **taken**: defer, with a reseed dream
  (`.dream/v2026_11_27.reseed.rhachet-mod-refusal-and-tip-shapes.md`). the mod refusal, the empty
  `artifacts` branch, and the init tip are each printed by rhachet; this repo snaps them as they ship
- **rework**: dirty — an upstream change, then a resnap of three suites here
- **confidence**: 90%

### i005 r11 enroll-verif-snapshot-blemishes nitpick.6 — `drive it as` names researcher, again

the same hold as `i004 r11 nitpick.5`, its claim corrected above: the package installs the
researcher, and an init that names it links it. whether `rhx enroll` refuses a role that is
installed but unlinked is unread, which is why the confidence stays at 80%.

### i005 r11 enroll-verif-snapshot-blemishes nitpick.7 — the guide defect in six snapshot keys

the blast radius of the deferred dream `guard-say-parse-steps-continuation-lines`, held above
(`i004 r11 nitpick.6`). the six keys are the case4 holds r11 asked for in i004; they churn once,
when the dream's fix lands, and show the repair as it lands.

### i006 r11 enroll-verif-snapshot-blemishes nitpick.1 — init names enroll and the wish as two rows

- **taken**: hold. `drive it as` is the role's enroll line, shared with `rhx route.drive`'s own
  shape; `next:` is the drive. the order reads top to bottom (enroll, then wish, then drive). a fold
  of the enroll line into `next:` rewrites the init face in ~20 snapshot keys across faces and
  journey for a read order the tree already gives
- **rework**: clean — one render, then a resnap
- **confidence**: 75%

### i006 r11 enroll-verif-snapshot-blemishes nitpick.3 — a refusal's `reason` carries `; run:`

- **taken**: hold. the reason is the judge's yield, read by `route.drive` as one string; rhachet
  renders it once as `reason:` and once in stderr. a split into `reason` + `fix` needs a judge
  contract with a fix field, which rhachet's judge reader does not hold. `[case1][t1]` is an
  education face refusal (a ConstraintError with a `hint`), so its `fix:` row is a different render
- **rework**: dirty — a judge contract field upstream, then each judge here
- **confidence**: 80%

### i006 r11 enroll-verif-snapshot-blemishes nitpick.6 (the table label half) — two tables, one unlabeled

- **taken**: hold the label; the stub half is repaired (the fixture brief carries one line of
  content). the second table is the course's yields; a label inside the booted entry changes the
  pedigree entry format, which every stamped entry and four snapshot suites carry
- **rework**: clean — one transformer, then a resnap
- **confidence**: 75%

### i006 r12 enroll-verif-test-intent blocker.3 — the firewall fixture key

the same hold as `i005 r12 blocker.3`: the firewall grants on presence and calls no provider.

### i006 r12 enroll-verif-test-intent nitpick.1 and nitpick.2 — the retitle and the label renames

- **taken**: hold. the retitle states what the case proves (empty content returns before a brain
  call, which the reviewer confirms); the renames are byte-identical keys under a gate F16 ordered,
  and `[case9.1]` parts the keyless branch of `[case9]` from its live-brain branch
- **rework**: clean — a rename
- **confidence**: 90%

## .verdict

open, the council rules at the close.
