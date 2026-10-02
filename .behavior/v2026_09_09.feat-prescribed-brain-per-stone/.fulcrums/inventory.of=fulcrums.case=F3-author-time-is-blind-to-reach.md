# F3 — author time stays blind to reach

**rework** = clean · **status** = open · **confidence** = 75%

## .the fork

an author writes `brain:` into a guard on a route whose driver is unenrolled, so the field can never
apply. should `route.mutate.guard` warn at write time?

## .taken, and why

**blind.** `F1`'s halt catches it at apply time, loud, with the fix. a write-time warn moves the catch
earlier and adds none.

## .the counter-case

earlier is cheaper (`rule.prefer.prevent-over-correct`), and reach is readable at write time. the
case against: a template authored on one drive is applied on another, so a warn on every author is
noise that trains a reader to skip the surface. a warn scoped to a route bound to this drive may
dodge the noise, and was not explored.

## .rework

clean and additive — no schema, parser, or hook change.

## .where

`1.vision.experience.dimensions.md` — the hidden-dimension check; slices 1 and 4 of `case=_`.

## .the verdict

open.
