# F036 — skeptic sits in prepare:rhachet

- **fork**: add `skeptic` to the `prepare:rhachet` role list, so every seat of this repo boots it; or leave this repo's seats without it
- **read**:
  - `package.json` `prepare:rhachet` already lists this repo's own roles: driver, reviewer, librarian, learner, achiever, telepath, beside the dependency roles
  - rhachet's enroll takes the linked set as its default roleset, so the list is this repo's every-seat set (F14)
  - the role's checks fail open on their own fault (exit 1, F29) and refuse a turn twice at most, so a seat is never wedged (`skeptic.stop.dispatch` case1 `[t1]`, case3)
- **taken**: add it, beside `learner`. none of this repo's own roles is held out of the list, and no trait of skeptic differs: it is a bhrain role, registered in `getRoleRegistry.ts`, and the wish asks for every seat (F14)
- **rework**: clean — one word in one npm command
- **confidence**: 85%; the first enrolled seat will meet the Stop checks on its own replies, which is the point and also a cost
- **where**: `package.json` `prepare:rhachet`. the hook manifest regenerates at the next `npm install` (the `prepare` command); a raw `npm run prepare:rhachet` is not paved for the driver
- **verdict**: settled by the driver on precedent (seed S11)
- **foreman, 2026-11-26 (peer i004, r011 #5)**: the list now reads main's nine roles plus `skeptic`, which is right: the seven other roles added beside it were scope, not this wish. two loose ends:
  - the `.read` above is now stale: it names achiever and telepath as in the list, and they are not. revise it to state the current list
  - the scope leak's last piece: the 🧭 navigator row in `readme.md`, and wherever this branch added it to `define.bhrain-repo-mascot.md` and the glyph catalogs. main's register has no navigator, and no seed of this route names one. drop it; keep the ❓ skeptic row
