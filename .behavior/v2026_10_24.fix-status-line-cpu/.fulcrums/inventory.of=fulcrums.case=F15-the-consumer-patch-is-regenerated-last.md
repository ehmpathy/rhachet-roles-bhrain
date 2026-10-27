# F15 — the consumer patch is regenerated as the last act before the commit

- **the fork:** the patch in `appendix/` is a copy of the build, so it goes stale on each later code
  edit. (a) a permanent acceptance test that regenerates the patch and diffs it against the file ·
  (b) regenerate it last, after the final code edit and the final build, and verify with the skill
- **taken:** (b). the patch is a route artifact that lives only until the release lands; a test in
  `blackbox/` over a file in `.behavior/` would break the day the route is archived, and would bind
  every later pr to a release that already shipped. the skill itself verifies the patch applies
  to the published base on each run
- **against:** no test fails if a later edit lands without a regen. the guard is the order of acts
  in the done gate, which a human must trust
- **and:** `git apply --check` proves the patch applies, never that pnpm installs it. the done gate
  runs `rhx prove.consumer-patch`, which installs it as a consumer would and repaints twice; its
  first run found the refusal F35 cures
- **rework:** clean — the test is one case beside `[case10]` in `gen.consumer-patch.acceptance`
- **confidence: 80%**
- **where:** `appendix/rhachet-roles-bhrain@0.42.1.patch`, `5.1.execution.from_vision.yield.md`
