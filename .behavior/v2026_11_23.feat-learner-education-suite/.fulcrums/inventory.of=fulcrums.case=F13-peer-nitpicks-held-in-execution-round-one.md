# fulcrum F13: peer nitpicks held in execution

## .the fork

nitpicks from the peer rounds of `5.1.execution.from_vision` each offer a change. for each: take
the change, or hold the current shape and say why.

## .taken — hold each row below

| round | lane | concern | held because |
|---|---|---|---|
| 1 | mech-decode-friction | nitpick.1 — `getOneSlugNearest` rank inline | it is itself the named transformer for the rank; callers read one call |
| 1 | arch-opport-decomposition | nitpick.1 — `getOneCourseProof` fuses four subjects | each subject reads through a named leaf; four exported getters would each have one caller (`rule.prefer.wet-over-dry`) |
| 1 | arch-opport-decomposition | nitpick.2 — `genRouteFromTemplates` mixes read and write | its reads exist only to feed its writes; the result shape work moved to `asFilesPartedByCreation` |
| 1 | arch-hazards-maintenance | nitpick.1 — if-throw over `.assure` | the refusal carries `manifestPath` and a `hint`; `assure` carries neither (`rule.require.errors-name-the-fix`) |
| 1 | arch-hazards-maintenance | nitpick.3 — module-scope cache map | its `.note` states why one cache per repo dir is required; growth bounded by repo dirs per process (one) |
| 1 | ergo-friction-hazards | nitpick.1 — all-caps constant file names | the file name equals the constant it exports (`rule.require.sync-filename-opname`) |
| 3 | mech-decode-friction | nitpick.1–5 — a single `.map`, `??`, or spread in a leaf (`initPursuitRoute` slug default, `getAllStonesUnpassed`, `getAllPedigreeEntries`, `getAllCourseRoutes`, `genRouteFromTemplates`) | each sits in a leaf whose name already states what it produces; one more transformer per `.map` adds a hop and no sense. the orchestrator-grade friction (blockers 1–5) is repaired |
| 3 | behavior-intent-coverage | nitpick.1 — the course-reopen no-op path (`courseFound`, open) has no direct case | the normal push and pop never reach it: within a course a re-init refuses, after exit it refuses. the path only guards a bind moved back by hand; its no-op is the findsert of `genRouteFromTemplates`, which the pursuit re-run case covers |
| 3 | behavior-intent-coverage | nitpick.2 — `pursuit init` with no `--course` is not snapped | the `(none; 1.courses.plot plots them)` line is one branch of `asCoursesSeededItems`; a face case needs a second pursuit on a fresh branch. low gain against the faces suite's current arc |
| 3 | behavior-intent-coverage | nitpick.3 — the course skill header lists the pursuit's criteria | misfire: that line is in `education.pursuit.sh`, the pursuit face, where `courses-exited|pedigree-stamped` is correct. `education.pursuit.course.sh` names no judge |
| 3 | ergo-friction-hazards | nitpick.1 — a caller `--role` before the verb is peeled as harness | the documented and help-shown order is verb first (`init --role …`); the harness head and a caller's first `--role` are the same tokens, so to part them needs the harness to mark its own block. a reseed to rhachet, not a guess here |
| 3 | ergo-friction-hazards | nitpick.2 — `stepReview` `[case9]` `[t0]` enumeration skipped by the group gate | the gate wraps the `given` that builds the brain context its `when`s share; the `[t0]` enumeration is a fixture sanity check, not a behavior of the contract |

## .rework

clean. each is a local edit in one file (or a rename of three constant files), with no caller
built on the held shape.

## .confidence

80%. the weakest hold is the round-3 `pursuit init` no-course snapshot: it is a real face
variant, held only for cost.

## .where

- `src/domain.operations/education/{getOneSlugNearest,getOneCourseProof,genRouteFromTemplates,getOneRepoManifest,getOneRouteBindSwapCache,initPursuitRoute,initCourseRoute,getAllStonesUnpassed,getAllPedigreeEntries,getAllCourseRoutes}.ts`
- `src/domain.operations/education/{STONE_OF_EXIT,DIR_OF_COURSES,COLUMNS_OF_PEDIGREE_COURSES}.ts`
- `src/contract/cli/asEducationArgs.ts` · `src/domain.operations/review/stepReview.integration.test.ts`

## .verdict

open — the council at the close rules.
