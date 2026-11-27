# F18: the round-four peer nitpicks held, each with its reason

- **fork**: each nitpick below asks for a reshape that changes no behavior, or for coverage of a row with no defect found. (a) take each now · (b) hold each with its reason, and let the council rule
- **taken**: (b). each is a multi-file reshape of extant, clamped code; none ships a harm a user meets. they ride a later round where the reshape is the subject, rather than a fix round where each one widens the diff the reviewers read
- **rework**: clean. each is a reshape behind the same contracts and tests
- **confidence**: 75%

| reviewer | concern | held because |
|---|---|---|
| r010 enroll-impl-behavior-intent | nitpick.4: a malformed yield surfaces only at `4.graduate` | the pedigree read refuses it loud, with the yield and the columns expected; a shape check at `exit` would duplicate the reader. the template conformance test now holds the shapes the stones teach |
| r010 | nitpick.5: inventory rows i13, c8, g4, s3–s7, a malformed course slug have no clamp | the half-swap row now has one (`setRouteBindSwap`); the malformed slug is refused in `initCourseRoute` before any write; the concurrency rows rest on `withSimpleMutex`, clamped upstream |
| r010 | nitpick.7: the `0.wish.md` aim placeholder has no gate | the aim is the director's prose; a gate on prose would be a judge on a placeholder string, which a driver can type past |
| r011 enroll-impl-arch-defects | nitpick.1: one role resolver | `getOneEducationRole` is the one lookup; `getAllRolesFound` serves only the refusal's list. a merge is a reshape with no defect |
| r011 | nitpick.2: judges as a map | three criteria, each a guarded branch with its own clamp; the type union bounds the set |
| r011 | nitpick.3: move the swap into `route/bind/` | its only callers are education's push and pop (`rule.prefer.most-common-denominator`: lift on the second caller) |
| r011 | nitpick.4: one runner for the three faces | three faces, each 25 lines of dispatch; wet over dry until a fourth face lands |
| r011 | nitpick.5: shared shapes as domain objects | `EducationRole`, `CourseRoute`, `CourseProof` are i/o shapes of their operations (`rule.forbid.io-as-domain-objects`); `PedigreeEntry` already is a `DomainLiteral` |
| r011 | nitpick.6: pedigree names in one home | `asPedigreeDir`, `asPedigreeEntryName` hold the two; the index name is one literal at one write site |
| r011 | nitpick.7: `setPedigreeEntry` fuses a boot-spec write and an `fs.mkdir` | the boot write is its own operation (`setBootSpecNamesPedigree`); the mkdir is one line before the entry write |
| r011 | nitpick.8: `getOnePursuitLatest` mixes reads with policy | the policy is lifted (`asPursuitOfSlugLatest`); the read is two lines |
| r011 | nitpick.9: `getOneCourseProof` re-reads the plot per course | a plot is a small file and a pursuit holds a handful of courses; no cost was measured |
| r011 | nitpick.10: lift `genFile` out of `learn/` | two domains import it; a lift moves a file every learner import names, a reshape for its own round |
| r011 | nitpick.11: boot-spec text surgery | the splice keeps comments, which a yaml round trip drops; the linked-role journey now parses the result with js-yaml and asserts each path sits under `always.briefs.say` and `ref` |
| r011 | nitpick.14: rhachet layout paths in two files | two read sites of one external contract; a module of two constants is held until a third site |
| r011 | nitpick.18: no vision case for a course re-open; case=3 has no direct test | a re-open is `course init` of the open slug, which the stray-course journey runs; case=3's re-run is now clamped in the journey (pursuit init inside its own course) |

- **where**: `.reviews/peer/5.1.execution.from_vision._.review.i004.*.r010.*` · `…r011.*`
- **verdict**: open. the council rules at close
