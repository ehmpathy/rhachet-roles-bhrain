# F15 — the one repo-wide skip is held from main, not fixed in this route

- **the fork:** a repo-wide scan for `.skip(` / `.only(` finds one live skip:
  `src/domain.roles/thinker/skills/khue.diverge/stepDiverge.integration.test.ts:136`,
  `when.skip('goal is a statement', …)`. the stone says fix every skip, prior or not. (a) fix it
  here: move the thinker's statement-goal refusal from the prompt into code, then un-skip; (b) hold
  it, cite its dream, and say so in the yield
- **taken:** (b). the skip is on origin/main (1c890c3c, #692), not in this branch's diff. its
  inline header names the defect, and the dream
  `.dream/v2026_10_23.fix.thinker-guards-ask-the-brain-to-refuse.md` gives the fix's shape: a
  precondition check in code across four thinker steps and their templates. that is a change to
  thinker product behavior, in another role's bounded context, in a pr whose wish is the status
  line's cpu. it fails CLEAN (`rule.always.fix-forward-under-scouts-honor`): it ripples into four
  steps, four templates, and their brain-backed tests. the two other hits sit under `.scratch/`,
  which `jest.integration.config.ts` excludes (`'!**/.scratch/**'`), so they never run
- **rework:** clean to reverse — the thinker fix lands on its own pr; this route changes no line of it
- **confidence:** 85%. the doubt: the stone's text says to fix even prior skips. the call rests on
  scope, and the commander may rule the thinker fix rides along
- **where:** `src/domain.roles/thinker/skills/khue.diverge/stepDiverge.integration.test.ts:136`;
  dream linked at `$route/dreams/v2026_10_23.fix.thinker-guards-ask-the-brain-to-refuse.md`
