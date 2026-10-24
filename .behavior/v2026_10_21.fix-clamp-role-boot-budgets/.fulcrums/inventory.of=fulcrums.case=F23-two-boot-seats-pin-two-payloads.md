# F23 — two boot seats pin two payloads

## .the fork

the driver's boot is snapped in two suites: the clamp (`roleBootClamps.integration.test.ts`, which
boots a copy of `src/domain.roles/driver`) and the consumer seat (which boots the built `dist`
through `roles link`). their token counts differ by 46. a reviewer asked whether one figure should
be pinned in both.

## .taken, and why

each suite pins its own seat's payload. the src copy and the dist build are two artifacts; a `.min`
compiled into dist is not byte-equal to the src seat the clamp reads. each figure sits under the
declared budget, which is the claim either suite exists to hold.

## .rework

clean. to pin one figure would mean a shared constant read by both suites — one file, no callers.

## .confidence

85%. the gap is a build artifact, not a drift inside one clamp; if the council wants one figure,
the rework is a constant.

## .status

open — for the council.
