# F3 — author time stays blind to reach

**rework** = clean · **status** = open · **confidence** = 75%

## .the fork, stated fairly

surfaced by the hidden-dimension check in `1.vision.experience.dimensions.md`.

an author writes `brain:` into a guard for a route whose driver is **unenrolled**. that field can
never apply. should the author surface say so at write time?

- **blind** — author time writes text; reach is read only at apply time
- **warned** — `route.mutate.guard` checks reach and warns when the field cannot land

## .taken, and why at the time

**blind, for this route.** the failure is caught at apply time by `F1`'s halt, which is loud and
teaches the fix. an author-time warn moves the catch earlier; it does not add a catch.

## .the counter-case, stated fairly

⚠️ **earlier is cheaper, and `rule.prefer.prevent-over-correct` says so directly.** a warn at write
time costs the author one line; the apply-time halt costs a stalled drive.

and the warn would be **honest**: it is not a prediction. the reach state is readable at author time
by the same `clone whoami` the hook uses.

⇒ the case against is narrower than it looks: reach at author time is not reach at apply time. a
guard authored on an unenrolled drive may be applied on an enrolled one — that is the normal case
for a template. **a warn that fires on every template author is noise**, and noise trains a reader
to skip the surface where `F1`'s real halt will later appear.

## .rework, and why

**clean, and additive.** a warn can be added later with no change to the guard schema, the parser, or
the hook. no artifact and no caller depends on its absence.

## .confidence, and why 75%

the noise argument is real but it is reasoned, not measured — nobody has counted how often a guard is
authored on a drive whose reach differs from the drive that will apply it. a scoped warn (only when
the route is bound to THIS drive) would likely dodge the noise entirely, and was not explored.

## .where

`1.vision.experience.dimensions.md` — the hidden-dimension check.
`1.vision.experience.case=_.md` — slices 1 and 4, `other-known × unenrolled`, itemized.

## .the verdict

open — for the fulcrum council.
