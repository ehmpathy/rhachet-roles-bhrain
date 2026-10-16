# seed S44 — partitions are overlapped file sets, declared per reviewer by one command; overlap is computed and flagged

archived verbatim, before distillation. typos and profanity repaired. a run of corrections after
the driver's partition proposals read as unclear — first a coined synonym (`unit`), then flag pairs
argued from a backcompat the behavior does not have.

## .said

> seems confused to me right now
> lets make it clearer

> we are literally establishing a new pattern here, so don't talk to me about backcompat

> there is no backcompat

> it's a net new behavior

> i have no idea what you're proposing
> it's unclear
> what the [placeholder] is a unit
> i've never heard of a more ambiguous term

> ok, the point is, when a review target is too big, we need to be able to specify how it can be partitioned; each partition set may have overlaps (and users should be guided to ensure they include proper overlaps)

> and we auto compute the overlaps
> right?

> so someone has a guard that says mech-xyz; it refuses says too much context, and guides to declare partitions, for which the users run `rhx review.partition isolate --which $reviewer --xyz` or something like that

> and if there is nothing common, we should flag it. and if the bound route is not common, we should flag it - cause the route is almost always shared context

> the route is typically the spec

> and how will they update a partition after they set one? if they forget to add some

> ok, so it needs a slug

> route.guard.review.partition ?

> what are the review budget operations like

> did we name the command symmetrically to the budget operations ?

> ok, route.guard.partition --for review --peer then

> yeah

> hold on. did you enforce that it fails fast if the bound route is not common in a partition?

> that's a core requirement

> and shouldn't review partitions be workable even without routes?

> ie., it's a generic review primitive

> yeah

> so how would that work what's the ergonomics there

> i like it, except common and narrow should be explicit peer branches, with the slugs and contents subbranches

> yep, let's enbrief so that folks enrolled with reviewer know how to use these two partition schemes. i.e., via direct review primitive and dynamic route.guard.partition

> demonstrate how this would look with multiple subglobs per narrow slug

> seems weird. let's make subbranches of globs vs cost?

> yep, i like that

## .settled

- 🔴 **a partition is a set of files the caller declares; sets may overlap, and should.** each
  partition holds all its own files need to be judged alone — the code they import, the subject
  their tests exercise
- 🔴 **overlap is computed, never declared.** a file in two or more partitions is `common`; a file
  in one is `narrow` (S38). common leads each prompt, so it is cached once
- 🔴 **one command declares them, on one reviewer of a guard**, guided to by the overflow refusal.
  shape settled: `rhx route.guard.partition --for review --peer <slug> --stone <s>`, symmetric with
  `rhx route.guard.budget --for review --peer <slug> --stone <s> --add N`. the verb rides as a flag,
  as budget's does: bare shows the split, `--set <slug> --globs '<globs>'` upserts one partition,
  `--del <slug>` removes one; plan by default (each partition's files and tokens, the common set,
  unclaimed files), apply to write it onto that reviewer's line
- 🔴 **flag an empty common set** — partitions with no overlap are almost never truly independent
- 🔴 **FAIL FAST on a bound route absent from any partition — a core requirement, never a warn.**
  the route is typically the spec a reviewer grades against, so a partition without it grades
  blind. the refusal (exit 2) fires at `--set` plan time AND at review time (a guard edited by hand
  must not slip past it), and names each partition that lacks the route plus the glob to add.
  the driver first wrote this as a warn; corrected. **conditional on a bound route**: no route bound,
  no route check
- 🔴 **partitions work without a route.** the primitive lives on `rhx review` itself
  (`--partition '<slug>=<globs>'`, repeatable), so a hand run or a ci job can split. the guard
  command is a convenience that writes those flags onto one peer's line
- 🔴 **each partition has a `--slug`**, so it can be updated after it is set: `get` shows the split
  against today's targets; `set --slug <s> --globs '<globs>'` upserts that one partition whole;
  `del --slug <s>` removes it. the slug names its log dir and its report section too
- 🔴 **a forgotten file is caught every run, not once at `set`** — the branch grows after the
  declaration, so a target in no partition refuses the run and names the `set` command that adds it
- 🔴 **the split renders `common` and `narrow` as explicit PEER branches**, each partition slug a
  sub-branch of `narrow`. each slug (and `common`) splits into two sub-branches: `globs` — the
  declaration verbatim, no figures — and `cost` — `narrow`, `common`, and the `total` checked
  against the window. a slug's `common` figure is the shared files THAT partition carries
- **no backcompat**: a net new behavior is designed as if no prior form existed
- 🔴 **no coined synonyms in a design pitch** — `unit` for `partition` made the proposal unreadable

- a common file is **graded once**, in the first partition that lists it, and read as context in
  the rest — so a concern is never counted twice (the driver's default, accepted)
- `route.guard.partition --set` is **driver-owned**, as the budget lever is; its plan makes the
  change visible first (the driver's default, accepted)
- a file in no partition, or a partition that still overflows, refuses (exit 2)
- 🔴 **enbrief both forms for every reviewer-enrolled reader** — the primitive on `rhx review`, and
  the guard convenience `route.guard.partition`

## .landed in

- `src/domain.roles/reviewer/briefs/howto.partition-an-overflowed-review.md` — both forms, rewritten
- `src/domain.roles/reviewer/briefs/review.tactics.md` — the overflow lever row
- `src/domain.roles/driver/briefs/rule.always.diagnose-reviewer-malfunctions.md` (+ `.min`) — the lever table
- (owed) the code: `--partition` on `rhx review`, `rhx route.guard.partition`, the refusals — it
  supersedes the `--partitionable` first-match + `(rest)` form and the auto-shared route spec
