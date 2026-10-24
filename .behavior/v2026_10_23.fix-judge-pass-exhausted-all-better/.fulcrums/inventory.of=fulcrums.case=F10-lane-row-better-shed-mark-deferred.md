# F10 — the lane row's conceded-better shed mark is deferred

## .the fork

r11 nitpick.1 at i004: an allowed render shows an exhausted lane as `2 blockers 🔴` while the
judge passed it on a conceded-better shed. a dispute shed marks the row (`1 disputed → 0 tallied ✓`);
a better shed does not.

- **A** — teach the lane-row renderer a better-shed mark in this route
- **B** — defer it to a dream; the judge's own line already names the shed

## .taken — B, and why

- the row renders from `GuardPeerMeterStatus`, which carries a disputed count and no conceded
  count; the mark needs a new field fed from the absorption read into every meter producer, plus a
  resnap of every journey that renders a lane row — a ripple past this diff
- the gap pre-dates this route (`driver.route.concession-exhaustion-severity` snaps it on main)
- the judge row already reads `after 3 blockers shed (0 disputed + 3 conceded better)`

## .rework — dirty

the meter shape is read by the guard tree, route.drive, and the halt renderers.

## .confidence — 75%, and why it is low

a reader of an allowed stone still sees red counts on two rows; the council may judge that worth
the ripple now.

## .where

`src/domain.operations/route/guard/tree/formatGuardTree.ts` (`GuardPeerMeterStatus`).
dream: `dreams/v2026_10_23.fix.lane-row-marks-a-conceded-better-shed.md`.

## .verdict

B taken; open — for the council.
