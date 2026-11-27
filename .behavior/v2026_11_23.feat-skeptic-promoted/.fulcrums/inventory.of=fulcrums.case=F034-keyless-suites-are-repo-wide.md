# F034 — keyless suites are repo-wide, and each live brain demands its key

- **fork**: scope the lenient keyrack source to a jest project for `domain.roles/skeptic/**` with the repo default strict, as the arch reviewer asks; or source leniently for every suite and move the demand to the one place a live brain is built
- **read**:
  - seed S10: suites that call no model run green with no brain key set; a suite that calls a live brain still demands its key
  - `src/.test/genTestBrainContext.ts` throws `ConstraintError` with the absent key and the `rhx keyrack set` fix; clamp `genTestBrainContext.integration.test.ts`, red at 2026-11-25  then green
  - strict mode calls `process.exit(2)` on the whole jest run at setup, so before the cure a pure-bash suite died with no test run
- **taken**: repo-wide leniency plus the per-brain demand. the demand sits where the key is consumed, so no live-brain suite can pass keyless. a per-project scope would keep every other pure suite dead on a keyless box, which is the defect S10 names
- **rework**: clean — one jest project entry, and the strict source moves back to it
- **confidence**: 85%
- **where**: `jest.integration.env.ts`, `jest.brain.globalSetup.ts`, `src/.test/genTestBrainContext.ts`, `src/.test/asTestBrainKeyName.ts`
- **verdict**: settled by seed S10 (the commander's verdict); disputed by peer i003 r011
