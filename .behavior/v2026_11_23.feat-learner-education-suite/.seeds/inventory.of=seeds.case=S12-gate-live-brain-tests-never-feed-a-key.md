# seed S12 · gate-live-brain-tests-never-feed-a-key

## .said

> five live-brain api keys (openrouter, openai, anthropic, tavily, xai) are not owed by a human: a test that needs a live brain is gated, never fed a key (bulletin live-brain-tests-three-tiers). drive the mechanic to gate those integration cases so the suites run green without them, settle F8 and F11 with your reasons in their fulcrum entries (F11 names a prod import of a dev dependency: a real defect to fix, not a question for the human), then arrive stone 5.1.

## .source

the human, relayed by the foreman, 2026-11-26. supersedes S11's key halt.

## .settled

- a live-brain test is gated on `RUN_BRAIN_TEST` (`BRAIN_LIVE === 'true'`), never fed a key; a keyless run is green
- the jest env files and brain global setup ask for brain keys only when the gate is on
- F11 is a defect to fix: a runtime import of a dev-only dependency
- F8 and F11 settle in their fulcrum entries; the key halt retires; 5.1 arrives

## .landed

| where | what |
|---|---|
| `src/.test/utils/RUN_BRAIN_TEST.ts` + every live-brain integration case | the gate |
| `.fulcrums/` F8, F11 | the verdicts |
| `5.1.execution.from_vision.yield.md` | the keyless pass lines |
| `src/.test/forbidDevDependencyImportsInProd.integration.test.ts` | the F11 clamp |
| `archive/blocker.5.1.execution.from_vision.retired-by-the-gate.md` | the retired key halt |
| `dreams/v2026_11_26.feat.port-live-learner-into-repo.md` | the F8 port, caught |
